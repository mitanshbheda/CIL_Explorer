const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually to retrieve credentials
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        process.env[key] = val;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (
  !supabaseUrl || 
  !supabaseServiceKey || 
  supabaseUrl.includes('your-supabase') || 
  supabaseServiceKey.includes('your-supabase')
) {
  console.error('Error: Please configure your actual NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local before running the seeder script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function runMigration() {
  console.log('Connecting to Supabase at:', supabaseUrl);

  const DATA_DIR = path.join(__dirname, '..', 'data');
  const NORMS_FILE = path.join(DATA_DIR, 'norms.json');
  const USERS_FILE = path.join(DATA_DIR, 'users.json');

  // 1. Seed users table
  if (fs.existsSync(USERS_FILE)) {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    console.log(`Found users.json. Seeding ${users.length} user accounts...`);
    if (users.length > 0) {
      const dbUsers = users.map(u => ({
        username: u.username,
        password_hash: u.passwordHash,
        role: u.role
      }));
      const { error } = await supabase.from('users').upsert(dbUsers);
      if (error) {
        console.error('Error seeding users:', error);
      } else {
        console.log('Users seeded successfully!');
      }
    }
  } else {
    console.log('No users.json file found to seed.');
  }

  // 2. Seed norms table
  if (fs.existsSync(NORMS_FILE)) {
    const norms = JSON.parse(fs.readFileSync(NORMS_FILE, 'utf-8'));
    console.log(`Found norms.json. Seeding ${norms.length} customary law records...`);
    if (norms.length > 0) {
      const dbNorms = norms.map(n => ({
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
      }));
      const { error } = await supabase.from('norms').upsert(dbNorms);
      if (error) {
        console.error('Error seeding norms:', error);
      } else {
        console.log('Norms seeded successfully!');
      }
    }
  } else {
    console.log('No norms.json file found to seed.');
  }

  console.log('Migration completed successfully!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
