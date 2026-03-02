import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Settings, Save, AlertCircle } from 'lucide-react';

interface Course {
  id: number;
  name: string;
  totalAssignments: number;
}

export default function SubjectSettings() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [edits, setEdits] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCourses = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/courses`, { headers });
    const data = await res.json();
    if (data.success) {
      setCourses(data.courses);
      const e: Record<number, number> = {};
      data.courses.forEach((c: Course) => { e[c.id] = c.totalAssignments; });
      setEdits(e);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSave = async (courseId: number, name: string) => {
    setSaving(courseId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/courses/${courseId}/assignments`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ totalAssignments: edits[courseId] })
      });
      const data = await res.json();
      if (data.success) {
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, totalAssignments: edits[courseId] } : c));
        showToast(`${name}: total assignments updated to ${edits[courseId]} for all students.`);
      } else {
        showToast(data.error || 'Update failed', 'error');
      }
    } catch {
      showToast('Update failed', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <div className="dashboard-content">
          <h1 className="page-title">Subject Settings</h1>
          <p className="page-subtitle">Changing total assignments here applies to <strong>all students</strong> globally for that subject.</p>

          <div className="settings-grid">
            {courses.map(course => (
              <div key={course.id} className="settings-card glass-panel">
                <div className="settings-card-header">
                  <Settings size={20} />
                  <h3>{course.name}</h3>
                </div>
                <div className="settings-field">
                  <label>Total Assignments</label>
                  <p className="settings-hint">Students' completed counts are measured against this value. Risk engine reads this for the assignment completion weight (20%).</p>
                  <div className="settings-input-row">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={edits[course.id] ?? course.totalAssignments}
                      onChange={e => setEdits(prev => ({ ...prev, [course.id]: Number(e.target.value) }))}
                    />
                    <button
                      className="primary-button btn-sm"
                      onClick={() => handleSave(course.id, course.name)}
                      disabled={saving === course.id || edits[course.id] === course.totalAssignments}
                    >
                      {saving === course.id ? 'Saving...' : <><Save size={16} /> Save</>}
                    </button>
                  </div>
                  <p className="settings-current">Current: <strong>{course.totalAssignments}</strong> assignments</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : '✓'} {toast.msg}
        </div>
      )}
    </div>
  );
}
