export default function Header() {
    return (
        <header className="top-header">
            {/* Search */}
            <div className="header-search">
                <span className="material-symbols-outlined header-search-icon">search</span>
                <input type="text" placeholder="Search sessions, chargers, vehicles…" />
            </div>

            {/* Right actions */}
            <div className="header-actions">
                <button className="icon-btn" aria-label="Notifications">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="notif-dot" />
                </button>

                <div className="header-divider" />

                <div className="user-chip">
                    <div className="user-info">
                        <div className="user-name">Alex Rivera</div>
                        <div className="user-role">Facility Manager</div>
                    </div>
                    <div className="avatar">AR</div>
                </div>
            </div>
        </header>
    )
}
