import { useState } from 'react'

const PRIORITY_LIST = [
    { label: 'Guest Parking Zone (A-D)', badge: 'Throttle First', badgeClass: 'warning' },
    { label: 'Employee Level 2 Chargers', badge: 'Standard', badgeClass: 'muted' },
    { label: 'Executive Fleet (DC Fast)', badge: 'High Priority', badgeClass: 'outline-primary' },
]

const RATES = [
    { type: 'Peak', color: '#ef4444', time: '16:00 – 20:00', rate: '$0.42' },
    { type: 'Mid-Peak', color: '#f59e0b', time: '08:00 – 16:00', rate: '$0.28' },
    { type: 'Off-Peak', color: '#10b981', time: '20:00 – 08:00', rate: '$0.12' },
]

export default function AdminPanel() {
    const [maxLoad, setMaxLoad] = useState(425)
    const [buffer, setBuffer] = useState(15)
    const [drEnabled, setDr] = useState(true)

    const headroom = (maxLoad * (1 - buffer / 100) - 360).toFixed(1)

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Site Capacity &amp; Grid Optimization</h1>
                <p className="page-subtitle">Configure real-time load balancing and demand response for Site A-12.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Capacity Control */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="flex-between mb-6">
                        <div className="flex-row gap-3">
                            <span className="material-symbols-outlined text-primary">speed</span>
                            <h3 className="section-title" style={{ margin: 0 }}>Capacity Control</h3>
                        </div>
                        <span className="badge badge-success">Active</span>
                    </div>

                    {/* Slider */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div className="flex-between" style={{ marginBottom: 8 }}>
                            <label style={{ color: '#cbd5e1', fontWeight: 500 }}>Max Grid Load (kW)</label>
                            <span style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>{maxLoad} <small style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8' }}>kW</small></span>
                        </div>
                        <input
                            type="range" min={0} max={500} value={maxLoad}
                            onChange={e => setMaxLoad(Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        <div className="flex-between" style={{ marginTop: 6 }}>
                            {['0 kW', '125 kW', '250 kW', '375 kW', '500 kW'].map(t => (
                                <span key={t} style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{t}</span>
                            ))}
                        </div>
                    </div>

                    {/* Buffer + Headroom */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500, display: 'block', marginBottom: 6 }}>Safety Buffer (%)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number" value={buffer} min={0} max={50}
                                    onChange={e => setBuffer(Number(e.target.value))}
                                    style={{
                                        width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)',
                                        borderRadius: 8, padding: '0.625rem 2rem 0.625rem 1rem', color: '#fff',
                                        fontFamily: 'inherit', fontSize: '0.875rem', outline: 'none',
                                    }}
                                />
                                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>%</span>
                            </div>
                            <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 4 }}>Recommended: 10–20% for peak protection.</p>
                        </div>
                        <div style={{ background: 'var(--primary-5)', border: '1px solid var(--primary-20)', borderRadius: 8, padding: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ background: 'var(--primary-20)', borderRadius: '50%', padding: 8 }}>
                                <span className="material-symbols-outlined text-primary">info</span>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>Available Capacity</p>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Headroom: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{headroom} kW</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Health + Save */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card" style={{ padding: '1.5rem', flex: 1 }}>
                        <div className="flex-row gap-3 mb-6">
                            <span className="material-symbols-outlined text-primary">monitoring</span>
                            <h3 className="section-title" style={{ margin: 0 }}>System Health</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[
                                ['Grid Connection', 'Optimal', 'green'],
                                ['Local Transformer', '42°C (Normal)', 'green'],
                            ].map(([label, status, color]) => (
                                <div key={label} className="flex-between" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem' }}>
                                    <div className="flex-row gap-3">
                                        <div className={`pulse-dot ${color}`} />
                                        <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>{status}</span>
                                </div>
                            ))}
                            <div style={{ marginTop: 8 }}>
                                <div className="flex-between" style={{ marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Real-time Utilization</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>78%</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: '78%' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-primary" style={{ padding: '1rem' }}>
                        <span className="material-symbols-outlined">save</span>
                        Apply Grid Changes
                    </button>
                </div>
            </div>

            {/* Demand Response + Utility Rates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Demand Response */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="flex-between mb-4">
                        <div className="flex-row gap-3">
                            <span className="material-symbols-outlined text-primary">offline_bolt</span>
                            <h3 className="section-title" style={{ margin: 0 }}>Demand Response</h3>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input type="checkbox" checked={drEnabled} onChange={e => setDr(e.target.checked)} style={{ display: 'none' }} />
                            <div style={{
                                width: 44, height: 24, borderRadius: 12,
                                background: drEnabled ? 'var(--primary)' : '#374151',
                                position: 'relative', transition: 'background 0.2s',
                            }}>
                                <div style={{
                                    position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff',
                                    top: 3, left: drEnabled ? 23 : 3, transition: 'left 0.2s',
                                }} />
                            </div>
                        </label>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                        Automated throttling triggers when grid load exceeds safety limits or utility DR signals are received.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {PRIORITY_LIST.map((item, i) => (
                            <div key={i} className="flex-between" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem', cursor: 'grab', opacity: drEnabled ? 1 : 0.5 }}>
                                <div className="flex-row gap-3">
                                    <span className="material-symbols-outlined" style={{ color: '#4b6363', fontSize: 16 }}>drag_indicator</span>
                                    <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.875rem' }}>{i + 1}. {item.label}</span>
                                </div>
                                <span className={`badge badge-${item.badgeClass}`}>{item.badge}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Utility Rates */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div className="flex-between mb-4">
                        <div className="flex-row gap-3">
                            <span className="material-symbols-outlined text-primary">schedule</span>
                            <h3 className="section-title" style={{ margin: 0 }}>Utility Rates</h3>
                        </div>
                        <button className="btn btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span> Add Window
                        </button>
                    </div>
                    <div className="card overflow-hidden">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Window Type</th>
                                    <th>Time Range</th>
                                    <th>Cost ($/kWh)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RATES.map(r => (
                                    <tr key={r.type}>
                                        <td>
                                            <div className="flex-row gap-2">
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                                                {r.type}
                                            </div>
                                        </td>
                                        <td>{r.time}</td>
                                        <td style={{ fontWeight: 700, color: '#fff' }}>{r.rate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '0.75rem', marginTop: '1rem', display: 'flex', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: 16, flexShrink: 0 }}>warning</span>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Utility Provider (GridCo) signaled a "High Load Event" today 17:00–19:00. Dynamic pricing in effect.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
