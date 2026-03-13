import axios from 'axios'

/**
 * Fetch main dashboard KPI metrics from FastAPI backend.
 * Returns: { active_sessions, available_chargers, current_load_kw, predicted_peak_kw, cost_today }
 */
export const fetchDashboard = () => axios.get('/api/dashboard')
