import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { 
  Users, ShieldAlert, Bell, TrendingUp, Search, 
  AlertTriangle, CheckCircle
} from 'lucide-react';

interface Stats {
  totalStudents: number;
  unreadAlerts: number;
  highRisk: number;
  avgScore: number;
}

interface Alert {
  id: number;
  message: string;
  isRead: boolean;
  severity: string;
  createdAt: string;
  user: { name: string };
}

interface Student {
  id: number;
  name: string;
  email: string;
  riskProfile?: { riskScore: number; riskLevel: string };
}

export default function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const [statsRes, alertsRes, studentsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stats`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/alerts`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/students`, { headers }),
      ]);
      const s = await statsRes.json();
      const a = await alertsRes.json();
      const st = await studentsRes.json();
      if (s.success) setStats(s.stats);
      if (a.success) setAlerts(a.alerts);
      if (st.success) setStudents(st.students);
    } catch (e) {
      console.error('Dashboard fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const topRisk = [...students]
    .sort((a, b) => (a.riskProfile?.riskScore ?? 100) - (b.riskProfile?.riskScore ?? 100))
    .slice(0, 5);

  return (
    <div className="dashboard-layout">
      <Sidebar unreadCount={unreadCount} />

      <main className="main-content">
        <header className="topbar glass-panel">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input type="text" placeholder="Search students, courses..." />
          </div>
          <div className="topbar-actions">
            <button className="icon-button notification-btn" onClick={() => navigate('/notifications')}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          <h1 className="page-title">Overview Dashboard</h1>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card glass-panel">
              <div className="stat-icon blue"><Users size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats?.totalStudents ?? 0}</span>
                <span className="stat-label">Total Students</span>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon red"><AlertTriangle size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats?.highRisk ?? 0}</span>
                <span className="stat-label">High Risk</span>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon amber"><Bell size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats?.unreadAlerts ?? 0}</span>
                <span className="stat-label">Unread Alerts</span>
              </div>
            </div>
            <div className="stat-card glass-panel">
              <div className="stat-icon green"><TrendingUp size={24} /></div>
              <div className="stat-info">
                <span className="stat-value">{stats?.avgScore ?? 0}</span>
                <span className="stat-label">Avg Score</span>
              </div>
            </div>
          </div>

          <div className="grid-layout">
            {/* Recent Alerts */}
            <section className="card glass-panel">
              <div className="card-header">
                <h3><Bell size={18} /> Recent Alerts</h3>
                <button className="link-btn" onClick={() => navigate('/notifications')}>View All →</button>
              </div>
              {alerts.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle size={40} />
                  <p>No active alerts!</p>
                </div>
              ) : (
                <div className="alert-list">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className={`alert-item severity-${alert.severity?.toLowerCase()}`}>
                      <div className="alert-avatar">{alert.user?.name?.charAt(0)}</div>
                      <div className="alert-details">
                        <span className="alert-user">{alert.user?.name}</span>
                        <p className="alert-text">{alert.message}</p>
                      </div>
                      <span className="alert-time">{new Date(alert.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Top Risk Students */}
            <section className="card glass-panel">
              <div className="card-header">
                <h3><ShieldAlert size={18} /> Top Risk Students</h3>
                <button className="link-btn" onClick={() => navigate('/students')}>Manage →</button>
              </div>
              <div className="table-wrapper">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Risk Level</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRisk.map(s => (
                      <tr key={s.id}>
                        <td className="font-medium">{s.name}</td>
                        <td>
                          <span className={`status-badge ${s.riskProfile?.riskLevel?.toLowerCase() || 'none'}`}>
                            {s.riskProfile?.riskLevel || 'N/A'}
                          </span>
                        </td>
                        <td className="font-bold">{s.riskProfile?.riskScore?.toFixed(1) ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
