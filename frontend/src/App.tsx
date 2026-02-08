import { useEffect, useState } from 'react'
import './App.css'

interface RiskProfile {
  riskScore: number;
  riskLevel: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  riskProfile?: RiskProfile;
}

interface Alert {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: User;
}

function App() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [alertsRes, studentsRes] = await Promise.all([
        fetch('http://localhost:3000/api/alerts'),
        fetch('http://localhost:3000/api/students')
      ])
      const alertsData = await alertsRes.json()
      const studentsData = await studentsRes.json()
      
      setAlerts(alertsData.alerts || [])
      setStudents(studentsData.students || [])
    } catch (error) {
      console.error("Failed to fetch dashboard data", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) return <div className="loading">Loading UniMetrics...</div>

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>UniMetrics</h1>
        <p>Premium Academic Intelligence System</p>
      </header>

      <main className="main-content">
        <section className="section alerts-section">
          <h2>Risk Alerts <span className="badge">{alerts.length}</span></h2>
          {alerts.length === 0 ? (
            <p className="empty-state">No active alerts. Good job!</p>
          ) : (
            <ul className="alerts-list">
              {alerts.map(alert => (
                <li key={alert.id} className="alert-card">
                  <div className="alert-header">
                    <span className="user-name">{alert.user?.name}</span>
                    <span className="time">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="section students-section">
          <h2>Student Risk Profiles</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Risk Level</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>
                      <span className={`risk-badge level-${student.riskProfile?.riskLevel?.toLowerCase() || 'none'}`}>
                        {student.riskProfile?.riskLevel || 'N/A'}
                      </span>
                    </td>
                    <td>{student.riskProfile?.riskScore || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
