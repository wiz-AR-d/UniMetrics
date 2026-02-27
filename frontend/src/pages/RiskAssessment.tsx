import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { ShieldAlert, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';

interface SubjectBreakdown {
  subject: string;
  marks: number;
  quizScore: number;
  labScore: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  attendancePercent: number;
  composite: number;
}

interface StudentRisk {
  id: number;
  name: string;
  email: string;
  score: number;
  level: string;
  breakdown: SubjectBreakdown[];
}

export default function RiskAssessment() {
  const { token } = useAuth();
  const [students, setStudents] = useState<StudentRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/risk-breakdown`, { headers });
      const data = await res.json();
      if (data.success) setStudents(data.breakdown);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const riskCounts = {
    HIGH: students.filter(s => s.level === 'HIGH').length,
    MEDIUM: students.filter(s => s.level === 'MEDIUM').length,
    LOW: students.filter(s => s.level === 'LOW').length,
  };

  const getWeakestFactor = (b: SubjectBreakdown[]) => {
    if (!b.length) return null;
    // find worst average for each factor
    const avg = (fn: (s: SubjectBreakdown) => number) => b.reduce((s, x) => s + fn(x), 0) / b.length;
    const factors = [
      { name: 'Exam Score', value: avg(x => x.marks) },
      { name: 'Quiz Score', value: avg(x => x.quizScore) },
      { name: 'Lab Score', value: avg(x => x.labScore) },
      { name: 'Attendance', value: avg(x => x.attendancePercent) },
      { name: 'Assignments', value: b.reduce((s, x) => s + (x.assignmentsCompleted / (x.totalAssignments || 1)) * 100, 0) / b.length },
    ];
    return factors.sort((a, b) => a.value - b.value)[0];
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-content">
          <h1 className="page-title">Risk Assessment</h1>

          {/* Distribution Cards */}
          <div className="risk-dist-grid">
            <div className="risk-dist-card high glass-panel">
              <AlertTriangle size={28} />
              <div className="risk-dist-number">{riskCounts.HIGH}</div>
              <div className="risk-dist-label">High Risk</div>
            </div>
            <div className="risk-dist-card medium glass-panel">
              <ShieldAlert size={28} />
              <div className="risk-dist-number">{riskCounts.MEDIUM}</div>
              <div className="risk-dist-label">Medium Risk</div>
            </div>
            <div className="risk-dist-card low glass-panel">
              <CheckCircle size={28} />
              <div className="risk-dist-number">{riskCounts.LOW}</div>
              <div className="risk-dist-label">Low Risk</div>
            </div>
          </div>

          {/* Student Risk Cards (sorted worst first) */}
          <div className="risk-cards-list">
            {students.map(student => {
              const weak = getWeakestFactor(student.breakdown);
              const isOpen = expanded === student.id;
              return (
                <div key={student.id} className={`risk-card glass-panel risk-border-${student.level?.toLowerCase()}`}>
                  <div className="risk-card-header" onClick={() => setExpanded(isOpen ? null : student.id)}>
                    <div className="risk-card-identity">
                      <div className={`risk-avatar level-${student.level?.toLowerCase()}`}>
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="risk-name">{student.name}</div>
                        <div className="risk-email">{student.email}</div>
                      </div>
                    </div>
                    <div className="risk-card-scores">
                      <span className={`status-badge ${student.level?.toLowerCase()}`}>{student.level}</span>
                      <span className="risk-score-big">{student.score.toFixed(1)}</span>
                      {weak && (
                        <span className="weak-factor">
                          <TrendingDown size={14} /> Weakest: {weak.name} ({weak.value.toFixed(0)}%)
                        </span>
                      )}
                      <span className="expand-btn">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="risk-breakdown-table">
                      <table className="modern-table">
                        <thead>
                          <tr>
                            <th>Subject</th>
                            <th>Exam</th>
                            <th>Quiz</th>
                            <th>Lab</th>
                            <th>Assignments</th>
                            <th>Attendance</th>
                            <th>Composite</th>
                          </tr>
                        </thead>
                        <tbody>
                          {student.breakdown.map(b => (
                            <tr key={b.subject}>
                              <td className="font-medium">{b.subject}</td>
                              <td>{b.marks}</td>
                              <td>{b.quizScore}</td>
                              <td>{b.labScore}</td>
                              <td>{b.assignmentsCompleted}/{b.totalAssignments}</td>
                              <td>{b.attendancePercent}%</td>
                              <td>
                                <span className={`status-badge ${b.composite >= 70 ? 'low' : b.composite >= 50 ? 'medium' : 'high'}`}>
                                  {b.composite}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
