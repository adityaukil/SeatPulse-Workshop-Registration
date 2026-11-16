import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'workshop_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory data store with atomic persistence
let state = {
  workshops: [],
  registrations: [],
  activity_logs: [],
  email_logs: [],
  smtp_settings: null,
  counters: {
    workshops: 0,
    registrations: 0,
    activity_logs: 0,
    email_logs: 0
  }
};

function saveToFile() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist database state:', err);
  }
}

function loadFromFile() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      state = JSON.parse(content);
      if (!state.smtp_settings) state.smtp_settings = null;
      return true;
    }
  } catch (err) {
    console.error('Failed to load database file, will seed new data:', err);
  }
  return false;
}

export function seedDatabase() {
  console.log('🌱 Seeding initial workshop demo data...');
  
  const currentSmtp = state.smtp_settings;

  state = {
    workshops: [
      {
        id: 1,
        title: 'Mastering Generative AI & Autonomous Agents',
        description: 'Deep dive into building real-world multi-agent systems, LLM memory architectures, function calling, and self-improving prompt loops with hands-on coding labs.',
        instructor: 'Dr. Elena Rostova',
        instructor_role: 'Principal AI Research Scientist @ DeepCognition',
        instructor_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        category: 'Artificial Intelligence',
        date: 'Oct 24, 2026',
        time: '10:00 AM - 1:00 PM EST',
        location: 'Virtual Auditorium Alpha (Zoom)',
        max_seats: 30,
        tags: ['AI Agents', 'LLMs', 'Python', 'LangChain'],
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 2,
        title: 'Next.js 15 & React 19 Full-Stack Architecture Masterclass',
        description: 'Master Server Components, Server Actions, streaming SSR, dynamic caching, and end-to-end database security patterns for enterprise web apps.',
        instructor: 'Marcus Vance',
        instructor_role: 'Lead Frontend Architect @ Vercel Alumni',
        instructor_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        category: 'Web Development',
        date: 'Oct 26, 2026',
        time: '2:00 PM - 5:30 PM EST',
        location: 'San Francisco Tech Hub - Room 402',
        max_seats: 5,
        tags: ['React 19', 'Next.js', 'TypeScript', 'Tailwind'],
        created_at: new Date(Date.now() - 86400000 * 4).toISOString()
      },
      {
        id: 3,
        title: 'Cloud-Native Kubernetes & Microservices at Scale',
        description: 'Practical hands-on workshop covering Docker containerization, Helm charts, Kubernetes auto-scaling, Istio service mesh, and observability pipelines.',
        instructor: 'Siddharth Nair',
        instructor_role: 'VP of Infrastructure @ CloudScale Labs',
        instructor_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        category: 'Cloud & DevOps',
        date: 'Oct 29, 2026',
        time: '11:00 AM - 3:00 PM EST',
        location: 'Virtual Lab Beta (Live Cloud Sandboxes)',
        max_seats: 15,
        tags: ['Kubernetes', 'Docker', 'DevOps', 'Microservices'],
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ],
    registrations: [],
    activity_logs: [],
    email_logs: [],
    smtp_settings: currentSmtp,
    counters: {
      workshops: 3,
      registrations: 0,
      activity_logs: 0,
      email_logs: 0
    }
  };

  // Pre-seed Workshop 1 (26 registered out of 30 -> 4 seats left)
  const sampleNamesW1 = [
    'Alice Walker', 'Bob Chen', 'Carlos Gomez', 'Diana Prince', 'Ethan Hunt',
    'Fiona Gallagher', 'George Miller', 'Hannah Abbott', 'Ian Malcolm', 'Julia Roberts',
    'Kevin Flynn', 'Laura Croft', 'Miles Morales', 'Nina Simone', 'Oscar Isaac',
    'Peter Parker', 'Quinn Fabray', 'Rachel Green', 'Steve Rogers', 'Tony Stark',
    'Uma Thurman', 'Victor Creed', 'Wanda Maximoff', 'Xander Cage', 'Yara Shahidi', 'Zack Snyder'
  ];

  sampleNamesW1.forEach((name, idx) => {
    state.counters.registrations++;
    const regId = state.counters.registrations;
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const token = crypto.randomUUID();
    const time = new Date(Date.now() - (30 - idx) * 3600000).toISOString();
    
    state.registrations.push({
      id: regId,
      workshop_id: 1,
      name,
      email,
      status: 'REGISTERED',
      cancel_token: token,
      notes: 'Looking forward to building agents!',
      registered_at: time,
      cancelled_at: null
    });

    state.counters.activity_logs++;
    state.activity_logs.push({
      id: state.counters.activity_logs,
      workshop_id: 1,
      action_type: 'REGISTERED',
      user_name: name,
      user_email: email,
      message: `${name} registered for Mastering Generative AI & Autonomous Agents`,
      created_at: time
    });
  });

  // Pre-seed Workshop 2 (5 registered out of 5 -> FULL, plus 2 on WAITLIST)
  const sampleW2Registered = [
    'Bruce Wayne', 'Clark Kent', 'Barry Allen', 'Hal Jordan', 'Arthur Curry'
  ];
  sampleW2Registered.forEach((name, idx) => {
    state.counters.registrations++;
    const regId = state.counters.registrations;
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const token = crypto.randomUUID();
    const time = new Date(Date.now() - (20 - idx) * 3600000).toISOString();
    
    state.registrations.push({
      id: regId,
      workshop_id: 2,
      name,
      email,
      status: 'REGISTERED',
      cancel_token: token,
      notes: 'Excited for React 19 features',
      registered_at: time,
      cancelled_at: null
    });

    state.counters.activity_logs++;
    state.activity_logs.push({
      id: state.counters.activity_logs,
      workshop_id: 2,
      action_type: 'REGISTERED',
      user_name: name,
      user_email: email,
      message: `${name} registered for Next.js 15 & React 19 Masterclass`,
      created_at: time
    });
  });

  const sampleW2Waitlist = ['Oliver Queen', 'Dinah Lance'];
  sampleW2Waitlist.forEach((name, idx) => {
    state.counters.registrations++;
    const regId = state.counters.registrations;
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const token = crypto.randomUUID();
    const time = new Date(Date.now() - (5 - idx) * 3600000).toISOString();
    
    state.registrations.push({
      id: regId,
      workshop_id: 2,
      name,
      email,
      status: 'WAITLIST',
      cancel_token: token,
      notes: 'Put me on waitlist please',
      registered_at: time,
      cancelled_at: null
    });

    state.counters.activity_logs++;
    state.activity_logs.push({
      id: state.counters.activity_logs,
      workshop_id: 2,
      action_type: 'WAITLIST_JOINED',
      user_name: name,
      user_email: email,
      message: `${name} joined the waitlist for Next.js 15 & React 19 Masterclass (Position #${idx + 1})`,
      created_at: time
    });
  });

  // Pre-seed Workshop 3 (8 registered out of 15 -> 7 seats left)
  const sampleW3 = [
    'Natasha Romanoff', 'Clint Barton', 'Sam Wilson', 'Bucky Barnes',
    'Scott Lang', 'Hope van Dyne', 'Carol Danvers', 'Nick Fury'
  ];
  sampleW3.forEach((name, idx) => {
    state.counters.registrations++;
    const regId = state.counters.registrations;
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    const token = crypto.randomUUID();
    const time = new Date(Date.now() - (15 - idx) * 3600000).toISOString();
    
    state.registrations.push({
      id: regId,
      workshop_id: 3,
      name,
      email,
      status: 'REGISTERED',
      cancel_token: token,
      notes: 'Setting up microservices cluster',
      registered_at: time,
      cancelled_at: null
    });

    state.counters.activity_logs++;
    state.activity_logs.push({
      id: state.counters.activity_logs,
      workshop_id: 3,
      action_type: 'REGISTERED',
      user_name: name,
      user_email: email,
      message: `${name} registered for Cloud-Native Kubernetes & Microservices`,
      created_at: time
    });
  });

  saveToFile();
  console.log('✅ Sample demo data successfully initialized and persisted.');
}

export function initDatabase() {
  const loaded = loadFromFile();
  if (!loaded || !state.workshops || state.workshops.length === 0) {
    seedDatabase();
  } else {
    console.log(`📦 Loaded ${state.workshops.length} workshops and ${state.registrations.length} registrations from disk.`);
  }
}

// Database helper object with clean query interfaces
export const db = {
  getState: () => state,
  save: saveToFile,

  // SMTP Settings
  getSmtpSettings: () => state.smtp_settings,
  saveSmtpSettings: (settings) => {
    state.smtp_settings = settings;
    saveToFile();
    return state.smtp_settings;
  },

  // Workshops
  getWorkshops: () => {
    return state.workshops.map(w => {
      const regCount = state.registrations.filter(r => Number(r.workshop_id) === Number(w.id) && r.status === 'REGISTERED').length;
      const waitCount = state.registrations.filter(r => Number(r.workshop_id) === Number(w.id) && r.status === 'WAITLIST').length;
      return {
        ...w,
        registered_count: regCount,
        waitlist_count: waitCount,
        seats_left: Math.max(0, w.max_seats - regCount),
        is_full: regCount >= w.max_seats
      };
    });
  },

  getWorkshopById: (id) => {
    const numId = Number(id);
    const w = state.workshops.find(item => Number(item.id) === numId);
    if (!w) return null;
    const regCount = state.registrations.filter(r => Number(r.workshop_id) === numId && r.status === 'REGISTERED').length;
    const waitCount = state.registrations.filter(r => Number(r.workshop_id) === numId && r.status === 'WAITLIST').length;
    return {
      ...w,
      registered_count: regCount,
      waitlist_count: waitCount,
      seats_left: Math.max(0, w.max_seats - regCount),
      is_full: regCount >= w.max_seats
    };
  },

  createWorkshop: (workshopData) => {
    state.counters.workshops++;
    const newWorkshop = {
      id: state.counters.workshops,
      title: workshopData.title,
      description: workshopData.description,
      instructor: workshopData.instructor,
      instructor_role: workshopData.instructor_role || 'Instructor',
      instructor_avatar: workshopData.instructor_avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      category: workshopData.category || 'General',
      date: workshopData.date,
      time: workshopData.time,
      location: workshopData.location,
      max_seats: Number(workshopData.max_seats),
      tags: Array.isArray(workshopData.tags) ? workshopData.tags : ['Workshop'],
      created_at: new Date().toISOString()
    };
    state.workshops.push(newWorkshop);
    saveToFile();
    return db.getWorkshopById(newWorkshop.id);
  },

  // Registrations & Concurrency
  getRegistrationsByWorkshop: (workshopId) => {
    const numId = Number(workshopId);
    return state.registrations.filter(r => Number(r.workshop_id) === numId);
  },

  findActiveRegistration: (workshopId, email) => {
    const numId = Number(workshopId);
    const normalizedEmail = email.trim().toLowerCase();
    return state.registrations.find(
      r => Number(r.workshop_id) === numId && 
           r.email.toLowerCase() === normalizedEmail && 
           (r.status === 'REGISTERED' || r.status === 'WAITLIST')
    );
  },

  findRegistrationByToken: (token) => {
    if (!token) return null;
    const cleanToken = token.trim();
    return state.registrations.find(r => r.cancel_token === cleanToken && (r.status === 'REGISTERED' || r.status === 'WAITLIST'));
  },

  getRegistrationsByEmail: (email) => {
    if (!email) return [];
    const normalizedEmail = email.trim().toLowerCase();
    return state.registrations
      .filter(r => r.email.toLowerCase() === normalizedEmail && (r.status === 'REGISTERED' || r.status === 'WAITLIST'))
      .map(r => {
        const w = state.workshops.find(ws => Number(ws.id) === Number(r.workshop_id));
        return {
          registration_id: r.id,
          name: r.name,
          email: r.email,
          status: r.status,
          cancel_token: r.cancel_token,
          registered_at: r.registered_at,
          workshop_id: r.workshop_id,
          workshop_title: w ? w.title : 'Workshop',
          description: w ? w.description : '',
          date: w ? w.date : '',
          time: w ? w.time : '',
          location: w ? w.location : '',
          instructor: w ? w.instructor : '',
          max_seats: w ? w.max_seats : 30
        };
      });
  },

  addRegistration: ({ workshop_id, name, email, status, cancel_token, notes }) => {
    state.counters.registrations++;
    const newReg = {
      id: state.counters.registrations,
      workshop_id: Number(workshop_id),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      status,
      cancel_token,
      notes: notes ? notes.trim() : null,
      registered_at: new Date().toISOString(),
      cancelled_at: null
    };
    state.registrations.push(newReg);
    saveToFile();
    return newReg;
  },

  cancelRegistration: (registrationId) => {
    const reg = state.registrations.find(r => r.id === Number(registrationId));
    if (reg) {
      reg.status = 'CANCELLED';
      reg.cancelled_at = new Date().toISOString();
      saveToFile();
    }
    return reg;
  },

  promoteNextInWaitlist: (workshopId) => {
    const numId = Number(workshopId);
    const waitlisted = state.registrations
      .filter(r => Number(r.workshop_id) === numId && r.status === 'WAITLIST')
      .sort((a, b) => new Date(a.registered_at) - new Date(b.registered_at));

    if (waitlisted.length > 0) {
      const promoted = waitlisted[0];
      promoted.status = 'REGISTERED';
      saveToFile();
      return promoted;
    }
    return null;
  },

  // Activity logs
  addActivity: ({ workshop_id, action_type, user_name, user_email, message }) => {
    state.counters.activity_logs++;
    const act = {
      id: state.counters.activity_logs,
      workshop_id: workshop_id ? Number(workshop_id) : null,
      action_type,
      user_name: user_name || null,
      user_email: user_email || null,
      message,
      created_at: new Date().toISOString()
    };
    state.activity_logs.unshift(act); // newest first
    if (state.activity_logs.length > 200) {
      state.activity_logs.pop();
    }
    saveToFile();
    return act;
  },

  getActivities: (limit = 50) => {
    return state.activity_logs.slice(0, limit).map(act => {
      const w = act.workshop_id ? state.workshops.find(ws => Number(ws.id) === Number(act.workshop_id)) : null;
      return {
        ...act,
        workshop_title: w ? w.title : null
      };
    });
  },

  // Email logs with preview URLs and delivery status
  addEmailLog: ({ to_email, to_name, subject, preview, content_html, type, workshop_title, delivery_status, preview_url, error_message }) => {
    state.counters.email_logs++;
    const emailRec = {
      id: state.counters.email_logs,
      to_email,
      to_name,
      subject,
      preview,
      content_html,
      type,
      workshop_title: workshop_title || '',
      delivery_status: delivery_status || 'DELIVERED',
      preview_url: preview_url || null,
      error_message: error_message || null,
      sent_at: new Date().toISOString()
    };
    state.email_logs.unshift(emailRec);
    if (state.email_logs.length > 100) {
      state.email_logs.pop();
    }
    saveToFile();
    return emailRec;
  },

  getEmailLogs: (limit = 50) => {
    return state.email_logs.slice(0, limit);
  },

  // Stats
  getStats: () => {
    const totalWorkshops = state.workshops.length;
    const totalSeats = state.workshops.reduce((acc, w) => acc + (w.max_seats || 0), 0);
    const registeredCount = state.registrations.filter(r => r.status === 'REGISTERED').length;
    const waitlistCount = state.registrations.filter(r => r.status === 'WAITLIST').length;
    const cancelledCount = state.registrations.filter(r => r.status === 'CANCELLED').length;
    const emailsCount = state.email_logs.length;

    return {
      workshopsCount: totalWorkshops,
      totalSeats,
      registeredCount,
      waitlistCount,
      cancelledCount,
      emailsCount,
      overallOccupancyPercentage: totalSeats > 0 ? Math.round((registeredCount / totalSeats) * 100) : 0
    };
  }
};
