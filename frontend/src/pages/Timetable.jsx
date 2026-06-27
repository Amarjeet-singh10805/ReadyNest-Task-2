import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Clock, MapPin, User, X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const COLORS = ['#4F46E5','#7C3AED','#DB2777','#DC2626','#D97706','#059669','#0891B2','#374151'];
const empty = { subject: '', teacher: '', room: '', day: 'Monday', start_time: '09:00', end_time: '10:00', color: '#4F46E5' };

export default function Timetable() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [entries, setEntries] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  useEffect(() => {
    axios.get('/api/timetable').then(r => setEntries(r.data)).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setModal(true); };
  const openEdit = (e) => { setForm(e); setEditing(e.id); setModal(true); };

  const save = async () => {
    if (!form.subject || !form.day || !form.start_time || !form.end_time) return toast.error('Fill required fields');
    try {
      const r = editing
        ? await axios.put(`/api/timetable/${editing}`, form)
        : await axios.post('/api/timetable', form);
      setEntries(p => editing ? p.map(e => e.id === editing ? r.data : e) : [...p, r.data]);
      setModal(false);
      toast.success(editing ? 'Updated!' : 'Class added!');
    } catch (err) { toast.error('Failed to save'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this class?')) return;
    await axios.delete(`/api/timetable/${id}`);
    setEntries(p => p.filter(e => e.id !== id));
    toast.success('Deleted');
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading timetable...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin ? 'Manage the class schedule for all students' : 'Your class schedule'}
          </p>
        </div>
        {isAdmin ? (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Class
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">
            <Lock className="w-3 h-3" />
            <span>Managed by admin</span>
          </div>
        )}
      </div>

      {entries.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No classes scheduled yet</p>
          {isAdmin && <p className="text-sm mt-1">Click "Add Class" to get started</p>}
        </div>
      )}

      {DAYS.map(day => {
        const dayClasses = entries.filter(e => e.day === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
        if (!isAdmin && dayClasses.length === 0) return null; // students skip empty days
        return (
          <div key={day} className={`card ${day === today ? 'border-indigo-200 bg-indigo-50/30' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-semibold text-gray-900">{day}</h2>
              {day === today && <span className="badge bg-indigo-100 text-indigo-700">Today</span>}
              <span className="badge bg-gray-100 text-gray-600">{dayClasses.length} classes</span>
            </div>
            {dayClasses.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">No classes scheduled</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {dayClasses.map(cls => (
                  <div key={cls.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 group">
                    <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: cls.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">{cls.subject}</div>
                      {cls.teacher && <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><User className="w-3 h-3" />{cls.teacher}</div>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{cls.start_time} – {cls.end_time}</span>
                        {cls.room && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{cls.room}</span>}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(cls)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(cls.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Admin-only modal */}
      {isAdmin && modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{editing ? 'Edit Class' : 'Add Class'}</h3>
              <button onClick={() => setModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="label">Subject *</label>
                <input className="input" placeholder="Mathematics" value={form.subject} onChange={set('subject')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Teacher</label><input className="input" placeholder="Dr. Smith" value={form.teacher} onChange={set('teacher')} /></div>
                <div><label className="label">Room</label><input className="input" placeholder="Room 101" value={form.room} onChange={set('room')} /></div>
              </div>
              <div>
                <label className="label">Day *</label>
                <select className="input" value={form.day} onChange={set('day')}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Start Time *</label><input type="time" className="input" value={form.start_time} onChange={set('start_time')} /></div>
                <div><label className="label">End Time *</label><input type="time" className="input" value={form.end_time} onChange={set('end_time')} /></div>
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: form.color === c ? '#374151' : 'transparent' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} className="btn-primary flex-1">{editing ? 'Update' : 'Add Class'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
