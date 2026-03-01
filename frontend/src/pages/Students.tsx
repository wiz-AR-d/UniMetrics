import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Users, Plus, Trash2, Edit3, X, Search, AlertCircle } from 'lucide-react';

interface Course {
  id: number;
  name: string;
  totalAssignments: number;
}

interface Grade {
  courseId: number;
  marks: number;
  quizScore: number;
  labScore: number;
  assignmentsCompleted: number;
  attendancePercent: number;
  course: Course;
}

interface Student {
  id: number;
  name: string;
  email: string;
  riskProfile?: { riskScore: number; riskLevel: string };
  grades: Grade[];
}

const EMPTY_GRADE = {
  marks: 0, quizScore: 0, labScore: 0, assignmentsCompleted: 0, attendancePercent: 0
};

export default function Students() {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [gradeEdits, setGradeEdits] = useState<Record<number, typeof EMPTY_GRADE>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Add student form
  const [newStudent, setNewStudent] = useState({ name: '', email: '', password: '' });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/students`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/courses`, { headers }),
      ]);
      const s = await sRes.json();
      const c = await cRes.json();
      if (s.success) setStudents(s.students);
      if (c.success) setCourses(c.courses);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (student: Student) => {
    setEditStudent(student);
    setActiveTab(0);
    // Pre-populate grade edits from existing grades
    const edits: Record<number, typeof EMPTY_GRADE> = {};
    courses.forEach(c => {
      const g = student.grades.find(gr => gr.courseId === c.id);
      edits[c.id] = g
        ? { marks: g.marks, quizScore: g.quizScore, labScore: g.labScore, assignmentsCompleted: g.assignmentsCompleted, attendancePercent: g.attendancePercent }
        : { ...EMPTY_GRADE };
    });
    setGradeEdits(edits);
  };

  const handleSaveGrades = async () => {
    if (!editStudent) return;
    setSaving(true);
    try {
      // We need an examId — get the first exam
      const examId = 1; // default exam
      for (const course of courses) {
        const g = gradeEdits[course.id];
        if (!g) continue;
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/scores`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId: editStudent.id, courseId: course.id, examId, ...g })
        });
      }
      await fetchData();
      showToast('Grades saved and risk profile updated!');
      setEditStudent(null);
    } catch (e) {
      showToast('Failed to save grades', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/students/${id}`, { method: 'DELETE', headers });
      if (res.ok) { await fetchData(); showToast(`${name} deleted.`); }
      else showToast('Delete failed', 'error');
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/students`, {
        method: 'POST', headers,
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        setShowAddModal(false);
        setNewStudent({ name: '', email: '', password: '' });
        showToast('Student added!');
      } else {
        showToast(data.error || 'Failed to add student', 'error');
      }
    } catch { showToast('Failed to add student', 'error'); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const currentCourse = courses[activeTab];

  if (loading) return <div className="loading-screen"><div className="loader" /></div>;

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="main-content">
        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Student Management</h1>
              <p className="page-subtitle">{students.length} students enrolled</p>
            </div>
            <button className="primary-button btn-sm" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Student
            </button>
          </div>

          {/* Search */}
          <div className="search-bar-full glass-panel">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Students Table */}
          <div className="card glass-panel" style={{ marginTop: '1.5rem' }}>
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Risk Level</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => (
                    <tr key={s.id}>
                      <td className="font-medium">{s.name}</td>
                      <td className="text-muted">{s.email}</td>
                      <td>
                        <span className={`status-badge ${s.riskProfile?.riskLevel?.toLowerCase() || 'none'}`}>
                          {s.riskProfile?.riskLevel || 'N/A'}
                        </span>
                      </td>
                      <td className="font-bold">{s.riskProfile?.riskScore?.toFixed(1) ?? '—'}</td>
                      <td>
                        <div className="action-btns">
                          <button className="icon-btn edit" onClick={() => openEdit(s)} title="Edit Grades">
                            <Edit3 size={16} />
                          </button>
                          <button className="icon-btn delete" onClick={() => handleDelete(s.id, s.name)} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No students found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* ──── Add Student Modal ──── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Users size={20} /> Add New Student</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddStudent} className="modal-form">
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-wrapper">
                  <input type="text" placeholder="Jane Doe" required
                    value={newStudent.name}
                    onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <input type="email" placeholder="jane@uni.edu" required
                    value={newStudent.email}
                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} />
                </div>
              </div>
              <div className="input-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <input type="password" placeholder="Default password"
                    value={newStudent.password}
                    onChange={e => setNewStudent({ ...newStudent, password: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="primary-button" style={{ marginTop: '1rem' }}>
                <Plus size={18} /> Create Student
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ──── Edit Grades Modal ──── */}
      {editStudent && (
        <div className="modal-overlay" onClick={() => setEditStudent(null)}>
          <div className="modal modal-lg glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3><Edit3 size={20} /> {editStudent.name}</h3>
                <p className="modal-subtitle">Edit academic performance per subject</p>
              </div>
              <button className="close-btn" onClick={() => setEditStudent(null)}><X size={20} /></button>
            </div>

            {/* Subject Tabs */}
            <div className="tab-bar">
              {courses.map((c, i) => (
                <button
                  key={c.id}
                  className={`tab-btn ${activeTab === i ? 'active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {currentCourse && gradeEdits[currentCourse.id] && (
              <div className="grade-form">
                <div className="grade-info-banner">
                  Total assignments for <strong>{currentCourse.name}</strong>: <strong>{currentCourse.totalAssignments}</strong>
                  <span className="hint"> (change globally in Subject Settings)</span>
                </div>
                <div className="grade-grid">
                  {[
                    { key: 'marks', label: 'Exam Score', max: 100, hint: 'Midterm / Final (0–100)' },
                    { key: 'quizScore', label: 'Quiz Score', max: 100, hint: 'Combined quiz marks (0–100)' },
                    { key: 'labScore', label: 'Lab / Practical', max: 100, hint: 'Lab performance (0–100)' },
                    { key: 'assignmentsCompleted', label: `Assignments Completed`, max: currentCourse.totalAssignments, hint: `Out of ${currentCourse.totalAssignments} total` },
                    { key: 'attendancePercent', label: 'Attendance %', max: 100, hint: 'Class presence (0–100)' },
                  ].map(field => (
                    <div key={field.key} className="grade-field">
                      <label>{field.label}</label>
                      <span className="field-hint">{field.hint}</span>
                      <input
                        type="number"
                        min={0}
                        max={field.max}
                        value={(gradeEdits[currentCourse.id] as any)[field.key]}
                        onChange={e => setGradeEdits(prev => ({
                          ...prev,
                          [currentCourse.id]: {
                            ...prev[currentCourse.id],
                            [field.key]: Math.min(field.max, Math.max(0, Number(e.target.value)))
                          }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setEditStudent(null)}>Cancel</button>
              <button className="primary-button" onClick={handleSaveGrades} disabled={saving}>
                {saving ? 'Saving...' : 'Save All & Recalculate Risk'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'error' ? <AlertCircle size={16} /> : '✓'} {toast.msg}
        </div>
      )}
    </div>
  );
}
