"""
Test Pipeline for EV Charging Optimization MVP

Runs full pipeline (Lightweight Demo Version):
1. Generate sessions using simulator
2. Compute naive demand curve
3. Train forecast model (using last 12 hours only)
4. Predict next 12 hours demand
5. Run optimization using predicted demand
6. Compare naive vs optimized peak load
"""

import sys
from datetime import datetime, timedelta
from typing import List, Tuple

# Import modules
from simulator import create_simulator, SessionData
from services.forecast_service import create_forecast_service
from services.optimization import (
    create_optimizer,
    OptimizationSession,
    OptimizedSchedule
)


def convert_sessions_to_optimization_format(
    sessions: List[SessionData],
    simulator,
    start_time: datetime,
    time_slot_minutes: int = 60
) -> List[OptimizationSession]:
    """
    Convert SessionData to OptimizationSession format.
    
    Args:
        sessions: List of SessionData objects
        simulator: Simulator instance for charger power lookup
        start_time: Reference start time for slot calculation
        time_slot_minutes: Time slot resolution
        
    Returns:
        List of OptimizationSession objects
    """
    opt_sessions = []
    
    for session in sessions:
        # Get charger power
        charger_power = simulator.get_charger_power(session.charger_id)
        
        # Calculate departure time (arrival + estimated duration + buffer)
        duration_hours = session.energy_required_kwh / charger_power
        departure_time = session.arrival_time + timedelta(
            hours=duration_hours * 1.3  # Add 30% buffer
        )
        
        # Calculate time slot indices
        arrival_slot = int(
            (session.arrival_time - start_time).total_seconds() / 60 / time_slot_minutes
        )
        departure_slot = int(
            (departure_time - start_time).total_seconds() / 60 / time_slot_minutes
        )
        
        # Ensure valid slots
        arrival_slot = max(0, arrival_slot)
        departure_slot = max(arrival_slot + 1, departure_slot)
        
        opt_session = OptimizationSession(
            session_id=session.session_id,
            charger_id=session.charger_id,
            arrival_time=session.arrival_time,
            departure_time=departure_time,
            energy_required_kwh=session.energy_required_kwh,
            max_power_kw=charger_power,
            arrival_slot=arrival_slot,
            departure_slot=departure_slot
        )
        opt_sessions.append(opt_session)
    
    return opt_sessions


