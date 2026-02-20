import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity, TrendingUp, Users, ShieldAlert, Bell,
  Settings, LogOut, User as UserIcon
} from 'lucide-react';

interface SidebarProps {
  unreadCount?: number;
}

export default function Sidebar({ unreadCount = 0 }: SidebarProps) {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/',                icon: <TrendingUp size={20} />,  label: 'Dashboard' },
    { to: '/students',        icon: <Users size={20} />,       label: 'Students' },
    { to: '/risk-assessment', icon: <ShieldAlert size={20} />, label: 'Risk Assessment' },
    { to: '/notifications',   icon: <Bell size={20} />,        label: 'Notifications', badge: unreadCount },
  ];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <Activity className="brand-icon" size={32} />
        <h2>UniMetrics</h2>
      </div>

      <nav className="nav-menu">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <span className="nav-badge">{item.badge}</span>
            )}
          </NavLink>
        ))}

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings size={20} /> Subject Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar"><UserIcon size={20} /></div>
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role === 'UNIVERSITY_ADMIN' ? 'University Admin' : 'Faculty'}</span>
          </div>
        </div>
        <button className="logout-button" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}
