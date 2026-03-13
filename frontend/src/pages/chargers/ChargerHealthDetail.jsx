import { useParams, useNavigate } from 'react-router-dom'

const COMPONENTS = [
    { name: 'AC/DC Converter', sub: 'Main Power Module', part: 'PX-900-ACDC', status: 'Optimal', icon: 'check_circle', color: '#10b981' },
    { name: 'Cable Lock Mechanism', sub: 'Physical Security', part: 'LCK-V2-HD', status: 'Optimal', icon: 'check_circle', color: '#10b981' },
    { name: 'Cooling Fan Assembly', sub: 'Thermal Management', part: 'FAN-404-V2', status: 'Warning', icon: 'warning', color: '#f59e0b' },
    { name: 'RFID Reader Module', sub: 'Authentication', part: 'RFID-NFC-3.0', status: 'Optimal', icon: 'check_circle', color: '#10b981' },
]

const METRICS = [
    { label: 'Internal Temperature', value: '42°C', status: 'NORMAL', statusColor: '#10b981', icon: 'thermostat', iconColor: '#60a5fa' },
    { label: 'Output Voltage', value: '480V', status: 'STABLE', statusColor: '#10b981', icon: 'electric_bolt', iconColor: '#facc15' },
    { label: 'Current Amperage', value: '32A', status: 'ACTIVE', statusColor: 'var(--primary)', icon: 'charger', iconColor: 'var(--primary)' },
    { label: 'Connectivity Uptime', value: '99.9%', status: 'STRONG', statusColor: '#10b981', icon: 'signal_cellular_alt', iconColor: '#c084fc' },
]

const LOGS = [
    { event: 'Firmware Update Successful', date: 'Oct 10, 2024 • 09:00 AM', dotColor: 'var(--primary)' },
    { event: 'Cable Replaced', date: 'Sep 15, 2024 • 02:30 PM', dotColor: '#3b82f6' },
    { event: 'Routine System Check', date: 'Aug 01, 2024 • 08:00 AM', dotColor: 'var(--border)' },
]

const BARS = [60, 65, 70, 85, 92, 95, 98, 96, 75, 70, 68, 80]

export default function ChargerHealthDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    // SVG gauge: radius 80, circumference ≈ 502.6
    const health = 98
    const circ = 502.6
    const offset = circ * (1 - health / 100)

    return (
        <div>
            {/* Breadcrumb + Identity */}
            <div className="flex-between mb-6">
                <div>
                    <nav className="flex-row gap-2 mb-4" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <button onClick={() => navigate('/chargers/A-01')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.875rem' }}>Chargers</button>
                        <span>/</span>
                        <span style={{ color: '#fff' }}>Unit {id || 'A-01'}</span>
                    </nav>
                    <div className="flex-row gap-4">
                        <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--primary-10)', border: '1px solid var(--primary-30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 36 }}>ev_charger</span>
                        </div>
                        <div>
                            <div className="flex-row gap-3">
                                <h1 className="page-title" style={{ marginBottom: 0 }}>Unit {id || 'A-01'}</h1>
                                <span className="badge badge-success">
                                    <span className="pulse-dot green" style={{ width: 6, height: 6 }} />
                                    Online
                                </span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.875rem' }}>
                                Model: <span style={{ color: '#fff' }}>SuperCharge X1</span> • Location: <span style={{ color: '#fff' }}>Zone B-12</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex-row gap-3">
                    <button className="btn btn-dark">
                        <span className="material-symbols-outlined">biotech</span>
                        Run Diagnostics
                    </button>
                    <button className="btn btn-dark">
                        <span className="material-symbols-outlined">restart_alt</span>
                        Reboot
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate(`/chargers/${id || 'A-01'}/maintenance`)}>
                        <span className="material-symbols-outlined">construction</span>
                        Maintenance Mode
                    </button>
                </div>
            </div>

            {/* Health Gauge + Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Gauge */}
                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Unit Health Score</p>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <svg width="192" height="192" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="96" cy="96" r="80" fill="transparent" stroke="var(--border)" strokeWidth="12" />
                            <circle cx="96" cy="96" r="80" fill="transparent" stroke="var(--primary)" strokeWidth="12"
                                strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
                        </svg>
                        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{health}%</span>
                            <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>EXCELLENT</span>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 200 }}>Current health above average. Last scan: 12 mins ago.</p>
                </div>

                {/* Metric cards 2×2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {METRICS.map(m => (
                        <div key={m.label} className="card" style={{ padding: '1.25rem' }}>
                            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                <div style={{ background: m.iconColor + '20', borderRadius: 8, padding: 8 }}>
                                    <span className="material-symbols-outlined" style={{ color: m.iconColor }}>{m.icon}</span>
                                </div>
                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: m.statusColor, background: m.statusColor + '18', padding: '2px 8px', borderRadius: 4 }}>{m.status}</span>
                            </div>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff' }}>{m.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Components Table + Side Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Hardware Components */}
                <div className="card overflow-hidden">
                    <div className="flex-between" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <h3 className="section-title flex-row gap-2" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined text-primary">memory</span>
                            Hardware Components Status
                        </h3>
                        <button style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Hardware Map</button>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Component Name</th>
                                <th>Part Number</th>
                                <th style={{ textAlign: 'right' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPONENTS.map(c => (
                                <tr key={c.name}>
                                    <td>
                                        <div style={{ fontWeight: 500, color: '#fff', fontSize: '0.875rem' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.sub}</div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)' }}>{c.part}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: c.color }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: c.color }}>{c.icon}</span>
                                            {c.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Right: Efficiency + Logs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Efficiency Chart */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 className="section-title flex-row gap-2" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>insights</span>
                            Efficiency (24h)
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80, padding: '0 4px' }}>
                            {BARS.map((h, i) => (
                                <div key={i} style={{ flex: 1, height: `${h}%`, background: 'var(--primary-30)', borderRadius: '2px 2px 0 0', borderTop: h > 85 ? `2px solid var(--primary)` : 'none', background: h > 85 ? 'var(--primary-20)' : 'var(--primary-10)' }} />
                            ))}
                        </div>
                        <div className="flex-between" style={{ marginTop: 8 }}>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>24h Ago</span>
                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Current</span>
                        </div>
                        <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg. Efficiency</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>96.4%</span>
                        </div>
                    </div>

                    {/* Recent Logs */}
                    <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
                        <h3 className="section-title flex-row gap-2" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>history</span>
                            Recent Logs
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {LOGS.map((l, i) => (
                                <div key={i} className="flex-row gap-3" style={{ position: 'relative' }}>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: l.dotColor, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#fff' }}>{i === 1 ? 'build' : i === 2 ? 'search' : 'check'}</span>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{l.event}</p>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{l.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-dark w-full" style={{ marginTop: '1.5rem', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                            View All Logs
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
