import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Bell, CheckCheck, Check, AlertTriangle, ShieldAlert, Info } from 'lucide-react';

interface Alert {
  id: number;
  message: string;
  isRead: boolean;
  severity: string;
  createdAt: string;
  user: { id: number; name: string; email: string };
}

const SeverityIcon = ({ severity }: { severity: string }) => {
  if (severity === 'HIGH') return <AlertTriangle size={18} />;
  if (severity === 'MEDIUM') return <ShieldAlert size={18} />;
  return <Info size={18} />;
};

export default function Notifications() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAlerts = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/alerts`, { headers });
    const data = await res.json();
    if (data.success) setAlerts(data.alerts);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const markRead = async (id: number) => {
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/alerts/${id}/read`, { method: 'PATCH', headers });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const markAllRead = async () => {
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/alerts/read-all`, { method: 'PATCH', headers });
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="dashboard-layout">
      <Sidebar unreadCount={unreadCount} />
      <main className="main-content">
        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Notifications</h1>
              <p className="page-subtitle">{unreadCount} unread alerts</p>
            </div>
            {unreadCount > 0 && (
              <button className="secondary-button btn-sm" onClick={markAllRead}>
                <CheckCheck size={18} /> Mark All Read
              </button>
            )}
          </div>

          {alerts.length === 0 ? (
            <div className="empty-full glass-panel">
              <Bell size={56} style={{ opacity: 0.3 }} />
              <h3>All clear!</h3>
              <p>No alerts have been generated yet.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`notification-item glass-panel severity-border-${alert.severity?.toLowerCase()} ${alert.isRead ? 'read' : 'unread'}`}
                >
                  <div className={`notif-icon severity-icon-${alert.severity?.toLowerCase()}`}>
                    <SeverityIcon severity={alert.severity} />
                  </div>
                  <div className="notif-content">
                    <div className="notif-header">
                      <span className="notif-student">{alert.user?.name}</span>
                      <span className={`status-badge ${alert.severity?.toLowerCase()}`}>{alert.severity}</span>
                    </div>
                    <p className="notif-message">{alert.message}</p>
                    <span className="notif-time">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                  {!alert.isRead && (
                    <button className="icon-btn mark-read" onClick={() => markRead(alert.id)} title="Mark as read">
                      <Check size={16} />
                    </button>
                  )}
                  {alert.isRead && <span className="read-tag">Read</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
