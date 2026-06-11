const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'lex-customs-premium-session-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// File Paths
const NORMS_FILE = path.join(__dirname, 'data', 'norms.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const ANALYTICS_FILE = path.join(__dirname, 'data', 'analytics.json');

// Database Helpers
function readJsonFile(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return defaultData;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
    return false;
  }
}

// Country metadata dictionary mapping states to regions, trade blocs, authorities, and industry categories.
const COUNTRY_METADATA = {
  "United States": {
    region: "North America",
    trade_bloc: "USMCA",
    authority: "U.S. Customs and Border Protection / Dept of State",
    industry: "Maritime, Defense, Trade, Security"
  },
  "United Kingdom": {
    region: "Europe",
    trade_bloc: "CPTPP",
    authority: "His Majesty's Revenue and Customs / Foreign Office",
    industry: "Maritime, Trade, Security, Human Rights"
  },
  "France": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Direction Générale des Douanes et Droits Indirects",
    industry: "Maritime, Defense, Diplomacy, Human Rights"
  },
  "Germany": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Bundeszollverwaltung (Federal Customs Service)",
    industry: "Trade, Environment, Defense, Human Rights"
  },
  "China": {
    region: "Asia-Pacific",
    trade_bloc: "RCEP",
    authority: "General Administration of Customs (GACC)",
    industry: "Trade, Maritime, Security, Environment"
  },
  "Japan": {
    region: "Asia-Pacific",
    trade_bloc: "CPTPP",
    authority: "Japan Customs",
    industry: "Maritime, Trade, Environment, Security"
  },
  "Australia": {
    region: "Asia-Pacific",
    trade_bloc: "CPTPP",
    authority: "Australian Border Force (ABF)",
    industry: "Maritime, Environment, Trade, Security"
  },
  "Israel": {
    region: "Middle East",
    trade_bloc: "None",
    authority: "Israel Customs Authority / Ministry of Foreign Affairs",
    industry: "Defense, Security, Human Rights, Diplomacy"
  },
  "Switzerland": {
    region: "Europe",
    trade_bloc: "EFTA",
    authority: "Federal Office for Customs and Border Security (FOCBS)",
    industry: "Diplomacy, Human Rights, Trade, Finance"
  },
  "Canada": {
    region: "North America",
    trade_bloc: "USMCA",
    authority: "Canada Border Services Agency (CBSA)",
    industry: "Maritime, Environment, Trade, Defense"
  },
  "Mexico": {
    region: "North America",
    trade_bloc: "USMCA",
    authority: "Agencia Nacional de Aduanas de México (ANAM)",
    industry: "Trade, Environment, Migration, Security"
  },
  "Brazil": {
    region: "Latin America",
    trade_bloc: "Mercosur",
    authority: "Receita Federal (Department of Federal Revenue)",
    industry: "Environment, Trade, Diplomacy, Human Rights"
  },
  "Argentina": {
    region: "Latin America",
    trade_bloc: "Mercosur",
    authority: "Dirección General de Aduanas (DGA)",
    industry: "Trade, Maritime, Human Rights, Diplomacy"
  },
  "South Africa": {
    region: "Africa",
    trade_bloc: "SACU",
    authority: "South African Revenue Service (SARS) - Customs",
    industry: "Diplomacy, Trade, Human Rights, Environment"
  },
  "Nigeria": {
    region: "Africa",
    trade_bloc: "ECOWAS",
    authority: "Nigeria Customs Service (NCS)",
    industry: "Trade, Security, Diplomacy"
  },
  "India": {
    region: "Asia-Pacific",
    trade_bloc: "SAFTA",
    authority: "Central Board of Indirect Taxes and Customs (CBIC)",
    industry: "Trade, Maritime, Environment, Defense, Diplomacy"
  },
  "Singapore": {
    region: "Asia-Pacific",
    trade_bloc: "CPTPP",
    authority: "Singapore Customs",
    industry: "Trade, Maritime, Security, Finance"
  },
  "Belgium": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Administration des Douanes et Accises",
    industry: "Diplomacy, Human Rights, Trade"
  },
  "Netherlands": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Douane (Dutch Customs)",
    industry: "Maritime, Trade, Environment, Human Rights"
  },
  "New Zealand": {
    region: "Asia-Pacific",
    trade_bloc: "CPTPP",
    authority: "New Zealand Customs Service",
    industry: "Environment, Maritime, Trade, Human Rights"
  },
  "Norway": {
    region: "Europe",
    trade_bloc: "EFTA",
    authority: "Norwegian Customs (Tolletaten)",
    industry: "Maritime, Environment, Energy, Diplomacy"
  },
  "Russia": {
    region: "Europe/Asia",
    trade_bloc: "EAEU",
    authority: "Federal Customs Service of Russia",
    industry: "Defense, Trade, Energy, Security"
  },
  "Spain": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Departamento de Aduanas e Impuestos Especiales",
    industry: "Maritime, Trade, Diplomacy, Human Rights"
  },
  "Italy": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Agenzia delle Accise, Dogane e Monopoli (ADM)",
    industry: "Maritime, Trade, Cultural Property, Diplomacy"
  },
  "Greece": {
    region: "Europe",
    trade_bloc: "European Union",
    authority: "Independent Authority for Public Revenue (IAPR) - Customs",
    industry: "Maritime, Trade, Cultural Property"
  },
  "Turkey": {
    region: "Middle East/Europe",
    trade_bloc: "EU Customs Union",
    authority: "Ministry of Trade - Directorate General of Customs",
    industry: "Trade, Defense, Diplomacy, Security"
  },
  "South Korea": {
    region: "Asia-Pacific",
    trade_bloc: "RCEP",
    authority: "Korea Customs Service (KCS)",
    industry: "Trade, Maritime, Security, Defense"
  },
  "Egypt": {
    region: "Middle East/Africa",
    trade_bloc: "GAFTA",
    authority: "Egyptian Customs Authority",
    industry: "Suez Canal, Trade, Diplomacy, Security"
  },
  "Saudi Arabia": {
    region: "Middle East",
    trade_bloc: "GCC",
    authority: "Zakat, Tax and Customs Authority (ZATCA)",
    industry: "Energy, Trade, Security, Diplomacy"
  },
  "United Arab Emirates": {
    region: "Middle East",
    trade_bloc: "GCC",
    authority: "Federal Authority for Identity, Citizenship, Customs and Port Security",
    industry: "Trade, Maritime, Security, Finance"
  },
  "Colombia": {
    region: "Latin America",
    trade_bloc: "Pacific Alliance",
    authority: "Dirección de Impuestos y Aduanas Nacionales (DIAN)",
    industry: "Trade, Environment, Human Rights"
  },
  "Chile": {
    region: "Latin America",
    trade_bloc: "Pacific Alliance",
    authority: "Servicio Nacional de Aduanas",
    industry: "Trade, Maritime, Environment, Human Rights"
  },
  "Peru": {
    region: "Latin America",
    trade_bloc: "Pacific Alliance",
    authority: "Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT)",
    industry: "Trade, Environment, Human Rights"
  },
  "Universal": {
    region: "Global",
    trade_bloc: "None",
    authority: "United Nations / International Court of Justice",
    industry: "General public law, Human Rights, Dispute Resolution"
  },
  "NATO": {
    region: "Transatlantic",
    trade_bloc: "None",
    authority: "North Atlantic Council / Military Committee",
    industry: "Defense, Security, Military Operations"
  }
};

