import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
    { to: '/', icon: 'dashboard', label: 'Dashboard' },
    { to: '/sessions/EV-9021', icon: 'electric_car', label: 'Sessions' },
    { to: '/schedules', icon: 'calendar_today', label: 'Schedules' },
    { to: '/chargers/A-01', icon: 'ev_charger', label: 'Chargers' },
]

const SYSTEM_ITEMS = [
    { to: '/admin', icon: 'admin_panel_settings', label: 'Admin' },
]

export default function Sidebar() {
    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand">
                <div className="sidebar-brand-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>bolt</span>
                </div>
                <div>
                    <div className="sidebar-brand-name">Optimized EV</div>
                    <div className="sidebar-brand-sub">Fleet Management</div>
                </div>
            </div>

            {/* Main nav */}
            <nav className="sidebar-nav">
                {NAV_ITEMS.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <div className="sidebar-section-label">System</div>

                {SYSTEM_ITEMS.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer alert */}
            <div className="sidebar-footer">
                <div style={{
                    background: 'var(--primary-10)',
                    border: '1px solid var(--primary-20)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                        Peak Demand Alert
                    </p>
                    <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                        Next window in 45 mins. Optimization ready.
                    </p>
                </div>
            </div>
        </aside>
    )
}
