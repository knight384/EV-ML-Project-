import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDashboard } from '../../api/dashboardApi'

const SESSIONS = [
    { id: '#EV-9021', charger: 'Station B-04', arrSoc: '22%', tgtSoc: '85%', departure: '16:45', status: 'Charging' },
    { id: '#EV-8842', charger: 'Station A-01', arrSoc: '45%', tgtSoc: '90%', departure: '14:10', status: 'Optimized' },
    { id: '#EV-9110', charger: 'Station C-02', arrSoc: '12%', tgtSoc: '80%', departure: '18:30', status: 'Pending' },
]

function StatusBadge({ status }) {
    const map = {
        Charging: 'badge badge-primary',
        Optimized: 'badge badge-outline-primary',
        Pending: 'badge badge-muted',
    }
    return <span className={map[status] || 'badge badge-muted'}>{status}</span>
}

export default function MainDashboard() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                const res = await fetchDashboard()
                setData(res.data)
            } catch (err) {
                setError('Could not reach the backend. Make sure FastAPI is running at http://127.0.0.1:8000')
            } finally {
                setLoading(false)
            }
        }
        load()
        const interval = setInterval(load, 10000) // refresh every 10s
        return () => clearInterval(interval)
    }, [])

    return (
        <div>
            {/* Page header */}
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Real-time EV charging fleet overview</p>
            </div>

            {/* Error banner */}
            {error && (
                <div className="error-banner mb-6">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="kpi-grid mb-8">
                {/* Current Load */}
                <div className="kpi-card">
                    <div className="kpi-label">
                        Current Load
                        <span className="material-symbols-outlined text-primary">bolt</span>
                    </div>
                    {loading
                        ? <div className="skeleton" style={{ height: 36, width: 120 }} />
                        : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span className="kpi-value">{data?.current_load_kw?.toFixed(1) ?? '--'} kW</span>
                                    <span className="kpi-badge green">Steady</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${Math.min(100, ((data?.current_load_kw || 0) / 250) * 100)}%` }} />
                                </div>
                            </div>
                        )
                    }
                </div>

                {/* Active Sessions */}
                <div className="kpi-card">
                    <div className="kpi-label">
                        Active Sessions
                        <span className="material-symbols-outlined text-primary">ev_station</span>
                    </div>
                    {loading
                        ? <div className="skeleton" style={{ height: 36, width: 80 }} />
                        : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span className="kpi-value">{data?.active_sessions ?? '--'}</span>
                                    <span className="kpi-badge muted">sessions</span>
                                </div>
                                <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                    {data?.available_chargers ?? '--'} chargers available
                                </p>
                            </div>
                        )
                    }
                </div>

                {/* Cost Today */}
                <div className="kpi-card">
                    <div className="kpi-label">
                        Cost Today
                        <span className="material-symbols-outlined text-primary">payments</span>
                    </div>
                    {loading
                        ? <div className="skeleton" style={{ height: 36, width: 100 }} />
                        : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span className="kpi-value">${data?.cost_today?.toFixed(2) ?? '--'}</span>
                                </div>
                                <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                    Off-peak tariff active
                                </p>
                            </div>
                        )
                    }
                </div>

                {/* Predicted Peak */}
                <div className="kpi-card">
                    <div className="kpi-label">
                        Predicted Peak
                        <span className="material-symbols-outlined text-primary">show_chart</span>
                    </div>
                    {loading
                        ? <div className="skeleton" style={{ height: 36, width: 110 }} />
                        : (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                    <span className="kpi-value">{data?.predicted_peak_kw?.toFixed(1) ?? '--'} kW</span>
                                </div>
                                <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 8 }}>
                                    Forecasted peak demand
                                </p>
                            </div>
                        )
                    }
                </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Aggregate Load Chart */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="flex-between mb-6">
                        <h3 className="section-title" style={{ margin: 0 }}>Aggregate Load (kW)</h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['24h', '7d'].map((t, i) => (
                                <button key={t} style={{
                                    padding: '2px 10px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    borderRadius: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: i === 0 ? 'var(--primary-10)' : 'transparent',
                                    color: i === 0 ? 'var(--primary)' : '#94a3b8',
                                    fontFamily: 'inherit',
                                }}>{t}</button>
                            ))}
                        </div>
                    </div>
                    <svg viewBox="0 0 800 160" style={{ width: '100%', height: 160 }} preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#0ea4a4" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#0ea4a4" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d="M0 120 Q40 100,80 110 T160 80 T240 95 T320 55 T400 72 T480 40 T560 68 T640 30 T720 52 T800 20 V160 H0 Z" fill="url(#g1)" />
                        <path d="M0 120 Q40 100,80 110 T160 80 T240 95 T320 55 T400 72 T480 40 T560 68 T640 30 T720 52 T800 20" fill="none" stroke="#0ea4a4" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'].map(t => (
                            <span key={t} style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{t}</span>
                        ))}
                    </div>
                </div>

                {/* 4h Forecast */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="section-title">4h Forecast</h3>
                    <div style={{ marginBottom: '1rem' }}>
                        <div className="flex-between mb-2">
                            <p className="text-xs text-muted">Demand Projection</p>
                            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>+12.4%</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, alignItems: 'flex-end', height: 80 }}>
                            {[40, 65, 90, 55].map((h, i) => (
                                <div key={i} style={{
                                    height: `${h}%`,
                                    background: `rgba(14,164,164,${0.2 + i * 0.15})`,
                                    borderRadius: '4px 4px 0 0',
                                }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                            {['+1h', '+2h', '+3h', '+4h'].map(t => (
                                <span key={t} style={{ fontSize: '0.6rem', color: '#64748b' }}>{t}</span>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: 'auto' }}>
                        <p className="text-xs text-muted mb-2">Estimated Price Trend</p>
                        <div className="flex-between">
                            <svg viewBox="0 0 100 20" style={{ width: '60%', height: 30 }} preserveAspectRatio="none">
                                <path d="M0 10 L20 15 L40 5 L60 18 L80 12 L100 8" fill="none" stroke="#0ea4a4" strokeWidth="2" />
                            </svg>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>Low Tariff</p>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>$0.14 / kWh</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Sessions Table */}
            <div className="card overflow-hidden mb-8">
                <div className="flex-between" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3 className="section-title" style={{ margin: 0 }}>Active Sessions</h3>
                    <button style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_list</span>
                        Filter
                    </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Session ID</th>
                                <th>Charger</th>
                                <th style={{ textAlign: 'center' }}>Arr. SOC</th>
                                <th style={{ textAlign: 'center' }}>Target SOC</th>
                                <th>Departure</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SESSIONS.map(s => (
                                <tr key={s.id}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-white)' }}>{s.id}</td>
                                    <td>{s.charger}</td>
                                    <td style={{ textAlign: 'center' }}>{s.arrSoc}</td>
                                    <td style={{ textAlign: 'center' }}>{s.tgtSoc}</td>
                                    <td style={{ fontStyle: 'italic', fontWeight: 500 }}>{s.departure}</td>
                                    <td><StatusBadge status={s.status} /></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            onClick={() => navigate(`/sessions/${s.id.replace('#', '')}`)}
                                            style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                        >
                                            {s.status === 'Optimized' ? 'View' : 'Optimize'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Schedules Snapshot */}
            <div className="card" style={{ padding: '1.5rem' }}>
                <div className="flex-between mb-6">
                    <div className="flex-row gap-3">
                        <h3 className="section-title" style={{ margin: 0 }}>Schedules Snapshot</h3>
                        <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>Next 6 Hours</span>
                    </div>
                    <div className="flex-row gap-4">
                        {[['var(--primary)', 'Active'], ['var(--primary-30)', 'Scheduled']].map(([c, l]) => (
                            <div key={l} className="flex-row gap-2">
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94a3b8' }}>{l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline rows */}
                {[
                    { label: 'Station A-01', bars: [{ left: '0%', width: '40%', variant: 'optimized', text: '#EV-8842' }, { left: '50%', width: '30%', variant: 'scheduled', text: 'QUEUED' }] },
                    { label: 'Station B-04', bars: [{ left: '0%', width: '80%', variant: 'optimized', text: '#EV-9021 CRITICAL' }] },
                    { label: 'Station C-02', bars: [{ left: '30%', width: '45%', variant: 'scheduled', text: 'Scheduled @ 15:00' }] },
                ].map(row => (
                    <div key={row.label} className="flex-row gap-4" style={{ marginBottom: 12 }}>
                        <span style={{ width: 80, fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', flexShrink: 0 }}>{row.label}</span>
                        <div style={{ flex: 1, height: 32, background: 'var(--primary-5)', borderRadius: 6, position: 'relative' }}>
                            {row.bars.map((bar, i) => (
                                <div key={i} className={`gantt-bar gantt-${bar.variant}`} style={{ left: bar.left, width: bar.width }}>
                                    <span style={{ fontSize: '0.55rem', fontWeight: 700, color: bar.variant === 'scheduled' ? 'var(--primary)' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bar.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Hour markers */}
                <div className="flex-row" style={{ paddingLeft: 96, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
                    {['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(t => (
                        <span key={t} style={{ flex: 1, fontSize: '0.55rem', fontWeight: 700, color: '#64748b' }}>{t}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}
