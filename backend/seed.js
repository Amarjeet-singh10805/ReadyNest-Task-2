/**
 * Seed script — creates demo admin + student accounts with sample data.
 * Run: node --experimental-sqlite backend/seed.js   (Node < 22.10)
 *  or: node backend/seed.js                         (Node >= 22.10)
 */
require('dotenv').config();
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DATA_DIR = (process.env.DATA_DIR && fs.existsSync(process.env.DATA_DIR))
  ? process.env.DATA_DIR
  : path.join(__dirname, 'db');
const DB_PATH = path.join(DATA_DIR, 'campus.db');

async function seed() {
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');

  const run = (sql, p = []) => db.prepare(sql).run(...p);
  const get = (sql, p = []) => db.prepare(sql).get(...p) ?? null;

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'student', avatar TEXT, phone TEXT, department TEXT, year TEXT, roll_number TEXT, bio TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS timetable (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, subject TEXT NOT NULL, teacher TEXT, room TEXT, day TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, color TEXT DEFAULT '#4F46E5', created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, subject TEXT NOT NULL, description TEXT, due_date TEXT NOT NULL, priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'pending', attachment TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS attendance (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, subject TEXT NOT NULL, date TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS notices (id TEXT PRIMARY KEY, admin_id TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, category TEXT DEFAULT 'general', attachment TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, title TEXT NOT NULL, content TEXT, category TEXT DEFAULT 'general', color TEXT DEFAULT '#FEF3C7', tags TEXT, attachments TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')));
  `);

  const hash = await bcrypt.hash('password123', 10);

  let admin = get('SELECT id FROM users WHERE email = ?', ['admin@campus.edu']);
  if (!admin) {
    const id = uuidv4();
    run('INSERT INTO users (id,name,email,password,role,department,bio) VALUES (?,?,?,?,?,?,?)',
      [id, 'Admin User', 'admin@campus.edu', hash, 'admin', 'Administration', 'Campus administrator.']);
    admin = { id };
    console.log('Created admin: admin@campus.edu / password123');
  }

  let student = get('SELECT id FROM users WHERE email = ?', ['student@campus.edu']);
  if (!student) {
    const id = uuidv4();
    run('INSERT INTO users (id,name,email,password,role,department,year,roll_number,phone,bio) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [id, 'Alex Johnson', 'student@campus.edu', hash, 'student', 'Computer Science', '3rd Year', 'CS2024042', '+91 9876543210', 'Passionate CS student.']);
    student = { id };
    console.log('Created student: student@campus.edu / password123');
  }

  const sid = student.id;
  const aid = admin.id;

  const hasClasses = get('SELECT id FROM timetable WHERE user_id = ?', [aid]);
  if (!hasClasses) {
    const classes = [
      ['Data Structures', 'Dr. Priya Sharma', 'CS-101', 'Monday', '09:00', '10:30', '#4F46E5'],
      ['Database Systems', 'Prof. Rahul Gupta', 'CS-203', 'Monday', '11:00', '12:30', '#7C3AED'],
      ['Web Development', 'Ms. Anita Patel', 'CS-Lab1', 'Tuesday', '10:00', '11:30', '#059669'],
      ['Data Structures', 'Dr. Priya Sharma', 'CS-101', 'Tuesday', '14:00', '15:30', '#4F46E5'],
      ['Operating Systems', 'Dr. Vikram Nair', 'CS-301', 'Wednesday', '09:00', '10:30', '#DC2626'],
      ['Database Systems', 'Prof. Rahul Gupta', 'CS-203', 'Wednesday', '11:30', '13:00', '#7C3AED'],
      ['Algorithms', 'Dr. Sunita Rao', 'CS-202', 'Thursday', '09:00', '10:30', '#D97706'],
      ['Web Development', 'Ms. Anita Patel', 'CS-Lab1', 'Thursday', '14:00', '16:00', '#059669'],
      ['Operating Systems', 'Dr. Vikram Nair', 'CS-301', 'Friday', '10:00', '11:30', '#DC2626'],
      ['Algorithms', 'Dr. Sunita Rao', 'CS-202', 'Friday', '12:00', '13:30', '#D97706'],
    ];
    classes.forEach(c => run('INSERT INTO timetable (id,user_id,subject,teacher,room,day,start_time,end_time,color) VALUES (?,?,?,?,?,?,?,?,?)',
      [uuidv4(), aid, ...c]));
    console.log('Added timetable entries');
  }

  const hasAssignments = get('SELECT id FROM assignments WHERE user_id = ?', [sid]);
  if (!hasAssignments) {
    const d = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    const assignments = [
      ['Binary Search Tree Implementation', 'Data Structures', 'Implement BST with insert, delete, search in C++.', d(3), 'high', 'pending'],
      ['SQL Query Optimization Lab', 'Database Systems', 'Write optimized SQL queries for given schema.', d(7), 'medium', 'in-progress'],
      ['React Portfolio Website', 'Web Development', 'Build portfolio using React and Tailwind CSS.', d(14), 'medium', 'pending'],
      ['Process Scheduling Algorithms', 'Operating Systems', 'Simulate FCFS, SJF, and Round Robin.', d(-2), 'high', 'completed'],
      ["Dijkstra's Algorithm Report", 'Algorithms', "Written report on Dijkstra's shortest path algorithm.", d(1), 'high', 'pending'],
    ];
    assignments.forEach(a => run('INSERT INTO assignments (id,user_id,title,subject,description,due_date,priority,status) VALUES (?,?,?,?,?,?,?,?)',
      [uuidv4(), sid, ...a]));
    console.log('Added assignments');
  }

  const hasAttendance = get('SELECT id FROM attendance WHERE user_id = ?', [sid]);
  if (!hasAttendance) {
    const makeRecords = (subject, present, absent, late) => {
      const records = [];
      let offset = -90;
      for (let i = 0; i < present; i++) records.push([subject, new Date(Date.now() + (offset += 2) * 86400000).toISOString().slice(0, 10), 'present']);
      for (let i = 0; i < absent; i++) records.push([subject, new Date(Date.now() + (offset += 2) * 86400000).toISOString().slice(0, 10), 'absent']);
      for (let i = 0; i < late; i++) records.push([subject, new Date(Date.now() + (offset += 2) * 86400000).toISOString().slice(0, 10), 'late']);
      return records;
    };
    const allRecords = [
      ...makeRecords('Data Structures', 18, 3, 1),
      ...makeRecords('Database Systems', 15, 5, 2),
      ...makeRecords('Web Development', 20, 1, 0),
      ...makeRecords('Operating Systems', 12, 7, 1),
      ...makeRecords('Algorithms', 16, 4, 2),
    ];
    allRecords.forEach(([subject, date, status]) => run('INSERT INTO attendance (id,user_id,subject,date,status) VALUES (?,?,?,?,?)',
      [uuidv4(), sid, subject, date, status]));
    console.log('Added attendance records');
  }

  const hasNotices = get('SELECT id FROM notices WHERE admin_id = ?', [aid]);
  if (!hasNotices) {
    const notices = [
      ['End Semester Examination Schedule Released', 'The end semester examination schedule for all departments has been released. Examinations begin from next Monday.', 'exam'],
      ['Annual Tech Fest — TechVision 2024', 'TechVision 2024 is scheduled for this weekend. Events include hackathon, robotics competition, and coding contests.', 'event'],
      ['Library Extended Hours During Exam Season', 'The central library will remain open 24/7 during the examination period.', 'academic'],
    ];
    notices.forEach(([title, content, category]) => run('INSERT INTO notices (id,admin_id,title,content,category) VALUES (?,?,?,?,?)',
      [uuidv4(), aid, title, content, category]));
    console.log('Added notices');
  }

  const hasNotes = get('SELECT id FROM notes WHERE user_id = ?', [sid]);
  if (!hasNotes) {
    const notes = [
      ['BST Time Complexities', 'Insert: O(h) avg O(log n)\nSearch: O(h)\nDelete: O(h)\nInorder traversal: O(n)', 'lecture', '#DBEAFE', '["DSA","trees"]'],
      ['SQL Important Queries', 'Window Functions, CTEs, JOINs.\nSELECT name, RANK() OVER (PARTITION BY dept ORDER BY salary DESC) FROM employees;', 'lecture', '#D1FAE5', '["SQL","database"]'],
      ['React Hooks Cheatsheet', 'useState, useEffect, useContext, useRef, useMemo, useCallback, useReducer', 'lecture', '#EDE9FE', '["react","hooks"]'],
    ];
    notes.forEach(([title, content, category, color, tags]) => run('INSERT INTO notes (id,user_id,title,content,category,color,tags,attachments) VALUES (?,?,?,?,?,?,?,?)',
      [uuidv4(), sid, title, content, category, color, tags, '[]']));
    console.log('Added notes');
  }

  db.close();
  console.log('\n--- Seed complete ---');
  console.log('Admin:   admin@campus.edu   / password123');
  console.log('Student: student@campus.edu / password123');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
