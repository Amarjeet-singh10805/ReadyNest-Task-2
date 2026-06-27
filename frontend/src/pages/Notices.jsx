import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Bell, Plus, Trash2, Paperclip, X, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const CATEGORIES = ['general', 'academic', 'exam', 'event', 'holiday', 'sports', 'other'];
const CAT_COLORS = {
  general: 'bg-gray-100 text-gray-700',
  academic: 'bg-blue-100 text-blue-700',
  exam: 'bg-red-100 text-red-700',
  event: 'bg-purple-100 text-purple-700',
  holiday: 'bg-green-100 text-green-700',
  sports: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-600',
};

export default function Notices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    axios.get('/api/notices').then(r => setNotices(r.data)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.title || !form.content) return toast.error('Title and content required');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('attachment', file);
    try {
      const r = await axios.post('/api/notices', fd);
      setNotices(p => [r.data, ...p]);
      setModal(false);
      setForm({ title: '', content: '', category: 'general' });
      setFile(null);
      toast.success('Notice posted!');
    } catch { toast.error('Failed'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this notice?')) return;
    await axios.delete(`/api/notices/${id}`);
    setNotices(p => p.filter(n => n.id !== id));
    toast.success('Deleted');
  };

  const filtered = notices.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || n.category === catFilter;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notice Board</h1>
          <p className="text-sm text-gray-500">{notices.length} notices</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Post Notice
          </button>
        )}
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No notices found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(n => (
            <div key={n.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{n.title}</h3>
                    <span className={`badge capitalize ${CAT_COLORS[n.category] || CAT_COLORS.other}`}>{n.category}</span>
                  </div>
                  <p className={`text-sm text-gray-600 mt-1 ${expanded === n.id ? '' : 'line-clamp-2'}`}>{n.content}</p>
                  {n.content.length > 120 && (
                    <button onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                      className="text-xs text-indigo-600 hover:underline mt-1">
                      {expanded === n.id ? 'Show less' : 'Read more'}
                    </button>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">Posted by {n.admin_name} · {format(parseISO(n.created_at), 'MMM d, yyyy')}</span>
                    {n.attachment && (
                      <a href={n.attachment} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                        <Paperclip className="w-3 h-3" />Attachment
                      </a>
                    )}
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button onClick={() => del(n.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-semibold">Post a Notice</h3>
              <button onClick={() => setModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="label">Title *</label><input className="input" placeholder="Notice title" value={form.title} onChange={set('title')} /></div>
              <div><label className="label">Category</label>
                <select className="input" value={form.category} onChange={set('category')}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div><label className="label">Content *</label><textarea className="input resize-none h-32" placeholder="Notice content..." value={form.content} onChange={set('content')} /></div>
              <div><label className="label">Attachment</label><input type="file" className="input text-sm" onChange={e => setFile(e.target.files[0])} /></div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={save} className="btn-primary flex-1">Post Notice</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
