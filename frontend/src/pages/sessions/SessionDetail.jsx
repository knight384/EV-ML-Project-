import { useParams, useNavigate } from 'react-router-dom'

const KPI = [
    { label: 'Start Time', value: '14:20 PM', sub: 'Today', subColor: '#64748b' },
    { label: 'Estimated End', value: '16:45 PM', sub: '~ 2h 25m total', subColor: 'var(--primary)' },
    { label: 'Energy Delivered', value: '34.2 kWh', sub: '+12.4%', subColor: '#10b981' },
    { label: 'Current Power', value: '7.4 kW', sub: 'Stable', subColor: '#64748b', valueColor: 'var(--primary)' },
]

export default function SessionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    return (
        <div>
            {/* Breadcrumb */}
            <nav className="flex-row gap-2" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>Sessions</button>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#64748b' }}>chevron_right</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>Session #{id || 'EV-9021'}</span>
            </nav>

            {/* Header */}
            <div className="flex-between mb-8">
                <div>
                    <div className="flex-row gap-3 mb-2">
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1 }}>
                            Session #{id || 'EV-9021'}
                        </h1>
                        <span className="badge badge-outline-primary flex-row gap-2">
                            <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                            In Progress
                        </span>
                    </div>
                    <p className="flex-row gap-2" style={{ color: '#94a3b8' }}>
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>ev_station</span>
                        Charger: Level 2 – Unit 4
                    </p>
                </div>
                <div className="flex-row gap-3">
                    <button className="btn btn-primary" style={{ boxShadow: '0 0 15px rgba(14,164,164,0.35)' }}>
                        <span className="material-symbols-outlined">bolt</span>
                        Re-optimize
                    </button>
                    <button className="btn btn-danger">
                        <span className="material-symbols-outlined">stop_circle</span>
                        Stop Session
                    </button>
                </div>
            </div>

            {/* Main grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Left: KPIs + Chart */}
                <div>
                    {/* KPI Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                        {KPI.map(k => (
                            <div key={k.label} className="card" style={{ padding: '1.25rem', transition: 'border-color 0.15s', cursor: 'default' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-30)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                                <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 8 }}>{k.label}</p>
                                <p style={{ fontSize: '1.375rem', fontWeight: 700, color: k.valueColor || '#fff', marginBottom: 4 }}>{k.value}</p>
                                <p style={{ fontSize: '0.7rem', color: k.subColor }}>{k.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Power Chart */}
                    <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                        <div className="flex-between mb-6">
                            <div>
                                <h3 style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>Power Delivery (kW) vs Time</h3>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 2 }}>Real-time telemetry stream from Level 2 – Unit 4</p>
                            </div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', background: 'var(--bg-dark)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 4 }}>LIVE DATA</span>
                        </div>

                        <div style={{ height: 240, position: 'relative', marginBottom: '1rem' }}>
                            <svg viewBox="0 0 800 200" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="areaGrad" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#0ea4a4" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#0ea4a4" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d="M0 160 C50 150,100 80,150 90 S250 140,300 120 S400 40,450 60 S550 110,600 90 S700 30,800 50 V200 H0 Z" fill="url(#areaGrad)" />
                                <path d="M0 160 C50 150,100 80,150 90 S250 140,300 120 S400 40,450 60 S550 110,600 90 S700 30,800 50" fill="none" stroke="#0ea4a4" strokeWidth="3" strokeLinecap="round" />
                                <circle cx="800" cy="50" r="6" fill="#0ea4a4">
                                    <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
                                </circle>
                            </svg>
                        </div>
                        <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                            {['14:20', '14:40', '15:00', '15:20', '15:40', '16:00', '16:20'].map(t => (
                                <span key={t} style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b' }}>{t}</span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                            <button className="flex-row gap-2" style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
                                Download Detailed Session Logs (.csv)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Vehicle, Driver, Billing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Vehicle Info */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h4 className="flex-row gap-2" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>directions_car</span>
                            Vehicle Information
                        </h4>
                        <div className="flex-row gap-4" style={{ marginBottom: '1.25rem' }}>
                            <div style={{ width: 64, height: 64, background: 'var(--bg-dark)', borderRadius: 8, border: '1px solid var(--primary-20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: 32 }}>electric_car</span>
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, color: '#fff' }}>Tesla Model 3</p>
                                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Gray Metallic • 2023</p>
                            </div>
                        </div>
                        <div>
                            <div className="flex-between" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 6 }}>
                                <span style={{ color: '#94a3b8' }}>Current SOC</span>
                                <span className="text-primary">68%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: '68%' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: '0.75rem' }}>
                                {[['Target', '90%', '#fff'], ['Health', '98%', '#10b981']].map(([l, v, c]) => (
                                    <div key={l} style={{ background: 'var(--bg-dark)', borderRadius: 8, padding: '0.75rem', border: '1px solid var(--primary-5)' }}>
                                        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{l}</p>
                                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: c }}>{v}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Driver */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h4 className="flex-row gap-2" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>person</span>
                            Driver Details
                        </h4>
                        <div className="flex-row gap-4">
                            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid var(--primary-20)', background: 'var(--primary-20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>AR</span>
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, color: '#fff' }}>Alex Rivera</p>
                                <span className="badge" style={{ fontSize: '0.6rem', background: 'var(--primary-20)', color: 'var(--primary)', border: '1px solid var(--primary-30)', marginTop: 4 }}>Pro Plan</span>
                            </div>
                        </div>
                    </div>

                    {/* Billing */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h4 className="flex-row gap-2" style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '1rem' }}>
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>payments</span>
                            Billing Status
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div className="flex-between">
                                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Estimated Cost</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>$12.45</span>
                            </div>
                            <div className="flex-between">
                                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Payment Method</span>
                                <div className="flex-row gap-2">
                                    <span className="material-symbols-outlined" style={{ color: '#94a3b8', fontSize: 18 }}>credit_card</span>
                                    <span style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>VISA •••• 4242</span>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                                <div className="flex-row gap-2" style={{ background: 'var(--bg-dark)', border: '1px solid var(--primary-5)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#f59e0b', fontSize: 14 }}>info</span>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Final bill calculated upon disconnect</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
