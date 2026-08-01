import React, { useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LayoutDashboard, Users, LogOut, FileText, CalendarClock, ListOrdered, Monitor, Stethoscope } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [];
    
    if (user?.role === 'Admin') {
        navItems.push({ path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> });
        navItems.push({ path: '/patients', label: 'Patients', icon: <Users size={20} /> });
        navItems.push({ path: '/appointments', label: 'Appointments', icon: <CalendarClock size={20} /> });
        navItems.push({ path: '/queue', label: 'Queue Management', icon: <ListOrdered size={20} /> });
        navItems.push({ path: '/assessment', label: 'Assessment', icon: <Stethoscope size={20} /> });
        navItems.push({ path: '/medical-records', label: 'Medical Records', icon: <FileText size={20} /> });
        navItems.push({ path: '/queue-dashboard', label: 'Queue Display', icon: <Monitor size={20} /> });
    }
    if (user?.role === 'Registrator') {
        navItems.push({ path: '/patients', label: 'Patients', icon: <Users size={20} /> });
        navItems.push({ path: '/appointments', label: 'Appointments', icon: <CalendarClock size={20} /> });
        navItems.push({ path: '/queue', label: 'Queue Management', icon: <ListOrdered size={20} /> });
        navItems.push({ path: '/queue-dashboard', label: 'Queue Display', icon: <Monitor size={20} /> });
    }
    if (user?.role === 'Doctor') {
        navItems.push({ path: '/patients', label: 'My Patients', icon: <Users size={20} /> });
        navItems.push({ path: '/assessment', label: 'Assessment', icon: <Stethoscope size={20} /> });
        navItems.push({ path: '/medical-records', label: 'Medical Records', icon: <FileText size={20} /> });
        navItems.push({ path: '/queue-dashboard', label: 'Queue Display', icon: <Monitor size={20} /> });
    }

    return (
        <div className="w-64 bg-clinic-900 text-white min-h-screen flex flex-col shadow-xl">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-wider text-clinic-50">Mini Clinic</h1>
                <p className="text-clinic-300 text-sm mt-1">Hello, {user?.username} ({user?.role})</p>
            </div>
            
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                            location.pathname.startsWith(item.path) 
                                ? 'bg-clinic-400 text-white' 
                                : 'text-clinic-50 hover:bg-clinic-400/50'
                        }`}
                    >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-clinic-400/30">
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-clinic-50 hover:bg-red-500/80 transition-colors duration-200"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

const Layout = () => {
    return (
        <div className="flex bg-clinic-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