// Auth Middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'moderator')) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Admin session required.' });
  }
}

// ── AUTH ROUTES ────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  const users = readJsonFile(USERS_FILE, []);
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (user && bcrypt.compareSync(password, user.passwordHash)) {
    req.session.user = { username: user.username, role: user.role };
    return res.json({ success: true, user: req.session.user });
  }
  res.status(401).json({ error: 'Invalid username or password.' });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out.' });
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/session', (req, res) => {
  if (req.session && req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// ── USERS CRUD ROUTES ──────────────────────────────────────────────────────────
app.get('/api/users', requireAdmin, (req, res) => {
  const users = readJsonFile(USERS_FILE, []);
  // Hide password hashes from response
  const sanitized = users.map(({ username, role }) => ({ username, role }));
  res.json(sanitized);
});

app.post('/api/users', requireAdmin, (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required.' });
  }
  const users = readJsonFile(USERS_FILE, []);
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return res.status(400).json({ error: 'User already exists.' });
  }
  const newUser = {
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role
  };
  users.push(newUser);
  writeJsonFile(USERS_FILE, users);
  res.json({ success: true, user: { username, role } });
});

app.delete('/api/users/:username', requireAdmin, (req, res) => {
  const usernameToDelete = req.params.username;
  if (usernameToDelete.toLowerCase() === 'admin') {
    return res.status(400).json({ error: 'Cannot delete the master admin account.' });
  }
  let users = readJsonFile(USERS_FILE, []);
  const initialLen = users.length;
  users = users.filter(u => u.username.toLowerCase() !== usernameToDelete.toLowerCase());
  if (users.length === initialLen) {
    return res.status(404).json({ error: 'User not found.' });
  }
  writeJsonFile(USERS_FILE, users);
  res.json({ success: true });
});

