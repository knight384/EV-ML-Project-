"""
Forecasting Service for EV Charging Demand Prediction

Uses historical demand data to predict future grid demand using
linear regression with lag features.
"""

import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime, timedelta
from typing import List, Tuple, Optional
import warnings

warnings.filterwarnings('ignore')


class DemandForecastService:
    """
    Service for forecasting EV charging demand using historical data.
    
    Uses lag features (previous time steps) to predict future demand.
    """
    
    def __init__(self, lag_steps: int = 4):
        """
        Initialize forecast service.
        
        Args:
            lag_steps: Number of previous time steps to use as features (default: 4)
        """
        self.lag_steps = lag_steps
        self.model: Optional[LinearRegression] = None
        self.is_trained = False
    
    def _create_lag_features(self, demand_values: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create lag features from demand time series.
        
        Creates features from previous lag_steps time steps to predict current value.
        
        Args:
            demand_values: Array of demand values (1D)
            
        Returns:
            Tuple of (X_features, y_target) arrays
            X_features: Shape (n_samples, lag_steps) - lag features
            y_target: Shape (n_samples,) - target values
        """
        n_samples = len(demand_values)
        
        if n_samples < self.lag_steps + 1:
            raise ValueError(
                f"Need at least {self.lag_steps + 1} data points, got {n_samples}"
            )
        
        X = []
        y = []
        
        # Create sliding window of lag features
        for i in range(self.lag_steps, n_samples):
            # Features: previous lag_steps values
            features = demand_values[i - self.lag_steps:i]
            # Target: current value
            target = demand_values[i]
            
            X.append(features)
            y.append(target)
        
        return np.array(X), np.array(y)
    
    def train_model(self, demand_curve: List[Tuple[datetime, float]]) -> LinearRegression:
        """
        Train forecasting model using historical demand data.
        
        Args:
            demand_curve: List of (timestamp, demand_kw) tuples from simulator
            
        Returns:
            Trained LinearRegression model
        """
        if len(demand_curve) < self.lag_steps + 1:
            raise ValueError(
                f"Need at least {self.lag_steps + 1} data points for training, "
                f"got {len(demand_curve)}"
            )
        
        # Extract demand values (ignore timestamps for training)
        demand_values = np.array([demand for _, demand in demand_curve])
        
        # Create lag features
        X, y = self._create_lag_features(demand_values)
        
        # Train linear regression model
        model = LinearRegression()
        model.fit(X, y)
        
        self.model = model
        self.is_trained = True
        
        # Calculate training score for diagnostics
        train_score = model.score(X, y)
        print(f"Model trained with {len(X)} samples. R² score: {train_score:.4f}")
        
        return model
    
    def predict_next_24_hours(
        self,
        model: Optional[LinearRegression] = None,
        recent_data: Optional[List[Tuple[datetime, float]]] = None,
        start_time: Optional[datetime] = None,
        time_slot_minutes: int = 15
    ) -> List[Tuple[datetime, float]]:
        """
        Predict demand for next 24 hours.
        
        Uses autoregressive prediction: each prediction uses previous predictions
        as features for the next time step.
        
        Args:
            model: Trained model (if None, uses self.model)
            recent_data: Recent demand data to use as starting point
                         Must have at least lag_steps data points
            start_time: Start time for predictions (default: last timestamp + time_slot_minutes)
            time_slot_minutes: Time resolution in minutes (default: 15)
            
        Returns:
            List of (timestamp, predicted_demand_kw) tuples for next 24 hours
        """
        # Use instance model if not provided
        if model is None:
            model = self.model
        
        if model is None:
            raise ValueError("Model not trained. Call train_model() first.")
        
        if recent_data is None:
            raise ValueError("recent_data is required for prediction")
        
        if len(recent_data) < self.lag_steps:
            raise ValueError(
                f"Need at least {self.lag_steps} recent data points, "
                f"got {len(recent_data)}"
            )
        
        # Extract recent demand values
        recent_demands = np.array([demand for _, demand in recent_data[-self.lag_steps:]])
        
        # Determine start time
        if start_time is None:
            last_timestamp = recent_data[-1][0]
            start_time = last_timestamp + timedelta(minutes=time_slot_minutes)
        
        # Calculate number of predictions needed (24 hours)
        predictions_per_hour = 60 // time_slot_minutes
        num_predictions = 24 * predictions_per_hour  # 96 for 15-minute intervals
        
        # Generate predictions autoregressively
        predictions = []
        current_features = recent_demands.copy()
        
        for i in range(num_predictions):
            # Predict next value using current lag features
            prediction = model.predict(current_features.reshape(1, -1))[0]
            
            # Ensure non-negative prediction
            prediction = max(0.0, prediction)
            
            # Calculate timestamp
            timestamp = start_time + timedelta(minutes=i * time_slot_minutes)
            
            predictions.append((timestamp, round(prediction, 2)))
            
            # Update features: shift left and add new prediction
            current_features = np.roll(current_features, -1)
            current_features[-1] = prediction
        
        return predictions
    
    def predict_with_confidence_intervals(
        self,
        model: Optional[LinearRegression] = None,
        recent_data: Optional[List[Tuple[datetime, float]]] = None,
        start_time: Optional[datetime] = None,
        time_slot_minutes: int = 15,
        confidence_level: float = 0.95
    ) -> List[Tuple[datetime, float, float, float]]:
        """
        Predict demand with confidence intervals.
        
        Uses simple heuristic: confidence interval widens with prediction horizon.
        
        Args:
            model: Trained model
            recent_data: Recent demand data
            start_time: Start time for predictions
            time_slot_minutes: Time resolution in minutes
            confidence_level: Confidence level (default: 0.95)
            
        Returns:
            List of (timestamp, predicted_demand, lower_bound, upper_bound) tuples
        """
        predictions = self.predict_next_24_hours(
            model=model,
            recent_data=recent_data,
            start_time=start_time,
            time_slot_minutes=time_slot_minutes
        )
        
        # Calculate standard deviation from recent data for uncertainty estimation
        if recent_data:
            recent_values = [demand for _, demand in recent_data]
            std_dev = np.std(recent_values)
        else:
            std_dev = 10.0  # Default uncertainty
        
        # Z-score for confidence level (approximate for 95% CI)
        z_score = 1.96 if confidence_level == 0.95 else 2.58
        
        predictions_with_ci = []
        for i, (timestamp, pred_demand) in enumerate(predictions):
            # Uncertainty increases with prediction horizon
            horizon_factor = 1 + (i / len(predictions)) * 0.5
            margin = std_dev * z_score * horizon_factor
            
            lower_bound = max(0.0, pred_demand - margin)
            upper_bound = pred_demand + margin
            
            predictions_with_ci.append((
                timestamp,
                pred_demand,
                round(lower_bound, 2),
                round(upper_bound, 2)
            ))
        
        return predictions_with_ci


def create_forecast_service(lag_steps: int = 4) -> DemandForecastService:
    """
    Factory function to create a forecast service instance.
    
    Args:
        lag_steps: Number of lag features to use
        
    Returns:
        DemandForecastService instance
    """
    return DemandForecastService(lag_steps=lag_steps)


# Example usage
if __name__ == "__main__":
    import sys as _sys
    import os as _os
    _sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
    from simulator import create_simulator
    
    print("=== Demand Forecasting Service ===\n")
    
    # Create simulator and generate historical data
    simulator = create_simulator(seed=42)
    start_date = datetime(2024, 1, 1, 0, 0, 0)
    
    # Generate sessions for past week
    print("Generating historical sessions...")
    sessions = simulator.generate_sessions(start_date, num_sessions=50)
    
    # Generate demand curve for past week (naive charging)
    print("Generating historical demand curve...")
    historical_demand = simulator.get_total_demand_curve(
        sessions,
        naive_charging=True,
        time_slot_minutes=15
    )
    
    print(f"Generated {len(historical_demand)} historical data points\n")
    
    # Create forecast service
    forecast_service = create_forecast_service(lag_steps=4)
    
    # Train model
    print("Training forecasting model...")
    model = forecast_service.train_model(historical_demand)
    print()
    
    # Use last 4 data points as recent data for prediction
    recent_data = historical_demand[-10:]  # Use last 10 points (need at least 4)
    
    print(f"Using last {len(recent_data)} data points as recent context:")
    for timestamp, demand in recent_data[-4:]:
        print(f"  {timestamp.strftime('%Y-%m-%d %H:%M')}: {demand:.2f} kW")
    print()
    
    # Predict next 24 hours
    print("Predicting next 24 hours...")
    predictions = forecast_service.predict_next_24_hours(
        model=model,
        recent_data=recent_data,
        time_slot_minutes=15
    )
    
    print(f"Generated {len(predictions)} predictions\n")
    print("Sample predictions (every 2 hours):")
    for timestamp, pred_demand in predictions[::8]:  # Every 2 hours (8 * 15min)
        print(f"  {timestamp.strftime('%Y-%m-%d %H:%M')}: {pred_demand:.2f} kW")
    
    # Predict with confidence intervals
    print("\nPredictions with confidence intervals:")
    predictions_ci = forecast_service.predict_with_confidence_intervals(
        model=model,
        recent_data=recent_data,
        time_slot_minutes=15
    )
    
    print("Sample predictions with 95% CI (every 2 hours):")
    for timestamp, pred, lower, upper in predictions_ci[::8]:
        print(f"  {timestamp.strftime('%Y-%m-%d %H:%M')}: "
              f"{pred:.2f} kW [{lower:.2f}, {upper:.2f}]")
