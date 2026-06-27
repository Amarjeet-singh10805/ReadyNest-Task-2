import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Plus, CheckCircle, XCircle, Clock, X, Users, Search, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['present', 'absent', 'late'];
const STATUS_COLORS = { present: '#10B981', absent: '#EF4444', late: '#F59E0B' };

// ─── Shared stats/charts component (used for both student self-view and admin per-student view) ───
function AttendanceView({ records, stats, onDelete, isAdmin }) {
  const subjects = Object.keys(stats);
  const overallPresent = records.filter(r => r.status === 'present').length;
  const overallTotal = records.length;
  const overallPct = overallTotal ? Math.round((overallPresent / overallTotal) * 100) : 0;

  const pieData = [
    { name: 'Present', value: records.filter(r => r.status === 'present').length, color: '#10B981' },
    { name: 'Absent', value: records.filter(r => r.status === 'absent').length, color: '#EF4444' },
    { name: 'Late', value: records.filter(r => r.status === 'late').length, color: '#F59E0B' },
  ].filter(d => d.value > 0);

  const barData = subjects.map(s => ({
    subject: s.length > 10 ? s.slice(0, 10) + '…' : s,
    percentage: stats[s].percentage,
    present: stats[s].present,
    absent: stats[s].absent,
  }));

  if (records.length === 0) {
    return <p className="text-center text-gray-400 py-12">No attendance records yet</p>;
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card col-span-2 md:col-span-1">
          <div className="text-3xl font-bold text-gray-900">{overallPct}%</div>
          <div className="text-sm text-gray-500 mt-1">Overall Attendance</div>
          <div className={`text-xs mt-2 font-medium ${overallPct >= 75 ? 'text-green-600' : 'text-red-600'}`}>
            {overallPct >= 75 ? '✅ Good standing' : '⚠️ Below 75%'}
          </div>
        </div>
        <div className="card"><div className="text-2xl font-bold text-green-600">{records.filter(r=>r.status==='present').length}</div><div className="text-sm text-gray-500 mt-1">Present</div></div>
        <div className="card"><div className="text-2xl font-bold text-red-600">{records.filter(r=>r.status==='absent').length}</div><div className="text-sm text-gray-500 mt-1">Absent</div></div>
        <div className="card"><div className="text-2xl font-bold text-amber-600">{records.filter(r=>r.status==='late').length}</div><div className="text-sm text-gray-500 mt-1">Late</div></div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Overall Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {barData.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">By Subject (%)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {barData.map((d, i) => <Cell key={i} fill={d.percentage >= 75 ? '#10B981' : d.percentage >= 60 ? '#F59E0B' : '#EF4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Subject breakdown */}
      {subjects.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Subject-wise Attendance</h3>
          <div className="space-y-3">
            {subjects.map(s => {
              const d = stats[s];
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{s}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{d.present}/{d.total} classes</span>
                      <span className={`badge ${d.percentage >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${d.percentage >= 75 ? 'bg-green-500' : d.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${d.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Records list */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Records</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {records.slice(0, 30).map(r => (
            <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 group">
              {r.status === 'present' ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                : r.status === 'absent' ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                : <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />}
              <span className="text-sm font-medium text-gray-900 flex-1">{r.subject}</span>
              <span className="text-xs text-gray-500">{r.date}</span>
              <span className={`badge text-xs ${r.status === 'present' ? 'bg-green-100 text-green-700' : r.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
              {isAdmin && onDelete && (
                <button onClick={() => onDelete(r.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg text-red-400 transition-opacity"><X className="w-3 h-3" /></button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Admin view: student list + per-student attendance management ───
function AdminAttendancePage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ subject: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'present' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStudent, setLoadingStudent] = useState(false);

  useEffect(() => {
    axios.get('/api/attendance/students').then(r => setStudents(r.data)).finally(() => setLoading(false));
  }, []);

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setLoadingStudent(true);
    await Promise.all([
      axios.get(`/api/attendance/student/${student.id}`).then(r => setRecords(r.data)),
      axios.get(`/api/attendance/student/${student.id}/stats`).then(r => setStats(r.data)),
    ]);
    setLoadingStudent(false);
  };

  const save = async () => {
    if (!form.subject || !form.date || !form.status) return toast.error('Fill all fields');
    try {
      await axios.post('/api/attendance', { ...form, user_id: selectedStudent.id });
      await Promise.all([
        axios.get(`/api/attendance/student/${selectedStudent.id}`).then(r => setRecords(r.data)),
        axios.get(`/api/attendance/student/${selectedStudent.id}/stats`).then(r => setStats(r.data)),
      ]);
      setModal(false);
      toast.success('Attendance marked!');
    } catch { toast.error('Failed to mark attendance'); }
  };

  const del = async (id) => {
    await axios.delete(`/api/attendance/${id}`);
    setRecords(p => p.filter(r => r.id !== id));
    await axios.get(`/api/attendance/student/${selectedStudent.id}/stats`).then(r => setStats(r.data));
    toast.success('Deleted');
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.roll_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.department || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  // Student detail view
  if (selectedStudent) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedStudent(null); setRecords([]); setStats({}); }}
              className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h1>
              <p className="text-sm text-gray-500">
                {selectedStudent.roll_number && <span className="mr-2">Roll: {selectedStudent.roll_number}</span>}
                {selectedStudent.department && <span>{selectedStudent.department}</span>}
                {selectedStudent.year && <span className="ml-1">• Year {selectedStudent.year}</span>}
              </p>
            </div>
          </div>
          <button onClick={() => { setForm({ subject: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'present' }); setModal(true); }}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Mark Attendance
          </button>
        </div>

        {loadingStudent ? (
          <div className="text-center py-12 text-gray-400">Loading attendance data...</div>
        ) : (
          <AttendanceView records={records} stats={stats} onDelete={del} isAdmin={true} />
        )}

        {/* Mark Attendance Modal */}
        {modal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div>
                  <h3 className="font-semibold">Mark Attendance</h3>
                  <p className="text-xs text-gray-500 mt-0.5">For: {selectedStudent.name}</p>
                </div>
                <button onClick={() => setModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-3">
                <div><label className="label">Subject *</label><input className="input" placeholder="Mathematics" value={form.subject} onChange={e => setForm(p => ({...p, subject: e.target.value}))} /></div>
                <div><label className="label">Date *</label><input type="date" className="input" value={form.date} onChange={e => setForm(p => ({...p, date: e.target.value}))} /></div>
                <div>
                  <label className="label">Status *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => setForm(p => ({ ...p, status: s }))}
                        className={`py-2 rounded-xl text-sm font-medium capitalize transition-colors ${form.status === s
                          ? s === 'present' ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : s === 'absent' ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-amber-100 text-amber-700 border-2 border-amber-300'
                          : 'bg-gray-100 text-gray-600 border-2 border-transparent'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-gray-100">
                <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} className="btn-primary flex-1">Mark</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Student list
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-sm text-gray-500">Select a student to view or mark attendance</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search by name, roll number, or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No students found</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(student => (
            <button key={student.id} onClick={() => selectStudent(student)}
              className="card text-left hover:border-indigo-200 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate group-hover:text-indigo-600">{student.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {student.roll_number && <span className="mr-2">#{student.roll_number}</span>}
                    {student.department && <span>{student.department}</span>}
                    {student.year && <span className="ml-1">• Yr {student.year}</span>}
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 rotate-180 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Student view: read-only attendance ───
function StudentAttendancePage() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/attendance').then(r => setRecords(r.data)),
      axios.get('/api/attendance/stats').then(r => setStats(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-sm text-gray-500">View your class attendance and statistics</p>
      </div>
      <AttendanceView records={records} stats={stats} isAdmin={false} />
    </div>
  );
}

// ─── Main export: role-based routing ───
export default function Attendance() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'admin' ? <AdminAttendancePage /> : <StudentAttendancePage />;
}