def run_full_pipeline(
    seed: int = 42,
    grid_capacity_kw: float = 200.0,
    num_historical_sessions: int = 20,
    num_future_sessions: int = 8
):
    """
    Run the complete optimization pipeline.
    
    Args:
        seed: Random seed for reproducibility
        grid_capacity_kw: Maximum grid capacity
        num_historical_sessions: Number of sessions for training
        num_future_sessions: Number of sessions to optimize
    """
    print("=" * 70)
    print("EV CHARGING OPTIMIZATION PIPELINE TEST")
    print("=" * 70)
    print()
    
    # ========================================================================
    # Step 1: Generate Sessions
    # ========================================================================
    print("Step 1: Generating Sessions")
    print("-" * 70)
    
    simulator = create_simulator(seed=seed, max_grid_capacity_kw=grid_capacity_kw)
    
    # Historical data for training (past week)
    historical_start = datetime(2024, 1, 1, 0, 0, 0)
    print(f"  Generating {num_historical_sessions} historical sessions...")
    historical_sessions = simulator.generate_sessions(
        historical_start,
        num_sessions=num_historical_sessions
    )
    print(f"  ✓ Generated {len(historical_sessions)} historical sessions")
    
    # Future sessions for optimization (next 12 hours)
    future_start = datetime(2024, 1, 8, 0, 0, 0)  # One week later
    print(f"  Generating {num_future_sessions} future sessions...")
    future_sessions = simulator.generate_sessions(
        future_start,
        num_sessions=num_future_sessions
    )
    print(f"  ✓ Generated {len(future_sessions)} future sessions")
    print()
    
    # ========================================================================
    # Step 2: Compute Naive Demand Curve
    # ========================================================================
    print("Step 2: Computing Naive Demand Curve")
    print("-" * 70)
    
    # Compute naive demand for historical data
    print("  Computing historical naive demand...")
    historical_naive_demand_full = simulator.get_total_demand_curve(
        historical_sessions,
        naive_charging=True,
        time_slot_minutes=15
    )
    
    # Use only last 12 hours of historical data for training (lightweight demo)
    historical_end_time = max(ts for ts, _ in historical_naive_demand_full)
    historical_start_time = historical_end_time - timedelta(hours=12)
    historical_naive_demand = [
        (ts, demand) for ts, demand in historical_naive_demand_full
        if ts >= historical_start_time
    ]
    print(f"  ✓ Generated {len(historical_naive_demand_full)} total historical demand points")
    print(f"  ✓ Using last 12 hours: {len(historical_naive_demand)} data points for training")
    
    # Compute naive demand for future sessions (12-hour horizon)
    print("  Computing future naive demand...")
    future_naive_demand = simulator.get_total_demand_curve(
        future_sessions,
        naive_charging=True,
        time_slot_minutes=15,
        start_time=future_start,
        end_time=future_start + timedelta(hours=168)  # 7-day window matches session spread
    )
    
    # Find peak load
    naive_peak_load = max(demand for _, demand in future_naive_demand)
    naive_peak_time = next(
        ts for ts, demand in future_naive_demand if demand == naive_peak_load
    )
    print(f"  ✓ Generated {len(future_naive_demand)} future demand points")
    print(f"  ✓ Naive peak load: {naive_peak_load:.2f} kW at {naive_peak_time.strftime('%Y-%m-%d %H:%M')}")
    print()
    
    # ========================================================================
    # Step 3: Train Forecast Model
    # ========================================================================
    print("Step 3: Training Forecast Model")
    print("-" * 70)
    
    forecast_service = create_forecast_service(lag_steps=4)
    
    print("  Training model on historical demand data...")
    model = forecast_service.train_model(historical_naive_demand)
    print(f"  ✓ Model trained successfully")
    print()
    
    # ========================================================================
    # Step 4: Predict Next 12 Hours Demand
    # ========================================================================
    print("Step 4: Predicting Next 12 Hours Demand")
    print("-" * 70)
    
    # Use recent historical data as context (last 20 data points = ~5 hours at 15-min resolution)
    recent_data = historical_naive_demand[-20:]  # Last 20 data points
    
    print(f"  Using {len(recent_data)} recent data points as context...")
    # Predict 12 hours instead of 24 (48 data points at 15-min resolution)
    predicted_demand = forecast_service.predict_next_24_hours(
        model=model,
        recent_data=recent_data,
        start_time=future_start,
        time_slot_minutes=15
    )
    # Truncate to 12 hours (48 data points)
    predicted_demand = predicted_demand[:48]
    
    predicted_peak = max(demand for _, demand in predicted_demand)
    print(f"  ✓ Generated {len(predicted_demand)} predictions")
    print(f"  ✓ Predicted peak demand: {predicted_peak:.2f} kW")
    print()
    
    # ========================================================================
    # Step 5: Run Optimization
    # ========================================================================
    print("Step 5: Running Optimization")
    print("-" * 70)
    
    # Generate price curve (7-day / 168-hour horizon to match session spread)
    print("  Generating price curve...")
    price_points = simulator.generate_price_curve(future_start, num_hours=168)
    price_curve = [(p.timestamp, p.price_per_kwh) for p in price_points]
    
    # Generate base load curve (7-day / 168-hour horizon)
    print("  Generating base grid load curve...")
    base_load_points = simulator.generate_grid_load_curve(future_start, num_hours=168)
    # base_load_mw values (100–180) are already in the correct kW scale for this
    # EV station (grid_capacity_kw=200). Do NOT multiply by 1000 — that would make
    # base load ~100,000 kW which exceeds capacity and makes the problem infeasible.
    base_load_curve = [
        (p.timestamp, p.base_load_mw)
        for p in base_load_points
    ]
    
    # Convert sessions to optimization format
    print("  Converting sessions to optimization format...")
    opt_sessions = convert_sessions_to_optimization_format(
        future_sessions,
        simulator,
        future_start,
        time_slot_minutes=60  # Use hourly slots for optimization
    )
    print(f"  ✓ Prepared {len(opt_sessions)} sessions for optimization")
    
    # Create optimizer (uses 60-minute slots by default)
    optimizer = create_optimizer(
        grid_capacity_kw=grid_capacity_kw,
        time_slot_minutes=60,  # Hourly optimization
        alpha=0.1
    )
    
    # Run optimization (12-hour horizon)
    print("  Running optimization solver...")
    optimized_schedules, metadata = optimizer.optimize_schedule(
        sessions=opt_sessions,
        price_curve=price_curve,
        base_load_curve=base_load_curve,
        start_time=future_start,
        end_time=future_start + timedelta(hours=168)  # 7-day window
    )
    
    if metadata.get('status') != 'optimal':
        print(f"  ✗ Optimization failed: {metadata.get('error', 'Unknown error')}")
        return
    
    print(f"  ✓ Optimization completed successfully")
    print()
    
    # ========================================================================
    # Step 6: Compare Results
    # ========================================================================
    print("Step 6: Comparing Naive vs Optimized")
    print("-" * 70)
    
    # Compute optimized total load curve
    optimized_load_curve = optimizer.compute_total_load_curve(
        optimized_schedules,
        base_load_curve
    )
    
    optimized_peak_load = max(demand for _, demand in optimized_load_curve)
    optimized_peak_time = next(
        ts for ts, demand in optimized_load_curve if demand == optimized_peak_load
    )
    
    # Calculate cost for naive charging
    naive_total_cost = 0.0
    price_dict = {ts: price for ts, price in price_curve}
    
    for session in future_sessions:
        charger_power = simulator.get_charger_power(session.charger_id)
        duration_hours = session.energy_required_kwh / charger_power
        
        # Find average price during charging period
        charging_start = session.arrival_time
        charging_end = charging_start + timedelta(hours=duration_hours)
        
        # Simple cost calculation: use average price
        avg_price = sum(
            price_dict.get(ts, 0.12)
            for ts, _ in price_curve
            if charging_start <= ts <= charging_end
        ) / max(1, len([ts for ts, _ in price_curve if charging_start <= ts <= charging_end]))
        
        session_cost = session.energy_required_kwh * avg_price
        naive_total_cost += session_cost
    
    optimized_total_cost = metadata.get('total_cost', 0.0)
    
    # Calculate metrics
    peak_reduction = naive_peak_load - optimized_peak_load
    peak_reduction_percent = (peak_reduction / naive_peak_load * 100) if naive_peak_load > 0 else 0
    
    cost_savings = naive_total_cost - optimized_total_cost
    cost_savings_percent = (cost_savings / naive_total_cost * 100) if naive_total_cost > 0 else 0
    
    # Print results
    print("RESULTS SUMMARY")
    print("=" * 70)
    print(f"Naive Charging:")
    print(f"  Peak Load:        {naive_peak_load:.2f} kW")
    print(f"  Peak Time:        {naive_peak_time.strftime('%Y-%m-%d %H:%M')}")
    print(f"  Total Cost:       ${naive_total_cost:.2f}")
    print()
    print(f"Optimized Charging:")
    print(f"  Peak Load:        {optimized_peak_load:.2f} kW")
    print(f"  Peak Time:        {optimized_peak_time.strftime('%Y-%m-%d %H:%M')}")
    print(f"  Total Cost:       ${optimized_total_cost:.2f}")
    print()
    print(f"IMPROVEMENT:")
    print(f"  Peak Load Reduction:  {peak_reduction:.2f} kW ({peak_reduction_percent:.1f}%)")
    print(f"  Cost Savings:         ${cost_savings:.2f} ({cost_savings_percent:.1f}%)")
    print()
    
    # Check if peak load exceeds capacity
    if naive_peak_load > grid_capacity_kw:
        print(f"⚠️  Naive charging exceeds grid capacity ({grid_capacity_kw} kW)")
    else:
        print(f"✓ Naive charging within grid capacity")
    
    if optimized_peak_load > grid_capacity_kw:
        print(f"⚠️  Optimized charging exceeds grid capacity ({grid_capacity_kw} kW)")
    else:
        print(f"✓ Optimized charging within grid capacity")
    
    print()
    print("=" * 70)
    print("Pipeline test completed successfully!")
    print("=" * 70)


if __name__ == "__main__":
    # Run pipeline with lightweight demo parameters
    run_full_pipeline(
        seed=42,
        grid_capacity_kw=200.0,
        num_historical_sessions=20,  # Reduced for faster execution
        num_future_sessions=8  # Reduced for faster execution
    )
