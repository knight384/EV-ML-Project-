"""
Deterministic Data Simulator for EV Charging Optimization MVP

Generates synthetic, reproducible data for:
- EV arrival times
- State of Charge (SOC) values
- Charger power limits
- Electricity price curves
- Base grid load curves
- Session energy requirements

All outputs are reproducible using a fixed random seed.
"""

import random
import math
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class ChargerConfig:
    """Charger configuration"""
    charger_id: str
    max_power_kw: float
    location: str


@dataclass
class SessionData:
    """Generated session data"""
    session_id: str
    charger_id: str
    vehicle_id: str
    arrival_time: datetime
    arrival_soc_percent: float
    target_soc_percent: float
    energy_required_kwh: float
    estimated_duration_minutes: int


@dataclass
class PriceDataPoint:
    """Electricity price data point"""
    timestamp: datetime
    price_per_kwh: float


@dataclass
class GridLoadDataPoint:
    """Grid load data point"""
    timestamp: datetime
    base_load_mw: float


class EVChargingSimulator:
    """
    Deterministic simulator for EV charging data.
    
    Uses fixed random seeds to ensure reproducibility.
    """
    
    def __init__(self, seed: int = 42, max_grid_capacity_kw: float = 200.0):
        """
        Initialize simulator with a fixed seed.
        
        Args:
            seed: Random seed for reproducibility (default: 42)
            max_grid_capacity_kw: Maximum grid capacity in kW (default: 200.0)
        """
        self.seed = seed
        self.random = random.Random(seed)
        self.max_grid_capacity_kw = max_grid_capacity_kw
        
        # Charger configurations (fixed set)
        self.chargers = [
            ChargerConfig("CHG-001", 7.0, "Parking Lot A"),
            ChargerConfig("CHG-002", 7.0, "Parking Lot A"),
            ChargerConfig("CHG-003", 11.0, "Parking Lot B"),
            ChargerConfig("CHG-004", 11.0, "Parking Lot B"),
            ChargerConfig("CHG-005", 22.0, "Parking Lot C"),
            ChargerConfig("CHG-006", 22.0, "Parking Lot C"),
            ChargerConfig("CHG-007", 50.0, "DC Fast Station"),
            ChargerConfig("CHG-008", 50.0, "DC Fast Station"),
        ]
        
        # Create charger lookup dictionary for quick access
        self.charger_lookup = {ch.charger_id: ch for ch in self.chargers}
        
        # Vehicle IDs pool
        self.vehicle_ids = [f"EV-{i:04d}" for i in range(1, 101)]
    
    def generate_arrival_times(
        self,
        start_date: datetime,
        num_sessions: int,
        peak_hours: Tuple[int, int] = (7, 9),  # Morning rush
        evening_peak: Tuple[int, int] = (17, 19)  # Evening rush
    ) -> List[datetime]:
        """
        Generate realistic EV arrival times with peak hour clustering.
        
        Arrivals are more likely during:
        - Morning rush: 7-9 AM
        - Evening rush: 5-7 PM
        
        Args:
            start_date: Starting date for generation
            num_sessions: Number of arrival times to generate
            peak_hours: Morning peak hour range (start, end)
            evening_peak: Evening peak hour range (start, end)
            
        Returns:
            List of arrival datetime objects
        """
        arrivals = []
        
        for i in range(num_sessions):
            # Determine if arrival is during peak hours (60% probability)
            is_peak = self.random.random() < 0.6
            
            if is_peak:
                # Choose between morning and evening peak
                if self.random.random() < 0.5:
                    # Morning peak
                    hour = self.random.randint(peak_hours[0], peak_hours[1])
                    minute = self.random.randint(0, 59)
                else:
                    # Evening peak
                    hour = self.random.randint(evening_peak[0], evening_peak[1])
                    minute = self.random.randint(0, 59)
            else:
                # Off-peak: more uniform distribution
                hour = self.random.randint(0, 23)
                minute = self.random.randint(0, 59)
            
            # Add some randomness to the day (within 7 days)
            days_offset = self.random.randint(0, 6)
            arrival = start_date + timedelta(days=days_offset, hours=hour, minutes=minute)
            arrivals.append(arrival)
        
        # Sort by arrival time
        arrivals.sort()
        return arrivals
    
    def generate_soc_values(
        self,
        num_sessions: int,
        arrival_soc_range: Tuple[float, float] = (10.0, 60.0),
        target_soc_range: Tuple[float, float] = (70.0, 100.0)
    ) -> List[Tuple[float, float]]:
        """
        Generate State of Charge values.
        
        Args:
            num_sessions: Number of SOC pairs to generate
            arrival_soc_range: (min, max) arrival SOC percentage
            target_soc_range: (min, max) target SOC percentage
            
        Returns:
            List of (arrival_soc, target_soc) tuples
        """
        soc_pairs = []
        
        for _ in range(num_sessions):
            arrival_soc = self.random.uniform(arrival_soc_range[0], arrival_soc_range[1])
            target_soc = self.random.uniform(
                max(arrival_soc + 10, target_soc_range[0]),  # Ensure target > arrival
                target_soc_range[1]
            )
            soc_pairs.append((round(arrival_soc, 1), round(target_soc, 1)))
        
        return soc_pairs
    
    def generate_charger_power_limits(self) -> List[ChargerConfig]:
        """
        Return charger configurations with power limits.
        
        Returns:
            List of ChargerConfig objects
        """
        return self.chargers.copy()
    
    def generate_price_curve(
        self,
        start_date: datetime,
        num_hours: int = 24,
        base_price: float = 0.12,
        peak_multiplier: float = 2.5
    ) -> List[PriceDataPoint]:
        """
        Generate electricity price curve over time.
        
        Price pattern:
        - Off-peak (night): base_price
        - Mid-peak (day): 1.5x base_price
        - Peak (evening 4-8 PM): peak_multiplier * base_price
        
        Args:
            start_date: Starting datetime
            num_hours: Number of hours to generate
            base_price: Base price per kWh ($)
            peak_multiplier: Peak price multiplier
            
        Returns:
            List of PriceDataPoint objects
        """
        price_points = []
        
        for hour_offset in range(num_hours):
            timestamp = start_date + timedelta(hours=hour_offset)
            hour = timestamp.hour
            
            # Determine price tier based on hour
            if 16 <= hour < 20:  # Evening peak (4 PM - 8 PM)
                price = base_price * peak_multiplier
            elif 8 <= hour < 22:  # Mid-peak (8 AM - 10 PM)
                price = base_price * 1.5
            else:  # Off-peak (10 PM - 8 AM)
                price = base_price
            
            # Add small random variation (±5%)
            variation = self.random.uniform(-0.05, 0.05)
            price = price * (1 + variation)
            
            price_points.append(PriceDataPoint(
                timestamp=timestamp,
                price_per_kwh=round(price, 4)
            ))
        
        return price_points
    
    def generate_grid_load_curve(
        self,
        start_date: datetime,
        num_hours: int = 24,
        base_load_mw: float = 100.0,
        peak_load_mw: float = 180.0
    ) -> List[GridLoadDataPoint]:
        """
        Generate base grid load curve (without EV charging).
        
        Load pattern:
        - Low during night (midnight - 6 AM)
        - Rises in morning (6 AM - 9 AM)
        - Steady during day (9 AM - 5 PM)
        - Peak in evening (5 PM - 9 PM)
        - Declines at night (9 PM - midnight)
        
        Args:
            start_date: Starting datetime
            num_hours: Number of hours to generate
            base_load_mw: Base load in MW (nighttime minimum)
            peak_load_mw: Peak load in MW (evening maximum)
            
        Returns:
            List of GridLoadDataPoint objects
        """
        load_points = []
        
        for hour_offset in range(num_hours):
            timestamp = start_date + timedelta(hours=hour_offset)
            hour = timestamp.hour
            
            # Calculate load based on time of day using sine wave approximation
            # Normalize hour to 0-24 range
            normalized_hour = hour / 24.0
            
            # Create a pattern that peaks in evening and is low at night
            # Use sine wave shifted to peak around 7 PM (19:00)
            phase_shift = (19 - 12) / 24.0  # Shift peak to 7 PM
            load_factor = 0.5 + 0.5 * math.sin(2 * math.pi * (normalized_hour - phase_shift) + math.pi/2)
            
            # Ensure minimum is base_load and maximum is peak_load
            load = base_load_mw + (peak_load_mw - base_load_mw) * load_factor
            
            # Add small random variation (±3%)
            variation = self.random.uniform(-0.03, 0.03)
            load = load * (1 + variation)
            
            load_points.append(GridLoadDataPoint(
                timestamp=timestamp,
                base_load_mw=round(load, 2)
            ))
        
        return load_points
    
    def calculate_energy_requirement(
        self,
        arrival_soc: float,
        target_soc: float,
        battery_capacity_kwh: float = 60.0
    ) -> float:
        """
        Calculate energy required to charge from arrival SOC to target SOC.
        
        Args:
            arrival_soc: Arrival state of charge percentage
            target_soc: Target state of charge percentage
            battery_capacity_kwh: Vehicle battery capacity in kWh
            
        Returns:
            Energy required in kWh
        """
        soc_difference = target_soc - arrival_soc
        energy_kwh = (soc_difference / 100.0) * battery_capacity_kwh
        
        # Add small efficiency loss (charging is ~90% efficient)
        energy_kwh = energy_kwh / 0.9
        
        return round(energy_kwh, 2)
    
    def generate_battery_capacity(self) -> float:
        """
        Generate realistic battery capacity.
        
        Common EV battery sizes:
        - Small: 40-50 kWh
        - Medium: 60-75 kWh
        - Large: 80-100 kWh
        
        Returns:
            Battery capacity in kWh
        """
        # Weighted random: 40% small, 50% medium, 10% large
        rand = self.random.random()
        if rand < 0.4:
            return self.random.uniform(40.0, 50.0)
        elif rand < 0.9:
            return self.random.uniform(60.0, 75.0)
        else:
            return self.random.uniform(80.0, 100.0)
    
    def generate_sessions(
        self,
        start_date: datetime,
        num_sessions: int,
        days: int = 7
    ) -> List[SessionData]:
        """
        Generate complete session data.
        
        Args:
            start_date: Starting date for sessions
            num_sessions: Number of sessions to generate
            days: Number of days to spread sessions across
            
        Returns:
            List of SessionData objects
        """
        sessions = []
        
        # Generate arrival times
        arrivals = self.generate_arrival_times(start_date, num_sessions)
        
        # Generate SOC values
        soc_pairs = self.generate_soc_values(num_sessions)
        
        # Generate battery capacities
        battery_capacities = [self.generate_battery_capacity() for _ in range(num_sessions)]
        
        for i in range(num_sessions):
            arrival_time = arrivals[i]
            arrival_soc, target_soc = soc_pairs[i]
            battery_capacity = battery_capacities[i]
            
            # Select random charger
            charger = self.random.choice(self.chargers)
            
            # Select random vehicle
            vehicle_id = self.random.choice(self.vehicle_ids)
            
            # Calculate energy requirement
            energy_required = self.calculate_energy_requirement(
                arrival_soc, target_soc, battery_capacity
            )
            
            # Estimate duration (energy / power, with some overhead)
            estimated_duration = int((energy_required / charger.max_power_kw) * 60 * 1.1)
            
            session = SessionData(
                session_id=f"SESSION-{i+1:04d}",
                charger_id=charger.charger_id,
                vehicle_id=vehicle_id,
                arrival_time=arrival_time,
                arrival_soc_percent=arrival_soc,
                target_soc_percent=target_soc,
                energy_required_kwh=energy_required,
                estimated_duration_minutes=estimated_duration
            )
            
            sessions.append(session)
        
        return sessions
    
    def generate_forecast_data(
        self,
        start_date: datetime,
        forecast_type: str = "demand",
        num_hours: int = 24
    ) -> List[Tuple[datetime, float]]:
        """
        Generate forecast data points.
        
        Args:
            start_date: Starting datetime
            forecast_type: "demand" or "load"
            num_hours: Number of hours to forecast
            
        Returns:
            List of (timestamp, value) tuples
        """
        forecast_points = []
        
        if forecast_type == "demand":
            # EV charging demand forecast
            # Follows similar pattern to arrivals (peaks in morning/evening)
            for hour_offset in range(num_hours):
                timestamp = start_date + timedelta(hours=hour_offset)
                hour = timestamp.hour
                
                # Demand peaks during rush hours
                if 7 <= hour < 9 or 17 <= hour < 19:
                    base_demand = 150.0  # kW
                elif 9 <= hour < 17:
                    base_demand = 100.0  # kW
                else:
                    base_demand = 50.0  # kW
                
                # Add variation
                variation = self.random.uniform(-0.1, 0.1)
                demand = base_demand * (1 + variation)
                
                forecast_points.append((timestamp, round(demand, 2)))
        
        elif forecast_type == "load":
            # Grid load forecast (uses same pattern as generate_grid_load_curve)
            load_points = self.generate_grid_load_curve(start_date, num_hours)
            forecast_points = [(p.timestamp, p.base_load_mw) for p in load_points]
        
        return forecast_points
    
    def get_charger_power(self, charger_id: str) -> float:
        """
        Get charger max power from charger ID.
        
        Args:
            charger_id: Charger identifier
            
        Returns:
            Max power in kW
            
        Raises:
            ValueError: If charger_id not found
        """
        if charger_id not in self.charger_lookup:
            raise ValueError(f"Charger {charger_id} not found")
        return self.charger_lookup[charger_id].max_power_kw
    
    def get_total_demand_curve(
        self,
        sessions: List[SessionData],
        naive_charging: bool = True,
        time_slot_minutes: int = 15,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Tuple[datetime, float]]:
        """
        Compute total demand curve from sessions.
        
        For naive charging: Each EV charges immediately at arrival time
        at maximum charger power until energy requirement is met.
        
        Args:
            sessions: List of SessionData objects
            naive_charging: If True, simulate naive charging (immediate start at max power)
                           If False, assumes optimized scheduling (to be implemented)
            time_slot_minutes: Time resolution in minutes (default: 15)
            start_time: Start time for curve (default: earliest session arrival)
            end_time: End time for curve (default: latest session completion)
            
        Returns:
            List of (timestamp, total_demand_kw) tuples representing demand at each time slot
        """
        if not sessions:
            return []
        
        # Determine time range
        if start_time is None:
            start_time = min(session.arrival_time for session in sessions)
            # Round down to nearest time slot
            start_time = start_time.replace(
                minute=(start_time.minute // time_slot_minutes) * time_slot_minutes,
                second=0,
                microsecond=0
            )
        
        if end_time is None:
            # Calculate latest completion time for naive charging
            max_completion = start_time
            for session in sessions:
                charger_power = self.get_charger_power(session.charger_id)
                # Duration in hours = energy / power
                duration_hours = session.energy_required_kwh / charger_power
                completion_time = session.arrival_time + timedelta(hours=duration_hours)
                if completion_time > max_completion:
                    max_completion = completion_time
            
            # Round up to nearest time slot using timedelta to avoid minute=60 overflow
            max_completion = max_completion.replace(second=0, microsecond=0)
            remainder = max_completion.minute % time_slot_minutes
            if remainder != 0:
                end_time = max_completion + timedelta(minutes=time_slot_minutes - remainder)
            else:
                end_time = max_completion + timedelta(minutes=time_slot_minutes)
        
        # Generate time slots
        time_slots = []
        current_time = start_time
        while current_time <= end_time:
            time_slots.append(current_time)
            current_time += timedelta(minutes=time_slot_minutes)
        
        # Initialize demand array
        demand_curve = []
        
        if naive_charging:
            # Naive charging: each session starts immediately at arrival and charges at max power
            for slot_time in time_slots:
                total_demand = 0.0
                
                for session in sessions:
                    charger_power = self.get_charger_power(session.charger_id)
                    
                    # Calculate charging start and end times
                    start_charging = session.arrival_time
                    # Duration in hours = energy / power
                    duration_hours = session.energy_required_kwh / charger_power
                    end_charging = start_charging + timedelta(hours=duration_hours)
                    
                    # Check if this session is actively charging during this time slot
                    # Session is active if slot_time is between start_charging and end_charging
                    if start_charging <= slot_time < end_charging:
                        total_demand += charger_power
                
                # Cap at grid capacity
                total_demand = min(total_demand, self.max_grid_capacity_kw)
                demand_curve.append((slot_time, round(total_demand, 2)))
        
        else:
            # Optimized charging (placeholder for future implementation)
            # For now, return zero demand
            for slot_time in time_slots:
                demand_curve.append((slot_time, 0.0))
        
        return demand_curve


def create_simulator(seed: int = 42, max_grid_capacity_kw: float = 200.0) -> EVChargingSimulator:
    """
    Factory function to create a simulator instance.
    
    Args:
        seed: Random seed for reproducibility
        max_grid_capacity_kw: Maximum grid capacity in kW
        
    Returns:
        EVChargingSimulator instance
    """
    return EVChargingSimulator(seed=seed, max_grid_capacity_kw=max_grid_capacity_kw)


# Example usage
if __name__ == "__main__":
    # Create simulator with fixed seed
    simulator = create_simulator(seed=42)
    
    # Generate test data
    start_date = datetime(2024, 1, 1, 0, 0, 0)
    
    print("=== EV Charging Data Simulator ===\n")
    
    # Generate sessions
    print("Generating 10 sessions...")
    sessions = simulator.generate_sessions(start_date, num_sessions=10)
    print(f"Generated {len(sessions)} sessions\n")
    
    # Display sample sessions
    print("Sample Sessions:")
    for session in sessions[:3]:
        print(f"  {session.session_id}: {session.vehicle_id} at {session.charger_id}")
        print(f"    Arrival: {session.arrival_time.strftime('%Y-%m-%d %H:%M')}")
        print(f"    SOC: {session.arrival_soc_percent}% -> {session.target_soc_percent}%")
        print(f"    Energy: {session.energy_required_kwh} kWh")
        print(f"    Duration: ~{session.estimated_duration_minutes} minutes\n")
    
    # Generate price curve
    print("Generating 24-hour price curve...")
    price_curve = simulator.generate_price_curve(start_date, num_hours=24)
    print(f"Generated {len(price_curve)} price points\n")
    print("Sample Prices:")
    for point in price_curve[::6]:  # Every 6 hours
        print(f"  {point.timestamp.strftime('%H:%M')}: ${point.price_per_kwh:.4f}/kWh")
    
    # Generate grid load curve
    print("\nGenerating 24-hour grid load curve...")
    load_curve = simulator.generate_grid_load_curve(start_date, num_hours=24)
    print(f"Generated {len(load_curve)} load points\n")
    print("Sample Load:")
    for point in load_curve[::6]:  # Every 6 hours
        print(f"  {point.timestamp.strftime('%H:%M')}: {point.base_load_mw:.2f} MW")
    
    # Generate forecast
    print("\nGenerating demand forecast...")
    forecast = simulator.generate_forecast_data(start_date, forecast_type="demand", num_hours=24)
    print(f"Generated {len(forecast)} forecast points\n")
    print("Sample Forecast:")
    for timestamp, value in forecast[::6]:  # Every 6 hours
        print(f"  {timestamp.strftime('%H:%M')}: {value:.2f} kW")
    
    # Generate total demand curve (naive charging)
    print("\nGenerating total demand curve (naive charging)...")
    demand_curve = simulator.get_total_demand_curve(sessions, naive_charging=True)
    print(f"Generated {len(demand_curve)} demand points\n")
    print(f"Max grid capacity: {simulator.max_grid_capacity_kw} kW")
    print("Sample Demand (every hour):")
    max_demand = 0.0
    for timestamp, demand in demand_curve[::4]:  # Every hour (15min * 4)
        if demand > max_demand:
            max_demand = demand
        print(f"  {timestamp.strftime('%Y-%m-%d %H:%M')}: {demand:.2f} kW")
    print(f"\nPeak demand: {max_demand:.2f} kW")
    if max_demand > simulator.max_grid_capacity_kw:
        print(f"⚠️  Peak demand exceeds grid capacity!")
    else:
        print(f"✓ Peak demand within grid capacity")
