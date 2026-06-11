import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const NORMS_FILE = path.join(DATA_DIR, 'norms.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Ensure directories and files exist
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export interface Norm {
  norm_id: string;
  title: string;
  domain: string;
  status: 'established' | 'emerging' | 'contested';
  contested: boolean;
  summary: string;
  primary_codification: string;
  state_practice: {
    practice_id: string;
    description: string;
    states_involved: string[];
    year: number;
    source_ids: string[];
  }[];
  opinio_juris: {
    oj_id: string;
    description: string;
    evidence_type: 'un_resolution' | 'treaty_preamble' | 'national_legislation' | 'judicial_statement' | 'official_statement' | 'military_manual';
    year: number;
    source_ids: string[];
  }[];
  sources: {
    source_id: string;
    type: 'icj_judgment' | 'icj_advisory' | 'icrc_rule' | 'un_resolution' | 'treaty' | 'national_legislation' | 'arbitral_award' | 'scholarly_article' | 'military_manual' | 'national_court';
    title: string;
    year: number | null;
    url: string | null;
    evidentiary_type: 'practice' | 'juris' | 'both';
    notes?: string;
  }[];
}

export interface User {
  username: string;
  passwordHash: string;
  role: 'admin' | 'moderator';
}

export interface SearchLog {
  query: string;
  timestamp: string;
  resultsCount: number;
}

export interface Analytics {
  search_logs: SearchLog[];
  view_logs: Record<string, number>;
}

export function getNorms(): Norm[] {
  initDB();
  try {
    if (!fs.existsSync(NORMS_FILE)) return [];
    return JSON.parse(fs.readFileSync(NORMS_FILE, 'utf-8'));
  } catch (err) {
    console.error('getNorms error:', err);
    return [];
  }
}

export function saveNorms(norms: Norm[]): boolean {
  initDB();
  try {
    fs.writeFileSync(NORMS_FILE, JSON.stringify(norms, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('saveNorms error:', err);
    return false;
  }
}

export function getUsers(): User[] {
  initDB();
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (err) {
    console.error('getUsers error:', err);
    return [];
  }
}

export function saveUsers(users: User[]): boolean {
  initDB();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('saveUsers error:', err);
    return false;
  }
}

export function getAnalytics(): Analytics {
  initDB();
  try {
    if (!fs.existsSync(ANALYTICS_FILE)) {
      return { search_logs: [], view_logs: {} };
    }
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
  } catch (err) {
    console.error('getAnalytics error:', err);
    return { search_logs: [], view_logs: {} };
  }
}

export function saveAnalytics(analytics: Analytics): boolean {
  initDB();
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('saveAnalytics error:', err);
    return false;
  }
}
