import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, Tag, Paperclip, X, Save, ChevronLeft, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const COLORS = ['#FEF3C7', '#DBEAFE', '#D1FAE5', '#FCE7F3', '#EDE9FE', '#FEE2E2', '#F0FDF4', '#FFF7ED'];
const CATEGORIES = ['general', 'lecture', 'lab', 'research', 'personal', 'exam-prep'];

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'general', color: '#FEF3C7', tags: [] });
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    axios.get('/api/notes').then(r => setNotes(r.data)).finally(() => setLoading(false));
  }, []);

  const openNew = () => {
    setForm({ title: '', content: '', category: 'general', color: '#FEF3C7', tags: [] });
    setFiles([]);
    setTagInput('');
    setEditing('new');
  };

  const openEdit = (n) => {
    setForm({ title: n.title, content: n.content, category: n.category, color: n.color, tags: n.tags || [] });
    setFiles([]);
    setTagInput('');
    setEditing(n.id);
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    if (!form.tags.includes(tagInput.trim())) setForm(p => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
    setTagInput('');
  };
  const removeTag = (t) => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }));

  const save = async () => {
    if (!form.title) return toast.error('Title required');
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('content', form.content);
    fd.append('category', form.category);
    fd.append('color', form.color);
    form.tags.forEach(t => fd.append('tags', t));
    files.forEach(f => fd.append('attachments', f));
    try {
      let r;
      if (editing === 'new') {
        r = await axios.post('/api/notes', fd);
        setNotes(p => [r.data, ...p]);
      } else {
        r = await axios.put(`/api/notes/${editing}`, fd);
        setNotes(p => p.map(n => n.id === editing ? r.data : n));
      }
      setEditing(null);
      toast.success('Note saved!');
    } catch { toast.error('Failed to save'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this note?')) return;
    await axios.delete(`/api/notes/${id}`);
    setNotes(p => p.filter(n => n.id !== id));
    if (editing === id) setEditing(null);
    toast.success('Deleted');
  };

  const filtered = notes.filter(n => {
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = catFilter === 'all' || n.category === catFilter;
    return matchSearch && matchCat;
  });

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  // Editor view
  if (editing) {
    const currentNote = editing !== 'new' ? notes.find(n => n.id === editing) : null;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{editing === 'new' ? 'New Note' : 'Edit Note'}</h1>
          <div className="flex-1" />
          <button onClick={save} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> Save
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-3">
            <input className="w-full text-2xl font-bold border-none outline-none bg-transparent text-gray-900 placeholder-gray-300"
              placeholder="Note title..." value={form.title} onChange={set('title')} />
            <textarea className="w-full h-96 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 font-mono"
              placeholder="Start writing your notes here..." value={form.content} onChange={set('content')} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                    className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: form.color === c ? '#4F46E5' : '#e5e7eb' }} />
                ))}
              </div>
            </div>

            <div>
              <label className="label">Tags</label>
              <div className="flex gap-2 mb-2">
                <input className="input flex-1 text-sm" placeholder="Add tag..." value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} />
                <button onClick={addTag} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.tags.map(t => (
                  <span key={t} className="badge bg-indigo-100 text-indigo-700 gap-1">
                    #{t}
                    <button onClick={() => removeTag(t)} className="hover:text-indigo-900"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Attachments</label>
              <input type="file" multiple className="input text-sm" onChange={e => setFiles(Array.from(e.target.files))} />
              {files.length > 0 && (
                <div className="mt-2 space-y-1">
                  {files.map((f, i) => <div key={i} className="text-xs text-gray-500 flex items-center gap-1"><Paperclip className="w-3 h-3" />{f.name}</div>)}
                </div>
              )}
              {currentNote?.attachments?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Existing attachments:</div>
                  {currentNote.attachments.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                      <Download className="w-3 h-3" />{a.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
          <p className="text-sm text-gray-500">{notes.length} notes</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search notes, tags..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📝</div>
          <p className="font-medium">No notes yet</p>
          <p className="text-sm mt-1">Click "New Note" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(n => (
            <div key={n.id} className="rounded-2xl p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow relative group"
              style={{ backgroundColor: n.color }} onClick={() => openEdit(n)}>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{n.title}</h3>
              {n.content && <p className="text-sm text-gray-600 line-clamp-4 mb-3">{n.content}</p>}
              {n.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {n.tags.slice(0, 3).map(t => <span key={t} className="text-xs bg-white/60 text-gray-600 px-1.5 py-0.5 rounded-full">#{t}</span>)}
                </div>
              )}
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-gray-400">{format(parseISO(n.updated_at), 'MMM d')}</span>
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  {n.attachments?.length > 0 && <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{n.attachments.length}</span>}
                  <span className="capitalize">{n.category}</span>
                </div>
              </div>
              <button onClick={e => { e.stopPropagation(); del(n.id); }}
                className="absolute top-3 right-3 p-1.5 bg-white/70 rounded-lg text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
