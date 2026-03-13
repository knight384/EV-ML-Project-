import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function MainLayout() {
    return (
        <div className="app-shell">
            <Sidebar />
            <div className="main-content">
                <Header />
                <div className="page-body">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}
