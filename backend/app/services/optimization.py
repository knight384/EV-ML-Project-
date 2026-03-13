"""
Optimization Engine for EV Charging Schedule

Uses CVXPY to optimize charging schedules that minimize:
1. Total charging cost (power * price)
2. Load variance (quadratic smoothing penalty for balanced grid load)

Subject to:
- Energy requirements (each EV must receive required energy)
- Charger power limits
- Grid capacity constraints
"""

import cvxpy as cp
import numpy as np
from datetime import datetime, timedelta
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass


@dataclass
class OptimizationSession:
    """Session data for optimization"""
    session_id: str
    charger_id: str
    arrival_time: datetime
    departure_time: datetime
    energy_required_kwh: float
    max_power_kw: float
    arrival_slot: int  # Time slot index for arrival
    departure_slot: int  # Time slot index for departure


@dataclass
class OptimizedSchedule:
    """Optimized charging schedule result"""
    session_id: str
    charger_id: str
    time_slots: List[datetime]
    power_allocations: List[float]  # Power allocated at each time slot
    total_cost: float
    peak_load: float


class ChargingOptimizer:
    """
    Optimizer for EV charging schedules using convex optimization.
    """
    
    def __init__(
        self,
        grid_capacity_kw: float = 200.0,
        time_slot_minutes: int = 60,
        alpha: float = 0.1,
        beta: float = 1000.0
    ):
        """
        Initialize optimizer.
        
        Args:
            grid_capacity_kw: Maximum grid capacity in kW
            time_slot_minutes: Time slot resolution in minutes (default: 60)
            alpha: Weight for peak load penalty in objective (default: 0.1)
            beta: Penalty weight for unmet energy (default: 1000.0, large to prioritize satisfaction)
        """
        self.grid_capacity_kw = grid_capacity_kw
        self.time_slot_minutes = time_slot_minutes
        self.alpha = alpha
        self.beta = beta
    
    def _create_time_slots(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> List[datetime]:
        """
        Create time slot list.
        
        Args:
            start_time: Start time
            end_time: End time
            
        Returns:
            List of datetime objects for each time slot
        """
        slots = []
        current = start_time
        while current <= end_time:
            slots.append(current)
            current += timedelta(minutes=self.time_slot_minutes)
        return slots
    
    def _map_sessions_to_slots(
        self,
        sessions: List[OptimizationSession],
        time_slots: List[datetime]
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Map sessions to time slot indices.
        
        Args:
            sessions: List of optimization sessions
            time_slots: List of time slot datetimes
            
        Returns:
            Tuple of (arrival_indices, departure_indices) arrays
        """
        arrival_indices = np.array([s.arrival_slot for s in sessions])
        departure_indices = np.array([s.departure_slot for s in sessions])
        return arrival_indices, departure_indices
    
    def _aggregate_to_hourly(
        self,
        data_curve: List[Tuple[datetime, float]],
        start_time: datetime,
        end_time: datetime
    ) -> List[Tuple[datetime, float]]:
        """
        Aggregate fine-grained data (e.g., 15-minute) to hourly averages.
        
        Args:
            data_curve: List of (timestamp, value) tuples
            start_time: Start time for hourly aggregation
            end_time: End time for hourly aggregation
            
        Returns:
            List of (timestamp, average_value) tuples at hourly resolution
        """
        # Round start_time to nearest hour
        start_hour = start_time.replace(minute=0, second=0, microsecond=0)
        
        # Create hourly bins
        hourly_data = {}
        current_hour = start_hour
        
        while current_hour < end_time:
            hourly_data[current_hour] = []
            current_hour += timedelta(hours=1)
        
        # Group data points into hourly bins
        for timestamp, value in data_curve:
            # Find which hour this timestamp belongs to
            hour_key = timestamp.replace(minute=0, second=0, microsecond=0)
            if hour_key in hourly_data:
                hourly_data[hour_key].append(value)
        
        # Calculate averages for each hour
        aggregated = []
        for hour_key in sorted(hourly_data.keys()):
            values = hourly_data[hour_key]
            if values:
                avg_value = sum(values) / len(values)
                aggregated.append((hour_key, avg_value))
            else:
                # If no data, use 0 or interpolate from neighbors
                aggregated.append((hour_key, 0.0))
        
        return aggregated
    
    def optimize_schedule(
        self,
        sessions: List[OptimizationSession],
        price_curve: List[Tuple[datetime, float]],
        base_load_curve: Optional[List[Tuple[datetime, float]]] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Tuple[List[OptimizedSchedule], Dict]:
        """
        Optimize charging schedule for given sessions.
        
        Mathematical formulation:
        Minimize: sum(power[t] * price[t]) + alpha * max(total_load[t]) + beta * sum(unmet_energy)
        
        Subject to:
        - Energy balance (soft): delivered_energy + unmet_energy = energy_required for each session
        - Power limits: power[session, t] <= max_power_kw for each session
        - Grid capacity: base_load[t] + sum(power[session, t]) <= grid_capacity
        - Time windows: power[session, t] = 0 if t < arrival or t >= departure
        - Unmet energy: unmet_energy >= 0 for each session
        
        Args:
            sessions: List of sessions to optimize
            price_curve: List of (timestamp, price_per_kwh) tuples
            base_load_curve: Optional base grid load (without EV charging)
            start_time: Start time for optimization horizon
            end_time: End time for optimization horizon
            
        Returns:
            Tuple of (optimized_schedules, metadata_dict)
        """
        if not sessions:
            return [], {"status": "no_sessions"}
        
        # Determine time horizon
        if start_time is None:
            start_time = min(s.arrival_time for s in sessions)
            # Round down to nearest time slot
            start_time = start_time.replace(
                minute=(start_time.minute // self.time_slot_minutes) * self.time_slot_minutes,
                second=0,
                microsecond=0
            )
        
        if end_time is None:
            end_time = max(s.departure_time for s in sessions)
            # Round up to nearest time slot using timedelta to avoid minute=60 overflow
            end_time = end_time.replace(second=0, microsecond=0)
            remainder = end_time.minute % self.time_slot_minutes
            if remainder != 0:
                end_time += timedelta(minutes=self.time_slot_minutes - remainder)
        
        # Create time slots
        time_slots = self._create_time_slots(start_time, end_time)
        num_slots = len(time_slots)
        num_sessions = len(sessions)
        
        # Aggregate price curve to hourly if needed (if optimizer uses 60-min slots)
        if self.time_slot_minutes == 60 and price_curve:
            # Check if price_curve is finer-grained than hourly
            if len(price_curve) > 1:
                time_diff = abs((price_curve[1][0] - price_curve[0][0]).total_seconds() / 60)
                if 0 < time_diff < 60:  # Finer than hourly, need aggregation
                    price_curve = self._aggregate_to_hourly(price_curve, start_time, end_time)
        
        # Map price curve to time slots
        price_array = np.zeros(num_slots)
        price_dict = {ts: price for ts, price in price_curve}
        for i, slot_time in enumerate(time_slots):
            # Find closest price point
            if slot_time in price_dict:
                price_array[i] = price_dict[slot_time]
            else:
                # Interpolate or use nearest
                closest_time = min(
                    price_curve,
                    key=lambda x: abs((x[0] - slot_time).total_seconds())
                )
                price_array[i] = closest_time[1]
        
        # Aggregate base load curve to hourly if needed
        if self.time_slot_minutes == 60 and base_load_curve:
            # Check if base_load_curve is finer-grained than hourly
            if len(base_load_curve) > 1:
                time_diff = abs((base_load_curve[1][0] - base_load_curve[0][0]).total_seconds() / 60)
                if 0 < time_diff < 60:  # Finer than hourly, need aggregation
                    base_load_curve = self._aggregate_to_hourly(base_load_curve, start_time, end_time)
        
        # Map base load to time slots (if provided)
        base_load_array = np.zeros(num_slots)
        if base_load_curve:
            base_load_dict = {ts: load for ts, load in base_load_curve}
            for i, slot_time in enumerate(time_slots):
                if slot_time in base_load_dict:
                    base_load_array[i] = base_load_dict[slot_time]
                else:
                    # Use nearest or interpolate
                    closest_time = min(
                        base_load_curve,
                        key=lambda x: abs((x[0] - slot_time).total_seconds())
                    )
                    base_load_array[i] = closest_time[1]
        
        # Create optimization variables
        # power[i, t] = power allocated to session i at time slot t
        power = cp.Variable((num_sessions, num_slots), nonneg=True)
        
        # Unmet energy slack variable for each session (soft constraint)
        unmet_energy = cp.Variable(num_sessions, nonneg=True)
        
        # Calculate total load at each time slot
        total_load = base_load_array + cp.sum(power, axis=0)
        
        # Calculate average load (for load smoothing penalty)
        avg_load = cp.sum(total_load) / num_slots
        
        # Constraints
        constraints = []
        
        # 1. Energy balance (soft constraint): delivered_energy + unmet_energy = required_energy
        slot_duration_hours = self.time_slot_minutes / 60.0
        for i, session in enumerate(sessions):
            # Energy delivered = sum of power * time_slot_duration_hours
            energy_delivered = cp.sum(power[i, :]) * slot_duration_hours
            # Soft constraint: delivered + unmet = required
            constraints.append(
                energy_delivered + unmet_energy[i] == session.energy_required_kwh
            )
        
        # 2. Power limits: charging power <= max charger power
        for i, session in enumerate(sessions):
            constraints.append(power[i, :] <= session.max_power_kw)
        
        # 3. Time windows: no charging before arrival or after departure
        for i, session in enumerate(sessions):
            # Before arrival
            if session.arrival_slot > 0:
                constraints.append(power[i, :session.arrival_slot] == 0)
            # After departure
            if session.departure_slot < num_slots:
                constraints.append(power[i, session.departure_slot:] == 0)
        
        # 4. Grid capacity: total load <= grid capacity
        constraints.append(total_load <= self.grid_capacity_kw)
        
        # Objective function
        # Cost component: sum over all sessions and time slots
        cost_component = cp.sum(cp.multiply(power, price_array))
        
        # Load smoothing penalty: minimize variance around average load
        # This encourages balanced load distribution and reduces peaks
        load_smoothing_penalty = self.alpha * cp.sum_squares(total_load - avg_load)
        
        # Unmet energy penalty (large weight to prioritize satisfying demand)
        unmet_penalty = self.beta * cp.sum(unmet_energy)
        
        objective = cp.Minimize(cost_component + load_smoothing_penalty + unmet_penalty)
        
        # Solve problem
        problem = cp.Problem(objective, constraints)
        
        try:
            problem.solve(solver=cp.ECOS, verbose=False)
            
            if problem.status not in ["optimal", "optimal_inaccurate"]:
                return [], {
                    "status": "failed",
                    "problem_status": problem.status,
                    "error": "Optimization did not converge"
                }
            
            # Extract results
            optimized_schedules = []
            power_values = power.value
            unmet_energy_values = unmet_energy.value if unmet_energy.value is not None else np.zeros(num_sessions)
            
            # Calculate actual total load values for reporting
            total_load_values = base_load_array + np.sum(power_values, axis=0)
            peak_load_value = float(np.max(total_load_values))
            avg_load_value = float(np.mean(total_load_values))
            
            total_cost = 0.0
            total_unmet_energy = 0.0
            
            for i, session in enumerate(sessions):
                power_allocations = power_values[i, :].tolist()
                session_unmet = float(unmet_energy_values[i])
                total_unmet_energy += session_unmet
                
                # Calculate cost for this session
                session_cost = np.sum(
                    power_values[i, :] * price_array * (self.time_slot_minutes / 60.0)
                )
                total_cost += session_cost
                
                schedule = OptimizedSchedule(
                    session_id=session.session_id,
                    charger_id=session.charger_id,
                    time_slots=time_slots,
                    power_allocations=power_allocations,
                    total_cost=float(session_cost),
                    peak_load=float(peak_load_value)  # Keep for compatibility
                )
                optimized_schedules.append(schedule)
            
            metadata = {
                "status": "optimal",
                "total_cost": float(total_cost),
                "peak_load": float(peak_load_value),
                "avg_load": float(avg_load_value),
                "load_variance": float(np.var(total_load_values)),
                "total_unmet_energy_kwh": float(total_unmet_energy),
                "num_sessions": num_sessions,
                "num_time_slots": num_slots,
                "time_horizon": (start_time, end_time)
            }
            
            return optimized_schedules, metadata
            
        except Exception as e:
            return [], {
                "status": "error",
                "error": str(e)
            }
    
    def compute_total_load_curve(
        self,
        optimized_schedules: List[OptimizedSchedule],
        base_load_curve: Optional[List[Tuple[datetime, float]]] = None
    ) -> List[Tuple[datetime, float]]:
        """
        Compute total load curve from optimized schedules.
        
        Args:
            optimized_schedules: List of optimized schedules
            base_load_curve: Optional base grid load
            
        Returns:
            List of (timestamp, total_load_kw) tuples
        """
        if not optimized_schedules:
            return []
        
        # Get time slots from first schedule
        time_slots = optimized_schedules[0].time_slots
        num_slots = len(time_slots)
        
        # Initialize total load array
        total_load = np.zeros(num_slots)
        
        # Add base load if provided
        if base_load_curve:
            base_load_dict = {ts: load for ts, load in base_load_curve}
            for i, slot_time in enumerate(time_slots):
                if slot_time in base_load_dict:
                    total_load[i] = base_load_dict[slot_time]
        
        # Sum power from all sessions
        for schedule in optimized_schedules:
            for i, power in enumerate(schedule.power_allocations):
                if i < num_slots:
                    total_load[i] += power
        
        # Create result list
        load_curve = [
            (time_slots[i], round(float(total_load[i]), 2))
            for i in range(num_slots)
        ]
        
        return load_curve


def create_optimizer(
    grid_capacity_kw: float = 200.0,
    time_slot_minutes: int = 60,
    alpha: float = 0.1,
    beta: float = 1000.0
) -> ChargingOptimizer:
    """
    Factory function to create an optimizer instance.
    
    Args:
        grid_capacity_kw: Maximum grid capacity
        time_slot_minutes: Time slot resolution (default: 60 for hourly)
        alpha: Load smoothing penalty weight (variance reduction)
        beta: Unmet energy penalty weight (large value to prioritize satisfaction)
        
    Returns:
        ChargingOptimizer instance
    """
    return ChargingOptimizer(
        grid_capacity_kw=grid_capacity_kw,
        time_slot_minutes=time_slot_minutes,
        alpha=alpha,
        beta=beta
    )


# Example usage
if __name__ == "__main__":
    import sys as _sys
    import os as _os
    _sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
    from simulator import create_simulator
    
    print("=== Charging Schedule Optimizer ===\n")
    
    # Create simulator
    simulator = create_simulator(seed=42, max_grid_capacity_kw=200.0)
    start_date = datetime(2024, 1, 1, 8, 0, 0)  # Start at 8 AM
    
    # Generate sessions
    print("Generating sessions...")
    sessions = simulator.generate_sessions(start_date, num_sessions=10)
    
    # Convert to optimization format
    print("Preparing sessions for optimization...")
    opt_sessions = []
    time_slot_minutes = 60  # Use hourly slots for optimization
    
    for session in sessions[:5]:  # Use first 5 sessions
        # Calculate departure time (arrival + estimated duration)
        charger_power = simulator.get_charger_power(session.charger_id)
        duration_hours = session.energy_required_kwh / charger_power
        departure_time = session.arrival_time + timedelta(hours=duration_hours * 1.2)  # Add buffer
        
        # Calculate time slot indices
        start_slot = int((session.arrival_time - start_date).total_seconds() / 60 / time_slot_minutes)
        end_slot = int((departure_time - start_date).total_seconds() / 60 / time_slot_minutes)
        
        opt_session = OptimizationSession(
            session_id=session.session_id,
            charger_id=session.charger_id,
            arrival_time=session.arrival_time,
            departure_time=departure_time,
            energy_required_kwh=session.energy_required_kwh,
            max_power_kw=charger_power,
            arrival_slot=max(0, start_slot),
            departure_slot=end_slot + 24  # Ensure enough slots
        )
        opt_sessions.append(opt_session)
    
    print(f"Prepared {len(opt_sessions)} sessions\n")
    
    # Generate price curve
    print("Generating price curve...")
    price_points = simulator.generate_price_curve(start_date, num_hours=24)
    price_curve = [(p.timestamp, p.price_per_kwh) for p in price_points]
    
    # Generate base load curve
    print("Generating base load curve...")
    base_load_points = simulator.generate_grid_load_curve(start_date, num_hours=24)
    base_load_curve = [(p.timestamp, p.base_load_mw) for p in base_load_points]  # base_load_mw is already in kW scale for EV station
    
    # Create optimizer
    optimizer = create_optimizer(
        grid_capacity_kw=200.0,
        time_slot_minutes=60,
        alpha=0.1,
        beta=1000.0
    )
    
    # Optimize
    print("Optimizing schedule...")
    optimized_schedules, metadata = optimizer.optimize_schedule(
        sessions=opt_sessions,
        price_curve=price_curve,
        base_load_curve=base_load_curve,
        start_time=start_date,
        end_time=start_date + timedelta(hours=24)
    )
    
    print(f"\nOptimization Status: {metadata.get('status', 'unknown')}")
    if metadata.get('status') == 'optimal':
        print(f"Total Cost: ${metadata.get('total_cost', 0):.2f}")
        print(f"Peak Load: {metadata.get('peak_load', 0):.2f} kW")
        print(f"Average Load: {metadata.get('avg_load', 0):.2f} kW")
        print(f"Load Variance: {metadata.get('load_variance', 0):.2f}")
        print(f"Total Unmet Energy: {metadata.get('total_unmet_energy_kwh', 0):.2f} kWh")
        print(f"Number of Sessions: {metadata.get('num_sessions', 0)}")
        print(f"Time Slots: {metadata.get('num_time_slots', 0)}")
        
        # Compute total load curve
        total_load_curve = optimizer.compute_total_load_curve(
            optimized_schedules,
            base_load_curve
        )
        
        print(f"\nTotal Load Curve (sample):")
        for timestamp, load in total_load_curve[::4]:  # Every hour
            print(f"  {timestamp.strftime('%H:%M')}: {load:.2f} kW")
        
        print(f"\nSample Optimized Schedule:")
        if optimized_schedules:
            schedule = optimized_schedules[0]
            print(f"  Session: {schedule.session_id}")
            print(f"  Charger: {schedule.charger_id}")
            print(f"  Cost: ${schedule.total_cost:.2f}")
            print(f"  Power allocations (first 8 slots):")
            for i, power in enumerate(schedule.power_allocations[:8]):
                if power > 0.01:  # Only show non-zero
                    print(f"    {schedule.time_slots[i].strftime('%H:%M')}: {power:.2f} kW")
