import fs from 'fs';
import path from 'path';
import { supabase } from './supabaseClient';

const DATA_DIR = path.join(process.cwd(), 'data');
const NORMS_FILE = path.join(DATA_DIR, 'norms.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Ensure directories exist for local fallback
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
    evidence_type: string;
    year: number;
    source_ids: string[];
  }[];
  sources: {
    source_id: string;
    type: string;
    title: string;
    year: number | null;
    url: string | null;
    evidentiary_type: string;
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

export async function getNorms(): Promise<Norm[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('norms')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (data) {
        return data as Norm[];
      }
    } catch (err) {
      console.error('Supabase getNorms error, falling back to local files:', err);
    }
  }

  initDB();
  try {
    if (!fs.existsSync(NORMS_FILE)) return [];
    return JSON.parse(fs.readFileSync(NORMS_FILE, 'utf-8'));
  } catch (err) {
    console.error('getNorms error:', err);
    return [];
  }
}

export async function saveNorms(norms: Norm[]): Promise<boolean> {
  if (supabase) {
    try {
      // 1. Delete norms not in the new list to keep database sync'd
      const ids = norms.map(n => n.norm_id);
      if (ids.length > 0) {
        const { error: deleteError } = await supabase
          .from('norms')
          .delete()
          .not('norm_id', 'in', `(${ids.map(id => `'${id.replace(/'/g, "''")}'`).join(',')})`);
        if (deleteError) throw deleteError;
      } else {
        const { error: deleteError } = await supabase
          .from('norms')
          .delete()
          .neq('norm_id', '___non_existent___');
        if (deleteError) throw deleteError;
      }

      // 2. Upsert the new list of norms
      if (norms.length > 0) {
        const { error: upsertError } = await supabase
          .from('norms')
          .upsert(
            norms.map(n => ({
              norm_id: n.norm_id,
              title: n.title,
              domain: n.domain,
              status: n.status,
              contested: n.contested,
              summary: n.summary,
              primary_codification: n.primary_codification,
              state_practice: n.state_practice,
              opinio_juris: n.opinio_juris,
              sources: n.sources
            }))
          );
        if (upsertError) throw upsertError;
      }
      return true;
    } catch (err) {
      console.error('Supabase saveNorms error, falling back to local files:', err);
    }
  }

  initDB();
  try {
    fs.writeFileSync(NORMS_FILE, JSON.stringify(norms, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('saveNorms error:', err);
    return false;
  }
}

export async function getUsers(): Promise<User[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      if (data) {
        return data.map(u => ({
          username: u.username,
          passwordHash: u.password_hash,
          role: u.role as 'admin' | 'moderator'
        }));
      }
    } catch (err) {
      console.error('Supabase getUsers error, falling back to local files:', err);
    }
  }

  initDB();
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (err) {
    console.error('getUsers error:', err);
    return [];
  }
}

export async function saveUsers(users: User[]): Promise<boolean> {
  if (supabase) {
    try {
      // 1. Delete users not in the new list to keep database sync'd
      const usernames = users.map(u => u.username);
      if (usernames.length > 0) {
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .not('username', 'in', `(${usernames.map(u => `'${u.replace(/'/g, "''")}'`).join(',')})`);
        if (deleteError) throw deleteError;
      } else {
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .neq('username', '___non_existent___');
        if (deleteError) throw deleteError;
      }

      // 2. Upsert the new list
      if (users.length > 0) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert(
            users.map(u => ({
              username: u.username,
              password_hash: u.passwordHash,
              role: u.role
            }))
          );
        if (upsertError) throw upsertError;
      }
      return true;
    } catch (err) {
      console.error('Supabase saveUsers error, falling back to local files:', err);
    }
  }

  initDB();
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('saveUsers error:', err);
    return false;
  }
}

export async function getAnalytics(): Promise<Analytics> {
  if (supabase) {
    try {
      // 1. Fetch search logs
      const { data: searchData, error: searchError } = await supabase
        .from('search_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      if (searchError) throw searchError;

      // 2. Fetch view logs
      const { data: viewData, error: viewError } = await supabase
        .from('analytics_views')
        .select('*');
      if (viewError) throw viewError;

      const search_logs: SearchLog[] = (searchData || []).map(row => ({
        query: row.query,
        timestamp: row.timestamp,
        resultsCount: row.results_count
      }));

      const view_logs: Record<string, number> = {};
      (viewData || []).forEach(row => {
        view_logs[row.norm_id] = row.views;
      });

      return { search_logs, view_logs };
    } catch (err) {
      console.error('Supabase getAnalytics error, falling back to local files:', err);
    }
  }

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

export async function saveAnalytics(analytics: Analytics): Promise<boolean> {
  if (supabase) {
    try {
      // 1. Re-sync search logs in the DB
      if (analytics.search_logs.length > 0) {
        // Truncate existing logs
        const { error: deleteError } = await supabase.from('search_logs').delete().neq('id', 0);
        if (deleteError) throw deleteError;

        // Insert fresh search logs list
        const { error: insertError } = await supabase
          .from('search_logs')
          .insert(
            analytics.search_logs.map(log => ({
              query: log.query,
              results_count: log.resultsCount,
              timestamp: log.timestamp
            }))
          );
        if (insertError) throw insertError;
      }

      // 2. Upsert view logs
      const viewEntries = Object.entries(analytics.view_logs);
      if (viewEntries.length > 0) {
        const { error: upsertError } = await supabase
          .from('analytics_views')
          .upsert(
            viewEntries.map(([norm_id, views]) => ({
              norm_id,
              views
            }))
          );
        if (upsertError) throw upsertError;
      }
      return true;
    } catch (err) {
      console.error('Supabase saveAnalytics error, falling back to local files:', err);
    }
  }

  initDB();
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('saveAnalytics error:', err);
    return false;
  }
}
