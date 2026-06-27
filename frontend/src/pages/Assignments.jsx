import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, CheckCircle, Circle, Clock, Paperclip, X, Filter } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'in-progress', 'completed'];
const empty = { title: '', subject: '', description: '', due_date: '', priority: 'medium', status: 'pending' };

function PriorityBadge({ p }) {
  const cls = p === 'high' ? 'bg-red-100 text-red-700' : p === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700';
  return <span className={`badge ${cls}`}>{p}</span>;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    axios.get('/api/assignments').then(r => setAssignments(r.data)).finally(() => setLoading(false));
  }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setFile(null); setModal(true); };
  const openEdit = (a) => { setForm(a); setEditing(a.id); setFile(null); setModal(true); };

  const save = async () => {
    if (!form.title || !form.subject || !form.due_date) return toast.error('Fill required fields');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('attachment', file);
    try {
      const r = editing
        ? await axios.put(`/api/assignments/${editing}`, fd)
        : await axios.post('/api/assignments', fd);
      setAssignments(p => editing ? p.map(a => a.id === editing ? r.data : a) : [...p, r.data]);
      setModal(false);
      toast.success(editing ? 'Updated!' : 'Assignment added!');
    } catch (err) { toast.error('Failed to save'); }
  };

  const toggleStatus = async (a) => {
    const status = a.status === 'completed' ? 'pending' : 'completed';
    const r = await axios.patch(`/api/assignments/${a.id}/status`, { status });
    setAssignments(p => p.map(x => x.id === a.id ? r.data : x));
    toast.success(status === 'completed' ? '✅ Marked complete!' : 'Marked pending');
  };

  const del = async (id) => {
    if (!confirm('Delete?')) return;
    await axios.delete(`/api/assignments/${id}`);
    setAssignments(p => p.filter(a => a.id !== id));
    toast.success('Deleted');
  };

  const filtered = filter === 'all' ? assignments : assignments.filter(a => a.status === filter);
  const completed = assignments.filter(a => a.status === 'completed').length;
  const progress = assignments.length ? Math.round((completed / assignments.length) * 100) : 0;

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500">{completed}/{assignments.length} completed</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-indigo-600">{progress}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" />Pending: {assignments.filter(a=>a.status==='pending').length}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />In Progress: {assignments.filter(a=>a.status==='in-progress').length}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Done: {completed}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No assignments here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const due = parseISO(a.due_date);
            const overdue = isPast(due) && a.status !== 'completed';
            const dueToday = isToday(due);
            return (
              <div key={a.id} className={`card flex items-start gap-3 ${a.status === 'completed' ? 'opacity-60' : ''}`}>
                <button onClick={() => toggleStatus(a)} className="mt-0.5 flex-shrink-0">
                  {a.status === 'completed'
                    ? <CheckCircle className="w-5 h-5 text-green-600" />
                    : <Circle className="w-5 h-5 text-gray-300 hover:text-indigo-600 transition-colors" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${a.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{a.title}</span>
                    <PriorityBadge p={a.priority} />
                    {a.status !== 'pending' && <span className={`badge ${a.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{a.status}</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{a.subject}</div>
                  {a.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{a.description}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : dueToday ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                      <Clock className="w-3 h-3" />
                      {overdue ? 'Overdue · ' : dueToday ? 'Due today · ' : ''}{format(due, 'MMM d, yyyy')}
                    </span>
                    {a.attachment && <a href={a.attachment} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"><Paperclip className="w-3 h-3" />Attachment</a>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold">{editing ? 'Edit Assignment' : 'New Assignment'}</h3>
              <button onClick={() => setModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <div><label className="label">Title *</label><input className="input" placeholder="Assignment title" value={form.title} onChange={set('title')} /></div>
              <div><label className="label">Subject *</label><input className="input" placeholder="Mathematics" value={form.subject} onChange={set('subject')} /></div>
              <div><label className="label">Description</label><textarea className="input resize-none h-20" placeholder="Details..." value={form.description} onChange={set('description')} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Due Date *</label><input type="date" className="input" value={form.due_date} onChange={set('due_date')} /></div>
                <div><label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={set('priority')}>
                    {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </div>
              </div>
              {editing && <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={set('status')}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>}
              <div>
                <label className="label">Attachment</label>
                <input type="file" className="input text-sm" onChange={e => setFile(e.target.files[0])} />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} className="btn-primary flex-1">{editing ? 'Update' : 'Add Assignment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
