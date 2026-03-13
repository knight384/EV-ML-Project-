import { useState } from 'react'

const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

const CHARGER_ROWS = [
    {
        id: 'A-01', status: 'online', bars: [
            { variant: 'scheduled', left: '8.33%', width: '16.66%', label: 'EV-402' },
            { variant: 'optimized', left: '41.66%', width: '25%', label: '⚡ EV-118 (Optimized)' },
        ]
    },
    {
        id: 'A-02', status: 'online', bars: [
            { variant: 'flex', left: '25%', width: '33.33%', label: 'EV-305 (Flex Window)' },
        ]
    },
    {
        id: 'B-01', status: 'idle', bars: [
            { variant: 'scheduled', left: '0%', width: '16.66%', label: 'EV-209' },
        ]
    },
    {
        id: 'B-02', status: 'online', bars: [
            { variant: 'optimized', left: '33.33%', width: '41.66%', label: '⚡ EV-501 (Optimized)' },
        ]
    },
    { id: 'C-01', status: 'error', bars: [], maintenance: true },
    {
        id: 'C-02', status: 'online', bars: [
            { variant: 'scheduled', left: '75%', width: '16.66%', label: 'EV-104' },
        ]
    },
]

const STATUS_DOT = { online: '#10b981', idle: '#64748b', error: '#ef4444' }
const TIME_OPTIONS = ['1h', '6h', '12h', '24h']

export default function SchedulesGantt() {
    const [timeRange, setTimeRange] = useState('12h')

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px - 4rem)' }}>
            {/* Top Bar */}
            <div className="flex-between mb-6">
                <div className="flex-row gap-4">
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Charging Schedules</h1>
                    <div style={{ height: 20, width: 1, background: 'var(--primary-20)' }} />
                    <div className="flex-row gap-2" style={{ background: 'var(--border)', borderRadius: 8, padding: '4px 12px', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>calendar_month</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Oct 24, 2023</span>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_more</span>
                    </div>
                </div>
                <div className="flex-row gap-3">
                    {/* Time range selector */}
                    <div className="flex-row" style={{ background: 'var(--border)', borderRadius: 8, padding: 4 }}>
                        {TIME_OPTIONS.map(t => (
                            <button key={t} onClick={() => setTimeRange(t)} style={{
                                padding: '4px 12px', fontSize: '0.7rem', fontWeight: 700, borderRadius: 6,
                                border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                background: timeRange === t ? 'var(--primary)' : 'transparent',
                                color: timeRange === t ? '#fff' : '#94a3b8',
                            }}>{t}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Gantt Chart */}
            <div className="card overflow-hidden" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Timeline header */}
                <div className="flex-row" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(17,34,34,0.6)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ width: 160, flexShrink: 0, padding: '1rem', borderRight: '1px solid var(--border)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--primary)' }}>
                        Charger ID
                    </div>
                    <div style={{ flex: 1, display: 'flex' }}>
                        {HOURS.map((h, i) => (
                            <div key={h} style={{
                                flex: 1,
                                textAlign: 'center',
                                padding: '1rem 0',
                                fontSize: '0.6rem',
                                fontFamily: 'monospace',
                                borderRight: i < HOURS.length - 1 ? '1px solid rgba(14,164,164,0.05)' : 'none',
                                color: h === '12:00' ? 'var(--primary)' : '#64748b',
                                background: h === '12:00' ? 'var(--primary-5)' : 'transparent',
                                position: 'relative',
                            }}>
                                {h}
                                {h === '12:00' && <div style={{ position: 'absolute', bottom: -9999, left: '50%', width: 1, height: 9999, background: 'var(--primary)', opacity: 0.3, zIndex: 20 }} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rows */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {CHARGER_ROWS.map(row => (
                        <div key={row.id} className="flex-row" style={{ borderBottom: '1px solid rgba(14,164,164,0.05)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            {/* Label */}
                            <div style={{ width: 160, flexShrink: 0, padding: '1rem', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Charger {row.id}</span>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[row.status] || '#64748b', boxShadow: row.status === 'online' ? `0 0 8px ${STATUS_DOT.online}80` : 'none' }} />
                            </div>

                            {/* Timeline */}
                            <div style={{ flex: 1, position: 'relative', height: 64, background: row.maintenance ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                                {/* Column grid */}
                                {HOURS.map((_, i) => (
                                    <div key={i} style={{ position: 'absolute', left: `${(i / HOURS.length) * 100}%`, top: 0, bottom: 0, width: 1, background: 'rgba(14,164,164,0.04)' }} />
                                ))}
                                {/* Current time marker */}
                                <div style={{ position: 'absolute', left: '41.66%', top: 0, bottom: 0, width: 1, background: 'var(--primary)', opacity: 0.5, zIndex: 10 }} />

                                {row.maintenance ? (
                                    <div className="flex-row gap-2" style={{ height: '100%', paddingLeft: '1rem', color: '#ef4444' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>warning</span>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>Maintenance Mode</span>
                                    </div>
                                ) : (
                                    row.bars.map((bar, i) => (
                                        <div key={i} className={`gantt-bar gantt-${bar.variant}`} style={{ left: bar.left, width: bar.width }}>
                                            <span style={{
                                                fontSize: '0.6rem', fontWeight: 700,
                                                color: bar.variant === 'optimized' ? '#fff' : bar.variant === 'flex' ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                            }}>{bar.label}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend Footer */}
                <div className="flex-between" style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
                    <div className="flex-row gap-6">
                        {[
                            { color: 'rgba(100,116,139,0.4)', border: '1px solid rgba(100,116,139,0.5)', label: 'Scheduled' },
                            { color: 'var(--primary-20)', border: '2px dashed rgba(14,164,164,0.5)', label: 'Flex (Adjustable)' },
                            { color: 'var(--primary)', border: 'none', label: 'Optimized' },
                        ].map(item => (
                            <div key={item.label} className="flex-row gap-2">
                                <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: item.border, flexShrink: 0 }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex-row gap-4" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        <span><span style={{ fontWeight: 700, color: 'var(--primary)' }}>24</span> Active Chargers</span>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#4b5563', display: 'inline-block' }} />
                        <span><span style={{ fontWeight: 700, color: '#fff' }}>1,240 kWh</span> Total Allocation</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
