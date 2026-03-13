import { useParams, useNavigate } from 'react-router-dom'

const DIAGNOSTICS = [
    { icon: 'memory', title: 'Full Circuit Test', desc: 'Testing all internal power delivery circuits and relay components.', status: 'IN PROGRESS', running: true },
    { icon: 'restart_alt', title: 'Hardware Reset', desc: 'Perform a soft reset of the onboard controller and comms module.', status: 'READY', running: false },
    { icon: 'cyclone', title: 'Cooling Fan Test', desc: 'Verify fan RPM and air flow efficiency for thermal management.', status: 'READY', running: false },
]

const ACTIVITY_LOG = [
    { time: '12:45 PM', event: 'Technician entered maintenance mode', color: '#f59e0b' },
    { time: '12:47 PM', event: 'Safety override engaged', color: 'var(--border)' },
    { time: '12:55 PM', event: 'Circuit Test initiated by ID: 4421', color: 'var(--primary)' },
    { time: '01:02 PM', event: 'Firmware sync verification started', color: 'var(--border)' },
]

export default function ChargerMaintenance() {
    const { id } = useParams()
    const navigate = useNavigate()

    return (
        <div>
            {/* Breadcrumb */}
            <nav className="flex-row gap-2" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Dashboard</button>
                <span>/</span>
                <button onClick={() => navigate(`/chargers/${id || 'A-01'}`)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Chargers</button>
                <span>/</span>
                <span style={{ color: '#fff' }}>Unit {id || 'A-01'}</span>
            </nav>

            {/* Maintenance Banner */}
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="flex-row gap-4">
                    <div style={{ background: 'rgba(245,158,11,0.15)', padding: 8, borderRadius: 8 }}>
                        <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>schedule</span>
                    </div>
                    <div>
                        <p style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 2 }}>Maintenance Mode Active</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            This unit is offline for maintenance. Estimated return: <span style={{ color: '#fff', fontWeight: 500 }}>2:00 PM</span>
                        </p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate(`/chargers/${id || 'A-01'}`)}>
                    Exit Maintenance Mode
                </button>
            </div>

            {/* Unit Identity */}
            <div className="flex-between mb-6">
                <div className="flex-row gap-6">
                    <div style={{ width: 128, height: 128, borderRadius: 12, background: 'var(--primary-5)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--primary)' }}>ev_charger</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div className="flex-row gap-3" style={{ marginBottom: 4 }}>
                            <h1 className="page-title" style={{ marginBottom: 0 }}>Unit {id || 'A-01'}</h1>
                            <span className="badge badge-warning">MAINTENANCE</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 2 }}>Firmware: v2.4.1 (Stable)</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Site: Sector 7 Parking Hub</p>
                    </div>
                </div>
                <button className="btn btn-dark">
                    <span className="material-symbols-outlined">play_arrow</span>
                    Resume Operations
                </button>
            </div>

            {/* Diagnostic Cards */}
            <h3 className="section-title mb-4">Maintenance Diagnostics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {DIAGNOSTICS.map(d => (
                    <div key={d.title} className="card-sm" style={{ padding: '1.25rem', opacity: d.running ? 0.85 : 1 }}>
                        <div className="flex-between mb-4">
                            <div style={{ background: 'var(--primary-20)', padding: 8, borderRadius: 8 }}>
                                <span className="material-symbols-outlined text-primary">{d.icon}</span>
                            </div>
                            {d.running ? (
                                <span className="flex-row gap-2" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                                    IN PROGRESS
                                </span>
                            ) : (
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>READY</span>
                            )}
                        </div>
                        <h4 style={{ fontWeight: 700, color: '#fff', marginBottom: 4 }}>{d.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{d.desc}</p>
                        {d.running ? (
                            <button disabled style={{ width: '100%', background: 'rgba(71,85,105,0.5)', color: '#94a3b8', border: 'none', borderRadius: 8, padding: '0.6rem', fontFamily: 'inherit', cursor: 'not-allowed', fontSize: '0.875rem' }}>
                                System Busy…
                            </button>
                        ) : (
                            <button className="btn btn-ghost w-full" style={{ fontSize: '0.875rem' }}>Run {d.title.split(' ').slice(-2).join(' ')}</button>
                        )}
                    </div>
                ))}
            </div>

            {/* Telemetry + Activity Log */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Telemetry */}
                <div>
                    <h3 className="section-title mb-4">Live Telemetry</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        {[
                            { label: 'Internal Temp', value: '42.5°C', pct: 65, barColor: '#f59e0b' },
                            { label: 'Input Voltage', value: '480.2V', pct: 98, barColor: 'var(--primary)' },
                        ].map(t => (
                            <div key={t.label} className="card-sm" style={{ padding: '1rem' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>{t.label}</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>{t.value}</p>
                                <div className="progress-bar">
                                    <div style={{ height: '100%', background: t.barColor, width: `${t.pct}%`, borderRadius: 999 }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Map placeholder */}
                    <div className="card-sm" style={{ padding: '1rem' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Maintenance Map View</p>
                        <div style={{
                            background: 'var(--bg-panel)',
                            borderRadius: 8,
                            height: 120,
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundImage: 'linear-gradient(rgba(14,164,164,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(14,164,164,0.08) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                        }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 40 }}>location_on</span>
                        </div>
                    </div>
                </div>

                {/* Activity Log */}
                <div>
                    <h3 className="section-title mb-4">Activity Log</h3>
                    <div className="card overflow-hidden" style={{ height: 'calc(100% - 2rem)' }}>
                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Session: 2023-10-24</p>
                        </div>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {ACTIVITY_LOG.map((l, i) => (
                                <div key={i} className="flex-row gap-3">
                                    <div style={{ width: 4, background: l.color, borderRadius: 4, alignSelf: 'stretch', flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{l.time}</p>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff' }}>{l.event}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)' }}>
                            <button style={{ width: '100%', background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}>
                                View All History
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