// ── NORMS API ROUTES ────────────────────────────────────────────────────────────
app.get('/api/norms', (req, res) => {
  const norms = readJsonFile(NORMS_FILE, []);
  res.json(norms);
});

app.post('/api/norms', requireAdmin, (req, res) => {
  const newNorm = req.body;
  if (!newNorm.norm_id || !newNorm.title || !newNorm.domain) {
    return res.status(400).json({ error: 'Norm ID, Title, and Domain are required.' });
  }
  const norms = readJsonFile(NORMS_FILE, []);
  if (norms.find(n => n.norm_id.toUpperCase() === newNorm.norm_id.toUpperCase())) {
    return res.status(400).json({ error: `Norm with ID ${newNorm.norm_id} already exists.` });
  }
  // Standardize
  newNorm.norm_id = newNorm.norm_id.toUpperCase();
  newNorm.state_practice = newNorm.state_practice || [];
  newNorm.opinio_juris = newNorm.opinio_juris || [];
  newNorm.sources = newNorm.sources || [];
  newNorm.summary = newNorm.summary || '';
  newNorm.contested = !!newNorm.contested;

  norms.push(newNorm);
  writeJsonFile(NORMS_FILE, norms);
  res.status(201).json(newNorm);
});

app.put('/api/norms/:id', requireAdmin, (req, res) => {
  const normId = req.params.id.toUpperCase();
  const updatedNorm = req.body;
  const norms = readJsonFile(NORMS_FILE, []);
  const idx = norms.findIndex(n => n.norm_id.toUpperCase() === normId);
  if (idx === -1) {
    return res.status(404).json({ error: `Norm with ID ${normId} not found.` });
  }
  // Standardize
  updatedNorm.norm_id = normId;
  updatedNorm.state_practice = updatedNorm.state_practice || [];
  updatedNorm.opinio_juris = updatedNorm.opinio_juris || [];
  updatedNorm.sources = updatedNorm.sources || [];
  updatedNorm.summary = updatedNorm.summary || '';
  updatedNorm.contested = !!updatedNorm.contested;

  norms[idx] = updatedNorm;
  writeJsonFile(NORMS_FILE, norms);
  res.json(updatedNorm);
});

app.delete('/api/norms/:id', requireAdmin, (req, res) => {
  const normId = req.params.id.toUpperCase();
  let norms = readJsonFile(NORMS_FILE, []);
  const initialLen = norms.length;
  norms = norms.filter(n => n.norm_id.toUpperCase() !== normId);
  if (norms.length === initialLen) {
    return res.status(404).json({ error: `Norm with ID ${normId} not found.` });
  }
  writeJsonFile(NORMS_FILE, norms);
  res.json({ success: true });
});

// ── COUNTRY PROFILES API ────────────────────────────────────────────────────────
app.get('/api/countries', (req, res) => {
  const norms = readJsonFile(NORMS_FILE, []);
  const countriesMap = {};

  // Dynamically populate countries mentioned in state practices
  norms.forEach(norm => {
    norm.state_practice.forEach(sp => {
      if (sp.states_involved && Array.isArray(sp.states_involved)) {
        sp.states_involved.forEach(stateName => {
          if (!stateName) return;
          if (!countriesMap[stateName]) {
            const meta = COUNTRY_METADATA[stateName] || {
              region: "Global / Other",
              trade_bloc: "None",
              authority: "National Customs / Legal Authority",
              industry: "General Jurisprudence"
            };
            countriesMap[stateName] = {
              name: stateName,
              region: meta.region,
              trade_bloc: meta.trade_bloc,
              authority: meta.authority,
              industry: meta.industry,
              practice_count: 0,
              domain_count: new Set(),
              norms: []
            };
          }
          countriesMap[stateName].practice_count++;
          countriesMap[stateName].domain_count.add(norm.domain);
          if (!countriesMap[stateName].norms.some(n => n.norm_id === norm.norm_id)) {
            countriesMap[stateName].norms.push({
              norm_id: norm.norm_id,
              title: norm.title,
              domain: norm.domain,
              status: norm.status
            });
          }
        });
      }
    });
  });

  // Convert map to array and format domain count
  const list = Object.values(countriesMap).map(c => {
    c.domain_count = c.domain_count.size;
    return c;
  });

  // Sort by name
  list.sort((a, b) => a.name.localeCompare(b.name));
  res.json(list);
});

