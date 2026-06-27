import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Calendar, CheckSquare, BookOpen, Bell, FileText, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState({ assignments: [], timetable: [], notices: [], attendance: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/assignments'),
      axios.get('/api/timetable'),
      axios.get('/api/notices'),
      axios.get('/api/attendance/stats'),
    ]).then(([a, t, n, att]) => {
      setData({ assignments: a.data, timetable: t.data, notices: n.data, attendance: att.data });
    }).finally(() => setLoading(false));
  }, []);

  const today = format(new Date(), 'EEEE');
  const todayClasses = data.timetable.filter(c => c.day === today).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const pendingAssignments = data.assignments.filter(a => a.status !== 'completed');
  const overdueAssignments = pendingAssignments.filter(a => isPast(parseISO(a.due_date)));
  const dueToday = pendingAssignments.filter(a => isToday(parseISO(a.due_date)));
  const dueTomorrow = pendingAssignments.filter(a => isTomorrow(parseISO(a.due_date)));

  const avgAttendance = Object.values(data.attendance).length > 0
    ? Math.round(Object.values(data.attendance).reduce((s, v) => s + v.percentage, 0) / Object.values(data.attendance).length)
    : 0;

  const stats = [
    { label: 'Today\'s Classes', value: todayClasses.length, icon: Calendar, color: 'bg-blue-50 text-blue-600', link: '/timetable' },
    { label: 'Pending Tasks', value: pendingAssignments.length, icon: CheckSquare, color: 'bg-amber-50 text-amber-600', link: '/assignments' },
    { label: 'Avg Attendance', value: `${avgAttendance}%`, icon: TrendingUp, color: avgAttendance >= 75 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600', link: '/attendance' },
    { label: 'Overdue', value: overdueAssignments.length, icon: AlertCircle, color: 'bg-red-50 text-red-600', link: '/assignments' },
  ];

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, link }) => (
          <Link to={link} key={label} className="card hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Today's Schedule */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Today's Schedule
            </h2>
            <Link to="/timetable" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {todayClasses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No classes today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayClasses.map(cls => (
                <div key={cls.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: cls.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{cls.subject}</div>
                    <div className="text-xs text-gray-500">{cls.teacher} {cls.room && `• ${cls.room}`}</div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{cls.start_time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-amber-600" /> Upcoming Tasks
            </h2>
            <Link to="/assignments" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {pendingAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingAssignments.slice(0, 5).map(a => {
                const due = parseISO(a.due_date);
                const isOverdue = isPast(due);
                const isDueToday = isToday(due);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : isDueToday ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">{a.title}</div>
                      <div className="text-xs text-gray-500">{a.subject}</div>
                    </div>
                    <div className={`text-xs font-medium ${isOverdue ? 'text-red-600' : isDueToday ? 'text-amber-600' : 'text-gray-500'}`}>
                      {isOverdue ? 'Overdue' : isDueToday ? 'Today' : isTomorrow(due) ? 'Tomorrow' : format(due, 'MMM d')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Latest Notices */}
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" /> Latest Notices
            </h2>
            <Link to="/notices" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {data.notices.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notices yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-3">
              {data.notices.slice(0, 3).map(n => (
                <div key={n.id} className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 line-clamp-1">{n.title}</span>
                    <span className="badge bg-purple-100 text-purple-700 flex-shrink-0">{n.category}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{n.content}</p>
                  <div className="text-xs text-gray-400 mt-2">{format(parseISO(n.created_at), 'MMM d')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
