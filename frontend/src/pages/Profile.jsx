import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Save, Camera, Shield, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ name: user?.name||'', phone: user?.phone||'', department: user?.department||'', year: user?.year||'', roll_number: user?.roll_number||'', bio: user?.bio||'', avatar: user?.avatar||'' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const setp = k => e => setProfile(p => ({ ...p, [k]: e.target.value }));

  const saveProfile = async () => {
    setSaving(true);
    try {
      const r = await axios.put('/api/auth/profile', profile);
      updateUser(r.data);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match');
    if (pw.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSaving(true);
    try {
      await axios.put('/api/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">Manage your account details</p>
      </div>

      {/* Avatar card */}
      <div className="card flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-3xl overflow-hidden">
            {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" alt="avatar" /> : user?.name?.[0]?.toUpperCase()}
          </div>
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-gray-900 text-lg">{user?.name}</h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'} capitalize`}>
              <Shield className="w-3 h-3 mr-1" />{user?.role}
            </span>
            {user?.department && <span className="badge bg-gray-100 text-gray-700"><GraduationCap className="w-3 h-3 mr-1" />{user.department}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[['profile', 'Profile Info', User], ['password', 'Change Password', Lock]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === key ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="label">Full Name</label><input className="input" value={profile.name} onChange={setp('name')} /></div>
            <div className="col-span-2"><label className="label">Avatar URL</label><input className="input" placeholder="https://example.com/photo.jpg" value={profile.avatar} onChange={setp('avatar')} /></div>
            <div><label className="label">Phone</label><input className="input" placeholder="+91 9876543210" value={profile.phone} onChange={setp('phone')} /></div>
            <div><label className="label">Department</label><input className="input" placeholder="Computer Science" value={profile.department} onChange={setp('department')} /></div>
            <div><label className="label">Year</label>
              <select className="input" value={profile.year} onChange={setp('year')}>
                <option value="">Select year</option>
                {['1st Year','2nd Year','3rd Year','4th Year'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div><label className="label">Roll Number</label><input className="input" placeholder="CS2024001" value={profile.roll_number} onChange={setp('roll_number')} /></div>
            <div className="col-span-2"><label className="label">Bio</label><textarea className="input resize-none h-24" placeholder="Tell us about yourself..." value={profile.bio} onChange={setp('bio')} /></div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="text-sm text-gray-500 mb-3"><span className="font-medium">Email:</span> {user?.email} (cannot be changed)</div>
            <button onClick={saveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Change Password</h3>
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pw.currentPassword} onChange={e => setPw(p => ({ ...p, currentPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={pw.newPassword} onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} />
            {pw.confirm && pw.newPassword !== pw.confirm && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <button onClick={savePassword} disabled={saving || !pw.currentPassword || !pw.newPassword || pw.newPassword !== pw.confirm}
            className="btn-primary flex items-center gap-2">
            <Lock className="w-4 h-4" />{saving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      )}
    </div>
  );
}