// ── ANALYTICS API ───────────────────────────────────────────────────────────────
app.get('/api/analytics', (req, res) => {
  const norms = readJsonFile(NORMS_FILE, []);
  const analytics = readJsonFile(ANALYTICS_FILE, { search_logs: [], view_logs: {} });

  // Calculate totals and ratios
  const totalNorms = norms.length;
  const establishedCount = norms.filter(n => n.status === 'established').length;
  const emergingCount = norms.filter(n => n.status === 'emerging').length;
  const contestedCount = norms.filter(n => n.status === 'contested').length;
  const disputedCount = norms.filter(n => n.contested).length;

  const totalSources = norms.reduce((sum, n) => sum + (n.sources ? n.sources.length : 0), 0);
  const totalPractices = norms.reduce((sum, n) => sum + (n.state_practice ? n.state_practice.length : 0), 0);

  // Group by Domain
  const domainDistribution = {};
  norms.forEach(n => {
    domainDistribution[n.domain] = (domainDistribution[n.domain] || 0) + 1;
  });

  // Most Viewed (Top 10)
  const viewsList = Object.entries(analytics.view_logs).map(([id, views]) => {
    const norm = norms.find(n => n.norm_id === id);
    return {
      norm_id: id,
      title: norm ? norm.title : 'Deleted Norm',
      domain: norm ? norm.domain : 'unknown',
      views
    };
  }).sort((a, b) => b.views - a.views).slice(0, 10);

  // Search Statistics (Top Keywords)
  const searchFreq = {};
  analytics.search_logs.forEach(log => {
    if (log.query) {
      const q = log.query.toLowerCase().trim();
      if (q) searchFreq[q] = (searchFreq[q] || 0) + 1;
    }
  });
  const topSearches = Object.entries(searchFreq).map(([keyword, count]) => ({
    keyword,
    count
  })).sort((a, b) => b.count - a.count).slice(0, 15);

  res.json({
    metrics: {
      totalNorms,
      establishedCount,
      emergingCount,
      contestedCount,
      disputedCount,
      totalSources,
      totalPractices
    },
    domainDistribution,
    mostViewed: viewsList,
    topSearches
  });
});

app.post('/api/analytics/search', (req, res) => {
  const { query, resultsCount } = req.body;
  if (!query) return res.status(400).end();

  const analytics = readJsonFile(ANALYTICS_FILE, { search_logs: [], view_logs: {} });
  analytics.search_logs.push({
    query: query.substring(0, 100),
    timestamp: new Date().toISOString(),
    resultsCount: resultsCount || 0
  });

  // Cap search logs to last 1000 items
  if (analytics.search_logs.length > 1000) {
    analytics.search_logs.shift();
  }

  writeJsonFile(ANALYTICS_FILE, analytics);
  res.status(204).end();
});

app.post('/api/analytics/view/:id', (req, res) => {
  const id = req.params.id.toUpperCase();
  const analytics = readJsonFile(ANALYTICS_FILE, { search_logs: [], view_logs: {} });
  
  analytics.view_logs[id] = (analytics.view_logs[id] || 0) + 1;
  writeJsonFile(ANALYTICS_FILE, analytics);
  res.status(204).end();
});

// ── IMPORT / EXPORT DATABASE ────────────────────────────────────────────────────
app.get('/api/data/export', requireAdmin, (req, res) => {
  const norms = readJsonFile(NORMS_FILE, []);
  res.setHeader('Content-disposition', 'attachment; filename=norms_export.json');
  res.setHeader('Content-type', 'application/json');
  res.send(JSON.stringify(norms, null, 2));
});

app.post('/api/data/import', requireAdmin, (req, res) => {
  const importedData = req.body;
  if (!Array.isArray(importedData)) {
    return res.status(400).json({ error: 'Imported data must be an array of norms.' });
  }

  // Validate basic schema items
  for (const item of importedData) {
    if (!item.norm_id || !item.title || !item.domain) {
      return res.status(400).json({ error: 'Each imported norm must have norm_id, title, and domain.' });
    }
  }

  // Overwrite local file
  writeJsonFile(NORMS_FILE, importedData);
  res.json({ success: true, count: importedData.length });
});

// Start Server
app.listen(PORT, () => {
  console.log(`LexCustoms running on port ${PORT}`);
});
