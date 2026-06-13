"use client";

import React, { useState, useEffect, useRef } from 'react';

// Types representing schemas
interface Norm {
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

interface CountryProfile {
  name: string;
  region: string;
  trade_bloc: string;
  authority: string;
  industry: string;
  practice_count: number;
  domain_count: number;
  norms: {
    norm_id: string;
    title: string;
    domain: string;
    status: string;
  }[];
}

interface User {
  username: string;
  role: 'admin' | 'moderator';
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Constant Mappings
const DOMAIN_LABELS: Record<string, string> = {
  armed_conflict: "Laws of Armed Conflict / IHL",
  human_rights: "International Human Rights",
  state_responsibility: "State Responsibility",
  diplomatic_consular: "Diplomatic & Consular Relations",
  law_of_the_sea: "Law of the Sea",
  environment: "International Environmental Law",
  use_of_force: "Use of Force / Jus ad Bellum",
  jurisdiction_immunity: "Jurisdiction & Immunity"
};

const DOMAIN_ORDER = [
  "armed_conflict",
  "human_rights",
  "state_responsibility",
  "diplomatic_consular",
  "law_of_the_sea",
  "environment",
  "use_of_force",
  "jurisdiction_immunity"
];

const SRC_TYPE_LABELS: Record<string, string> = {
  icj_judgment: "ICJ Judgment",
  icj_advisory: "ICJ Advisory Opinion",
  icrc_rule: "ICRC Customary Rule",
  un_resolution: "UN Resolution",
  treaty: "Treaty / Convention",
  national_legislation: "National Legislation",
  arbitral_award: "Arbitral Award",
  scholarly_article: "Scholarly Article",
  military_manual: "Military Manual",
  national_court: "National Court Decision"
};

const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "United States": { lat: 37.0902, lng: -95.7129 },
  "United Kingdom": { lat: 55.3781, lng: -3.4360 },
  "France": { lat: 46.2276, lng: 2.2137 },
  "Germany": { lat: 51.1657, lng: 10.4515 },
  "China": { lat: 35.8617, lng: 104.1954 },
  "Japan": { lat: 36.2048, lng: 138.2529 },
  "Australia": { lat: -25.2744, lng: 133.7751 },
  "Israel": { lat: 31.0461, lng: 34.8516 },
  "Switzerland": { lat: 46.8182, lng: 8.2275 },
  "Canada": { lat: 56.1304, lng: -106.3468 },
  "Mexico": { lat: 23.6345, lng: -102.5528 },
  "Brazil": { lat: -14.2350, lng: -51.9253 },
  "Argentina": { lat: -38.4161, lng: -63.6167 },
  "South Africa": { lat: -30.5595, lng: 22.9375 },
  "Nigeria": { lat: 9.0820, lng: 8.6753 },
  "India": { lat: 20.5937, lng: 78.9629 },
  "Singapore": { lat: 1.3521, lng: 103.8198 },
  "Belgium": { lat: 50.5039, lng: 4.4699 },
  "Netherlands": { lat: 52.1326, lng: 5.2913 },
  "New Zealand": { lat: -40.9006, lng: 174.8860 },
  "Norway": { lat: 60.4720, lng: 8.4689 },
  "Russia": { lat: 61.5240, lng: 105.3188 },
  "Spain": { lat: 40.4637, lng: -3.7492 },
  "Italy": { lat: 41.8719, lng: 12.5674 },
  "Greece": { lat: 39.0742, lng: 21.8243 },
  "Turkey": { lat: 38.9637, lng: 35.2433 },
  "South Korea": { lat: 35.9078, lng: 127.7669 },
  "Egypt": { lat: 26.8206, lng: 30.8025 },
  "Saudi Arabia": { lat: 23.8859, lng: 45.0792 },
  "United Arab Emirates": { lat: 23.4241, lng: 53.8478 },
  "Colombia": { lat: 4.5709, lng: -74.2973 },
  "Chile": { lat: -35.6751, lng: -71.5430 },
  "Peru": { lat: -9.1900, lng: -75.0152 },
  "NATO": { lat: 50.8503, lng: 4.3517 },
  "Universal": { lat: 20.0, lng: 0.0 }
};

export default function Home() {
  // Navigation & Views
  const [activeView, setActiveView] = useState<'explorer' | 'country-profiles' | 'analytics' | 'admin'>('explorer');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Data Cache
  const [norms, setNorms] = useState<Norm[]>([]);
  const [countries, setCountries] = useState<CountryProfile[]>([]);
  const [filteredNorms, setFilteredNorms] = useState<Norm[]>([]);
  const [selectedNormId, setSelectedNormId] = useState<string | null>(null);
  const [selectedCountryName, setSelectedCountryName] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterTradeBloc, setFilterTradeBloc] = useState('');
  
  // Auth & Admin states
  const [adminSession, setAdminSession] = useState<{ loggedIn: boolean; user?: User }>({ loggedIn: false });
  const [adminTab, setAdminTab] = useState<'editor' | 'users' | 'import-export'>('editor');
  const [editingNorm, setEditingNorm] = useState<Norm | null>(null);
  const [isEditingNew, setIsEditingNew] = useState(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isDatabaseEmpty, setIsDatabaseEmpty] = useState<boolean | null>(null);
  const [origin, setOrigin] = useState('http://localhost:3000');
  
  // UI states
  const [activeDocTab, setActiveDocTab] = useState<'summary' | 'practice' | 'juris' | 'sources' | 'timeline' | 'map'>('summary');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const countryMapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const countryMapInstanceRef = useRef<any>(null);

  // Load Initial Cache
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }

    // Theme loader
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      document.documentElement.className = 'light';
    }

    loadData();
    checkSession();
    loadUsersListStatus();
  }, []);

  const loadData = () => {
    fetch('/api/norms')
      .then(res => res.json())
      .then(data => {
        setNorms(data);
      })
      .catch(() => addToast('Failed to load regulations', 'error'));

    fetch('/api/countries')
      .then(res => res.json())
      .then(data => setCountries(data))
      .catch(() => addToast('Failed to load countries database', 'error'));
  };

  const checkSession = () => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setAdminSession(data);
        if (data.loggedIn) {
          loadAdminData();
        }
      });
  };

  const loadAdminData = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsersList(data);
        setIsDatabaseEmpty(data.length === 0);
      })
      .catch(() => {});
  };

  const loadUsersListStatus = () => {
    fetch('/api/users')
      .then(res => {
        if (res.status === 401) {
          setIsDatabaseEmpty(false);
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (data) {
          setUsersList(data);
          setIsDatabaseEmpty(data.length === 0);
        }
      })
      .catch(() => {});
  };

  // Toast alert trigger
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // Reset views & filters to landing page
  const handleResetToLanding = () => {
    setActiveView('explorer');
    setSelectedNormId(null);
    setSelectedCountryName(null);
    setSearchQuery('');
    setFilterDomain('');
    setFilterStatus('');
    setFilterRegion('');
    setFilterTradeBloc('');
  };

  // Theme Toggler
  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.className = nextTheme;
  };

  // Search indexing and multi-filter logic
  useEffect(() => {
    let result = norms.map(norm => {
      let score = 0;
      const q = searchQuery.toLowerCase().trim();
      
      if (q) {
        const idMatch = norm.norm_id.toLowerCase().includes(q);
        const titleMatch = norm.title.toLowerCase().includes(q);
        const summaryMatch = (norm.summary || '').toLowerCase().includes(q);
        const codifMatch = (norm.primary_codification || '').toLowerCase().includes(q);

        if (norm.norm_id.toLowerCase() === q) score += 100;
        else if (idMatch) score += 40;

        if (norm.title.toLowerCase() === q) score += 80;
        else if (titleMatch) score += 30;

        if (codifMatch) score += 20;
        if (summaryMatch) score += 15;

        norm.state_practice.forEach(sp => {
          if (sp.description.toLowerCase().includes(q)) score += 5;
          sp.states_involved.forEach(st => {
            if (st.toLowerCase().includes(q)) score += 8;
          });
        });

        norm.opinio_juris.forEach(oj => {
          if (oj.description.toLowerCase().includes(q)) score += 5;
        });

        norm.sources.forEach(src => {
          if (src.title.toLowerCase().includes(q)) score += 3;
        });
      }
      return { ...norm, score };
    });

    // Filtering constraints
    result = result.filter(norm => {
      if (searchQuery && norm.score === 0) return false;
      if (filterDomain && norm.domain !== filterDomain) return false;
      if (filterStatus && norm.status !== filterStatus) return false;

      // Region & Trade Bloc checks derived from participating states
      if (filterRegion || filterTradeBloc) {
        let matched = false;
        norm.state_practice.forEach(sp => {
          sp.states_involved.forEach(state => {
            const matchMeta = countries.find(c => c.name === state);
            if (matchMeta) {
              const regionOk = !filterRegion || matchMeta.region === filterRegion;
              const blocOk = !filterTradeBloc || matchMeta.trade_bloc === filterTradeBloc;
              if (regionOk && blocOk) matched = true;
            }
          });
        });
        if (!matched) return false;
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (searchQuery) return b.score - a.score;
      return a.norm_id.localeCompare(b.norm_id);
    });

    setFilteredNorms(result);
  }, [norms, countries, searchQuery, filterDomain, filterStatus, filterRegion, filterTradeBloc]);

  // Debounced search intelligence query logger
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length <= 2) return;
    const timeout = setTimeout(() => {
      fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, resultsCount: filteredNorms.length })
      }).catch(err => console.error(err));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [searchQuery, filteredNorms.length]);

  // Lazy leaflet map renderer for Law Explorer
  useEffect(() => {
    if (activeDocTab !== 'map' || !selectedNormId) return;

    const norm = norms.find(n => n.norm_id === selectedNormId);
    if (!norm) return;

    // Timeout allows DOM wrapper layout adjustments before Leaflet computes bounds
    const timeout = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const L = (window as any).L;
      if (!L || !mapContainerRef.current) return;

      const markers: any[] = [];
      norm.state_practice.forEach(sp => {
        sp.states_involved.forEach(state => {
          const coords = COUNTRY_COORDINATES[state];
          if (coords) {
            markers.push({ name: state, lat: coords.lat, lng: coords.lng, desc: sp.description });
          }
        });
      });

      const hasMarkers = markers.length > 0;
      const center = hasMarkers ? [markers[0].lat, markers[0].lng] : [20.0, 0.0];
      const zoom = hasMarkers ? 3 : 1;

      const map = L.map(mapContainerRef.current, { scrollWheelZoom: false }).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const plotted: Record<string, any> = {};
      markers.forEach(m => {
        const key = `${m.lat.toFixed(3)},${m.lng.toFixed(3)}`;
        if (plotted[key]) {
          plotted[key].bindPopup(`${plotted[key].getPopup().getContent()}<hr style="margin:4px 0; border:0; border-top:1px solid #ccc;">${m.desc}`);
        } else {
          const marker = L.marker([m.lat, m.lng]).addTo(map);
          marker.bindPopup(`<strong style="font-size:0.8rem;">${m.name}</strong><br><span style="font-size:0.75rem; color:#555;">${m.desc}</span>`);
          plotted[key] = marker;
        }
      });

      mapInstanceRef.current = map;
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timeout);
  }, [activeDocTab, selectedNormId, norms]);

  // Leaflet map renderer for Country Profile view
  useEffect(() => {
    if (!selectedCountryName || activeView !== 'country-profiles') return;

    const timeout = setTimeout(() => {
      if (countryMapInstanceRef.current) {
        countryMapInstanceRef.current.remove();
        countryMapInstanceRef.current = null;
      }

      const L = (window as any).L;
      if (!L || !countryMapContainerRef.current) return;

      const coords = COUNTRY_COORDINATES[selectedCountryName] || { lat: 20.0, lng: 0.0 };
      const map = L.map(countryMapContainerRef.current, { scrollWheelZoom: false }).setView([coords.lat, coords.lng], 4);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      L.marker([coords.lat, coords.lng]).addTo(map)
        .bindPopup(`<strong>${selectedCountryName}</strong>`)
        .openPopup();

      countryMapInstanceRef.current = map;
      map.invalidateSize();
    }, 150);

    return () => clearTimeout(timeout);
  }, [selectedCountryName, activeView]);

  // Switch tabs
  const handleSelectNorm = (id: string) => {
    setSelectedNormId(id);
    setActiveDocTab('summary');
    fetch(`/api/analytics/view/${id}`, { method: 'POST' }).catch(() => {});
  };

  // Load analytics counts
  const loadAnalyticsDashboard = () => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => setAnalyticsData(data))
      .catch(() => addToast('Failed to load dashboard metrics', 'error'));
  };

  // Admin login handler
  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const username = data.get('username') as string;
    const password = data.get('password') as string;

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(session => {
      setAdminSession({ loggedIn: true, user: session.user });
      addToast('Authenticated successfully', 'success');
      loadAdminData();
    })
    .catch(() => addToast('Invalid credentials provided', 'error'));
  };

  // Admin setup handler (first user)
  const handleSetupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const username = data.get('username') as string;
    const password = data.get('password') as string;

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role: 'admin' })
    })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(() => {
      addToast('Master admin registered successfully! Please log in.', 'success');
      loadUsersListStatus();
    })
    .catch(() => addToast('Failed to register master admin', 'error'));
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => {
        setAdminSession({ loggedIn: false });
        addToast('Admin session terminated', 'info');
      });
  };

  const createNewNormForm = () => {
    setIsEditingNew(true);
    setEditingNorm({
      norm_id: '',
      title: '',
      domain: 'customs_clearance',
      status: 'emerging',
      contested: false,
      summary: '',
      primary_codification: '',
      state_practice: [],
      opinio_juris: [],
      sources: []
    });
  };

  const cancelEditor = () => {
    setEditingNorm(null);
    setIsEditingNew(false);
  };

  // Form edit handlers for nested structures
  const removeNestedItem = (type: 'practice' | 'opinio' | 'source', index: number) => {
    if (!editingNorm) return;
    const update = { ...editingNorm };
    if (type === 'practice') {
      update.state_practice = update.state_practice.filter((_, i) => i !== index);
    } else if (type === 'opinio') {
      update.opinio_juris = update.opinio_juris.filter((_, i) => i !== index);
    } else {
      update.sources = update.sources.filter((_, i) => i !== index);
    }
    setEditingNorm(update);
  };

  const addPracticeField = () => {
    if (!editingNorm) return;
    const update = { ...editingNorm };
    update.state_practice.push({
      practice_id: 'SP-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      description: '',
      states_involved: [],
      year: new Date().getFullYear(),
      source_ids: []
    });
    setEditingNorm(update);
  };

  const addOpinioField = () => {
    if (!editingNorm) return;
    const update = { ...editingNorm };
    update.opinio_juris.push({
      oj_id: 'OJ-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      description: '',
      evidence_type: 'military_manual',
      year: new Date().getFullYear(),
      source_ids: []
    });
    setEditingNorm(update);
  };

  const addSourceField = () => {
    if (!editingNorm) return;
    const update = { ...editingNorm };
    update.sources.push({
      source_id: 'SRC-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      type: 'treaty',
      title: '',
      year: new Date().getFullYear(),
      url: '',
      evidentiary_type: 'practice'
    });
    setEditingNorm(update);
  };

  const handleSaveNorm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingNorm) return;

    const method = isEditingNew ? 'POST' : 'PUT';
    const url = isEditingNew ? '/api/norms' : `/api/norms/${editingNorm.norm_id}`;

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingNorm)
    })
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(saved => {
      addToast(`Saved regulation ${saved.norm_id}`, 'success');
      setEditingNorm(saved);
      setIsEditingNew(false);
      loadData();
    })
    .catch(() => addToast('Failed to save regulation constraints', 'error'));
  };

  const handleDeleteNorm = (id: string) => {
    fetch(`/api/norms/${id}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error();
        addToast(`Regulation ${id} deleted`, 'success');
        setConfirmDeleteId(null);
        setEditingNorm(null);
        loadData();
      })
      .catch(() => addToast('Delete operation rejected', 'error'));
  };

  // User additions
  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const username = data.get('username') as string;
    const password = data.get('password') as string;
    const role = data.get('role') as 'admin' | 'moderator';

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    })
    .then(res => {
      if (!res.ok) return res.json().then(e => { throw new Error(e.error); });
      return res.json();
    })
    .then(() => {
      addToast(`Created user account for ${username}`, 'success');
      e.currentTarget.reset();
      loadAdminData();
    })
    .catch(err => addToast(err.message || 'Failed to create user', 'error'));
  };

  const handleDeleteUser = (username: string) => {
    if (confirm(`Remove user ${username}?`)) {
      fetch(`/api/users/${username}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error();
          addToast(`Account ${username} purged`, 'success');
          loadAdminData();
        })
        .catch(() => addToast('PURGE rejected', 'error'));
    }
  };

  // Import dataset overwrites
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        fetch('/api/data/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          addToast(`Import complete! Overwrote database with ${data.count} regulations`, 'success');
          loadData();
        })
        .catch(() => addToast('Import failed. Invalid validation structure', 'error'));
      } catch {
        addToast('File reading error, invalid JSON syntax', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Derived properties
  const activeNorm = norms.find(n => n.norm_id === selectedNormId);
  const activeCountry = countries.find(c => c.name === selectedCountryName);

  return (
    <div className="h-full flex flex-col bg-bg-app text-text-primary transition-colors duration-200">
      
      {/* ── TOP HEADER BAR ── */}
      <header className="h-[64px] bg-bg-sidebar border-b border-border-custom px-4 md:px-6 flex items-center justify-between shrink-0 z-50 shadow-xs">
        <div 
          onClick={handleResetToLanding}
          className="flex items-center gap-3 cursor-pointer select-none active:scale-[0.98] transition-transform duration-100 hover:opacity-90"
          title="Go to Home / Reset Filters"
        >
          <div className="font-serif font-bold text-xl text-primary tracking-tight">
            Lex<span className="text-gold-val">Customs</span>
          </div>
          <span className="text-[0.65rem] uppercase tracking-wider bg-primary-light text-primary font-semibold px-2 py-0.5 rounded-sm">
            CIL & Customs DB
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleToggleTheme}
            className="text-lg cursor-pointer text-text-secondary hover:text-primary transition-transform duration-300 hover:rotate-[25deg]"
            title="Toggle color theme"
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          {adminSession.loggedIn && (
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <i className="fa-solid fa-user-shield"></i>
              <span>{adminSession.user?.username} ({adminSession.user?.role})</span>
              <button 
                onClick={handleLogout}
                className="bg-bg-input hover:bg-border-custom text-text-secondary border border-border-custom px-2 py-0.5 rounded-sm cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation View switcher */}
      <div className="relative bg-bg-sidebar border-b border-border-custom flex gap-2 px-4 md:px-6 h-[48px] items-stretch shrink-0 overflow-x-auto scrollbar-none whitespace-nowrap z-50">
        <button 
          onClick={() => setActiveView('explorer')}
          className={`text-xs font-medium px-3 h-full border-b-3 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'explorer' 
              ? 'text-primary border-primary font-semibold' 
              : 'text-text-secondary hover:text-primary border-transparent'
          }`}
        >
          <i className="fa-solid fa-scale-balanced"></i> Law Explorer
        </button>
        <button 
          onClick={() => { setActiveView('country-profiles'); setSelectedCountryName(null); }}
          className={`text-xs font-medium px-3 h-full border-b-3 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'country-profiles' 
              ? 'text-primary border-primary font-semibold' 
              : 'text-text-secondary hover:text-primary border-transparent'
          }`}
        >
          <i className="fa-solid fa-globe"></i> Country Profiles
        </button>
        <button 
          onClick={() => { setActiveView('analytics'); loadAnalyticsDashboard(); }}
          className={`text-xs font-medium px-3 h-full border-b-3 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'analytics' 
              ? 'text-primary border-primary font-semibold' 
              : 'text-text-secondary hover:text-primary border-transparent'
          }`}
        >
          <i className="fa-solid fa-chart-line"></i> Analytics Hub
        </button>
        <button 
          onClick={() => { setActiveView('admin'); loadUsersListStatus(); }}
          className={`text-xs font-medium px-3 h-full border-b-3 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeView === 'admin' 
              ? 'text-primary border-primary font-semibold' 
              : 'text-text-secondary hover:text-primary border-transparent'
          }`}
        >
          <i className="fa-solid fa-user-lock"></i> Admin Portal
        </button>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar (Only visible in Explorer view) */}
        {activeView === 'explorer' && (
          <aside className={`${selectedNormId ? 'hidden md:flex' : 'flex w-full md:w-[320px]'} bg-bg-sidebar border-r border-border-custom flex-col shrink-0 overflow-hidden transition-all duration-200 z-40`}>
            
            {/* Search Box */}
            <div className="p-4 border-b border-border-custom">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search regulations, keys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-xs border border-border-custom rounded-md bg-bg-input text-text-primary focus:border-primary focus:bg-bg-surface outline-none transition-all duration-200"
                />
                <i className="fa-solid fa-magnifying-glass absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"></i>
              </div>
            </div>

            {/* Filter: Domain */}
            <div className="px-4 py-3 border-b border-border-custom">
              <div className="text-[0.68rem] font-bold uppercase tracking-wider text-text-muted mb-2 flex justify-between">
                Domain <i className="fa-solid fa-filter"></i>
              </div>
              <select 
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="w-full p-2 border border-border-custom rounded-md bg-bg-input text-text-primary text-xs outline-none cursor-pointer"
              >
                <option value="">All Domains</option>
                {DOMAIN_ORDER.map(d => (
                  <option key={d} value={d}>{DOMAIN_LABELS[d]}</option>
                ))}
              </select>
            </div>

            {/* Filter: Status */}
            <div className="px-4 py-3 border-b border-border-custom">
              <div className="text-[0.68rem] font-bold uppercase tracking-wider text-text-muted mb-2">Legal Status</div>
              <div className="flex flex-wrap gap-1">
                {['', 'established', 'emerging', 'contested'].map(s => (
                  <span 
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-[0.72rem] px-2.5 py-0.5 rounded-full border cursor-pointer select-none transition-all ${
                      filterStatus === s 
                        ? 'bg-primary text-white border-primary' 
                        : 'border-border-custom bg-bg-input text-text-secondary hover:border-primary'
                    }`}
                  >
                    {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            {/* Filter: Region */}
            <div className="px-4 py-3 border-b border-border-custom">
              <div className="text-[0.68rem] font-bold uppercase tracking-wider text-text-muted mb-2">Geographic Region</div>
              <select 
                value={filterRegion} 
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full p-2 border border-border-custom rounded-md bg-bg-input text-text-primary text-xs outline-none"
              >
                <option value="">All Regions</option>
                {["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East", "Africa", "Global"].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Filter: Trade Bloc */}
            <div className="px-4 py-3 border-b border-border-custom">
              <div className="text-[0.68rem] font-bold uppercase tracking-wider text-text-muted mb-2">Trade Bloc</div>
              <select 
                value={filterTradeBloc}
                onChange={(e) => setFilterTradeBloc(e.target.value)}
                className="w-full p-2 border border-border-custom rounded-md bg-bg-input text-text-primary text-xs outline-none"
              >
                <option value="">All Trade Blocs</option>
                {["USMCA", "European Union", "CPTPP", "RCEP", "Mercosur", "EFTA", "ECOWAS", "SACU", "GCC", "None"].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Scroll List Header */}
            <div className="text-[0.72rem] text-text-muted px-4 py-2 border-b border-border-custom bg-bg-input font-medium">
              <i className="fa-solid fa-list-check"></i> {filteredNorms.length} Regulations Found
            </div>

            {/* Scroll List items */}
            <div className="flex-1 overflow-y-auto">
              {filteredNorms.length === 0 ? (
                <div className="p-8 text-center text-text-muted text-xs">
                  <i className="fa-regular fa-folder-open text-2xl mb-2 block"></i>
                  No regulations match filters.
                </div>
              ) : (
                filteredNorms.map(norm => (
                  <div 
                    key={norm.norm_id} 
                    onClick={() => handleSelectNorm(norm.norm_id)}
                    className={`p-3 border-b border-border-custom cursor-pointer flex items-start gap-2.5 transition-colors ${
                      norm.norm_id === selectedNormId 
                        ? 'bg-primary-light border-l-3 border-primary' 
                        : 'hover:bg-bg-input'
                    }`}
                  >
                    <span className="font-mono text-[0.65rem] font-medium text-text-muted bg-bg-input px-1.5 py-0.5 rounded-xs">
                      {norm.norm_id}
                    </span>
                    <div className="text-xs font-medium leading-relaxed text-text-primary flex-1">{norm.title}</div>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      norm.status === 'established' ? 'bg-green-val' : (norm.status === 'emerging' ? 'bg-amber-val' : 'bg-red-val')
                    }`}></span>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}

        {/* ── CENTRAL VIEWPORT ── */}
        <main className={`${activeView === 'explorer' && !selectedNormId ? 'hidden md:flex' : 'flex'} flex-1 overflow-y-auto flex-col`}>

          {/* ── PANEL 1: EXPLORER VIEW ── */}
          {activeView === 'explorer' && (
            <div className="p-4 md:p-8 max-w-[960px] w-full mx-auto flex-1 animate-fadeIn">
              
              {!activeNorm ? (
                <div className="max-w-[600px] mx-auto my-16 text-center flex flex-col items-center gap-5">
                  <div className="text-3xl bg-primary-light text-primary w-[80px] h-[80px] rounded-full flex items-center justify-center">⚖</div>
                  <h1 className="font-serif font-bold text-2xl px-4">Customary International Law & Customs Reference</h1>
                  <p className="text-xs text-text-secondary leading-relaxed px-6">
                    Select a regulation or customary law from the left panel to display comprehensive summaries, associated state practices, declarations of opinio juris, and primary document citations.
                  </p>
                </div>
              ) : (
                <div className="bg-bg-surface border border-border-custom rounded-lg shadow-md overflow-hidden">
                  
                  {/* Detailed Doc Header */}
                  <div className="p-4 md:p-6 border-b-2 border-bg-app bg-bg-surface">
                    {/* Mobile Back Button */}
                    <button 
                      onClick={() => setSelectedNormId(null)}
                      className="md:hidden mb-4 bg-bg-input hover:bg-border-custom border border-border-custom px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-text-secondary w-fit"
                    >
                      <i className="fa-solid fa-arrow-left"></i> Back to Regulations List
                    </button>
                    <div className="flex justify-between items-center text-[0.68rem] font-bold text-text-muted tracking-wider mb-2.5">
                      <span>REFERENCE CODE</span>
                      <span className="font-mono">{activeNorm.norm_id}</span>
                    </div>
                    <h2 className="font-serif font-bold text-xl md:text-2xl leading-snug mb-3">{activeNorm.title}</h2>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className={`text-[0.68rem] font-semibold px-2.5 py-0.5 rounded-full uppercase ${
                        activeNorm.status === 'established' 
                          ? 'bg-green-light text-green-val' 
                          : (activeNorm.status === 'emerging' ? 'bg-amber-light text-amber-val' : 'bg-red-light text-red-val')
                      }`}>
                        {activeNorm.status}
                      </span>
                      <span className="text-[0.68rem] font-semibold px-2.5 py-0.5 rounded-full uppercase bg-primary-light text-primary">
                        {DOMAIN_LABELS[activeNorm.domain]}
                      </span>
                      {activeNorm.contested && (
                        <span className="text-[0.68rem] font-semibold px-2.5 py-0.5 rounded-full uppercase bg-gold-light text-gold-val border border-border-custom">
                          <i className="fa-solid fa-triangle-exclamation mr-1"></i> Disputed Norm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Document Section Tabs */}
                  <div className="px-4 md:px-6 border-b border-border-custom flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
                    {[
                      { id: 'summary', label: 'Summary & Rule' },
                      { id: 'practice', label: `State Practice (${activeNorm.state_practice.length})` },
                      { id: 'juris', label: `Opinio Juris (${activeNorm.opinio_juris.length})` },
                      { id: 'sources', label: `Citations (${activeNorm.sources.length})` },
                      { id: 'timeline', label: 'Chronological Timeline' },
                      { id: 'map', label: 'Geographical Plot' }
                    ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveDocTab(tab.id as any)}
                        className={`text-xs font-semibold py-3 px-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                          activeDocTab === tab.id 
                            ? 'text-primary border-primary' 
                            : 'text-text-secondary hover:text-primary border-transparent'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Document Tab Panels */}
                  <div className="p-4 md:p-6">
                    
                    {/* Panel 1: Summary */}
                    {activeDocTab === 'summary' && (
                      <div className="animate-fadeIn">
                        <div className="font-serif italic text-lg leading-relaxed text-text-primary mb-6">
                          {activeNorm.summary || 'Summary pending moderator authentication.'}
                        </div>
                        
                        {/* Copy citation */}
                        <div className="bg-bg-surface-alt border border-border-custom p-4 rounded-md">
                          <div className="text-[0.68rem] font-bold text-text-muted mb-2 uppercase tracking-wider">How to cite this record</div>
                          <div className="font-mono text-[0.72rem] text-text-secondary leading-relaxed bg-bg-input p-3 rounded border border-border-custom break-all" id="citation-box-value">
                            LexCustoms, "{activeNorm.title}" (ID: {activeNorm.norm_id}, Domain: {DOMAIN_LABELS[activeNorm.domain]}), CIL database Reference (2026). URL: {origin}/api/norms/{activeNorm.norm_id}
                          </div>
                          <button 
                            onClick={() => {
                              const text = document.getElementById('citation-box-value')?.textContent || '';
                              navigator.clipboard.writeText(text).then(() => addToast('Citation copied', 'info'));
                            }}
                            className="bg-bg-input border border-border-custom hover:bg-border-custom text-text-secondary text-[0.72rem] font-medium px-3 py-1.5 rounded mt-3 inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <i className="fa-solid fa-copy"></i> Copy Citation
                          </button>
                        </div>

                        <p className="text-xs text-text-muted mt-5">
                          Primary Codification: <strong>{activeNorm.primary_codification || 'Uncodified / Customary'}</strong>
                        </p>
                      </div>
                    )}

                    {/* Panel 2: State Practice */}
                    {activeDocTab === 'practice' && (
                      <div className="flex flex-col gap-3.5 animate-fadeIn">
                        {activeNorm.state_practice.length === 0 ? (
                          <p className="text-xs text-text-muted">No state practices logged.</p>
                        ) : (
                          activeNorm.state_practice.map(sp => (
                            <div key={sp.practice_id} className="bg-bg-surface-alt border border-border-custom p-4 rounded-md">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="text-xs font-semibold text-text-primary">{sp.description}</div>
                                <span className="text-[0.65rem] tracking-wider bg-bg-input text-text-muted px-2 py-0.5 rounded-sm font-mono">{sp.year}</span>
                              </div>
                              <div className="flex justify-between text-[0.7rem] text-text-muted">
                                <span><strong>Participating States:</strong> {sp.states_involved.join(', ')}</span>
                                <span><strong>Source References:</strong> {sp.source_ids.join(', ')}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Panel 3: Opinio Juris */}
                    {activeDocTab === 'juris' && (
                      <div className="flex flex-col gap-3.5 animate-fadeIn">
                        {activeNorm.opinio_juris.length === 0 ? (
                          <p className="text-xs text-text-muted">No opinio juris evidence logged.</p>
                        ) : (
                          activeNorm.opinio_juris.map(oj => (
                            <div key={oj.oj_id} className="bg-bg-surface-alt border border-border-custom p-4 rounded-md">
                              <p className="text-xs text-text-primary leading-relaxed">{oj.description}</p>
                              <div className="flex justify-between text-[0.7rem] text-text-muted mt-3.5 pt-2 border-t border-bg-app">
                                <span><strong>Evidence type:</strong> {oj.evidence_type.toUpperCase().replace('_', ' ')}</span>
                                <span><strong>Year:</strong> {oj.year}</span>
                                <span><strong>Sources:</strong> {oj.source_ids.join(', ')}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Panel 4: Citations */}
                    {activeDocTab === 'sources' && (
                      <div className="flex flex-col gap-3.5 animate-fadeIn">
                        {activeNorm.sources.length === 0 ? (
                          <p className="text-xs text-text-muted">No source documents cited.</p>
                        ) : (
                          activeNorm.sources.map(src => (
                            <div key={src.source_id} className="bg-bg-surface-alt border border-border-custom p-4 rounded-md">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="text-xs font-semibold">
                                  {src.url ? (
                                    <a href={src.url} target="_blank" className="text-primary hover:underline inline-flex items-center gap-1">
                                      {src.title} <i className="fa-solid fa-arrow-up-right-from-square text-[0.6rem]"></i>
                                    </a>
                                  ) : src.title}
                                </div>
                                <span className="text-[0.65rem] tracking-wider bg-bg-input text-text-muted px-2 py-0.5 rounded-sm whitespace-nowrap">
                                  {SRC_TYPE_LABELS[src.type] || src.type.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-4 text-[0.7rem] text-text-muted">
                                <span><strong>Year:</strong> {src.year || 'N/A'}</span>
                                <span><strong>Source ID:</strong> {src.source_id}</span>
                                <span><strong>Evidentiary Proof Value:</strong> {src.evidentiary_type.toUpperCase()}</span>
                              </div>
                              {src.notes && <p className="text-[0.72rem] italic text-text-muted mt-2 border-t border-bg-app pt-1.5">{src.notes}</p>}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Panel 5: Timeline */}
                    {activeDocTab === 'timeline' && (
                      <div className="relative p-2 animate-fadeIn">
                        <div className="absolute left-[60px] top-0 bottom-0 w-[2px] bg-border-custom"></div>
                        {(() => {
                          const events: any[] = [];
                          activeNorm.state_practice.forEach(sp => {
                            events.push({ year: sp.year, title: sp.description, type: 'practice', meta: `States: ${sp.states_involved.join(', ')}` });
                          });
                          activeNorm.opinio_juris.forEach(oj => {
                            events.push({ year: oj.year, title: oj.description, type: 'juris', meta: `Opinio: ${oj.evidence_type.replace('_', ' ')}` });
                          });
                          events.sort((a,b) => a.year - b.year);

                          if (events.length === 0) {
                            return <p className="text-xs text-text-muted">No chronological practice timeline recorded.</p>;
                          }

                          return events.map((ev, i) => (
                            <div key={i} className="flex mb-6 relative">
                              <div className="font-mono text-xs font-semibold text-primary w-[48px] text-right pr-3 pt-1">{ev.year}</div>
                              <div className="w-[24px] flex justify-center z-10">
                                <span className={`w-2.5 h-2.5 rounded-full border-2 border-bg-surface mt-1.5 ${
                                  ev.type === 'practice' ? 'bg-green-val' : 'bg-primary'
                                }`}></span>
                              </div>
                              <div className="flex-1 bg-bg-surface-alt border border-border-custom p-3.5 rounded-md">
                                <div className="text-xs font-medium text-text-primary leading-relaxed">{ev.title}</div>
                                <div className="text-[0.7rem] text-text-muted mt-1.5">{ev.meta}</div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Panel 6: Map */}
                    {activeDocTab === 'map' && (
                      <div className="animate-fadeIn">
                        <div className="h-[250px] md:h-[380px] w-full rounded-md border border-border-custom overflow-hidden" ref={mapContainerRef}></div>
                        <div className="text-[0.72rem] text-text-muted mt-2.5 italic">Interactive Leaflet mapping of states providing evidence of practice for this custom.</div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PANEL 2: COUNTRY PROFILES VIEW ── */}
          {activeView === 'country-profiles' && (
            <div className="p-4 md:p-8 max-w-[960px] w-full mx-auto flex-1 animate-fadeIn">
              
              {!selectedCountryName ? (
                <div>
                  <h2 className="font-serif font-bold text-2xl mb-1.5">Geographical & Customs Profiles</h2>
                  <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                    Select a nation to audit active customs authorities, trade agreement alignments, and contributions to international customary laws.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {countries.map(c => (
                      <div 
                        key={c.name} 
                        onClick={() => setSelectedCountryName(c.name)}
                        className="bg-bg-surface border border-border-custom rounded-md p-4 shadow-xs hover:shadow-md hover:border-primary hover:-translate-y-0.5 cursor-pointer transition-all duration-150"
                      >
                        <div className="font-serif font-bold text-lg text-text-primary mb-2.5">{c.name}</div>
                        <div className="text-[0.75rem] text-text-secondary flex justify-between py-1 border-b border-bg-app">
                          <span className="text-text-muted">Region</span> <span>{c.region}</span>
                        </div>
                        <div className="text-[0.75rem] text-text-secondary flex justify-between py-1 border-b border-bg-app">
                          <span className="text-text-muted">Trade Bloc</span> <span>{c.trade_bloc}</span>
                        </div>
                        <div className="text-[0.75rem] text-text-secondary flex justify-between py-1 border-b border-bg-app">
                          <span className="text-text-muted">Customs Authority</span> <span className="max-w-[140px] truncate">{c.authority}</span>
                        </div>
                        <div className="mt-4 flex gap-1.5">
                          <span className="text-[0.68rem] font-semibold bg-primary-light text-primary px-2.5 py-0.5 rounded-full">{c.practice_count} Practices</span>
                          <span className="text-[0.68rem] font-semibold bg-green-light text-green-val px-2.5 py-0.5 rounded-full">{c.domain_count} Domains</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-bg-surface border border-border-custom rounded-lg p-4 md:p-6 shadow-md">
                  <div className="flex justify-between items-start border-b-2 border-bg-app pb-4 mb-5">
                    <div>
                      <h3 className="font-serif font-bold text-2xl md:text-3xl">{selectedCountryName}</h3>
                      <p className="text-text-muted text-xs mt-1">LexCustoms regulatory status report</p>
                    </div>
                    <button 
                      onClick={() => setSelectedCountryName(null)}
                      className="bg-bg-input hover:bg-border-custom border border-border-custom px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-arrow-left"></i> Directory
                    </button>
                  </div>

                  {activeCountry && (
                    <>
                      {/* Specs */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-bg-surface-alt p-4 rounded-md border border-border-custom mb-6">
                        <div className="flex flex-col">
                          <span className="text-[0.65rem] font-bold text-text-muted uppercase tracking-wider">Region</span>
                          <span className="text-xs font-medium mt-0.5">{activeCountry.region}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.65rem] font-bold text-text-muted uppercase tracking-wider">Trade Bloc</span>
                          <span className="text-xs font-medium mt-0.5">{activeCountry.trade_bloc}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.65rem] font-bold text-text-muted uppercase tracking-wider">Customs Authority</span>
                          <span className="text-xs font-medium mt-0.5">{activeCountry.authority}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.65rem] font-bold text-text-muted uppercase tracking-wider">Legal Category Focus</span>
                          <span className="text-xs font-medium mt-0.5">{activeCountry.industry}</span>
                        </div>
                      </div>

                      {/* Map & Linkage table */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Country Map container */}
                        <div className="bg-bg-surface border border-border-custom p-4 rounded shadow-sm h-[300px] md:h-[380px]">
                          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 pb-2 border-b border-border-custom">Country focus map</div>
                          <div className="h-[200px] md:h-[280px] w-full rounded border border-border-custom" ref={countryMapContainerRef}></div>
                        </div>

                        {/* Norms list */}
                        <div className="bg-bg-surface border border-border-custom p-4 rounded shadow-sm h-[300px] md:h-[380px] overflow-y-auto">
                          <div className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 pb-2 border-b border-border-custom">Associated Regulations ({activeCountry.norms.length})</div>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-xs text-left">
                              <thead>
                                <tr className="bg-bg-surface-alt text-text-secondary border-b-2 border-border-custom">
                                  <th className="p-2">Code</th>
                                  <th className="p-2">Title</th>
                                  <th className="p-2 text-right">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {activeCountry.norms.map(n => (
                                  <tr 
                                    key={n.norm_id} 
                                    onClick={() => { setActiveView('explorer'); handleSelectNorm(n.norm_id); }}
                                    className="border-b border-bg-app hover:bg-bg-input cursor-pointer"
                                  >
                                    <td className="p-2"><span className="font-mono text-[0.65rem] bg-bg-input px-1 py-0.5 rounded">{n.norm_id}</span></td>
                                    <td className="p-2 text-text-primary">{n.title}</td>
                                    <td className="p-2 text-right"><span className={`inline-block w-2 h-2 rounded-full ${
                                      n.status === 'established' ? 'bg-green-val' : (n.status === 'emerging' ? 'bg-amber-val' : 'bg-red-val')
                                    }`}></span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    </>
                  )}

                </div>
              )}

            </div>
          )}

          {/* ── PANEL 3: ANALYTICS DASHBOARD ── */}
          {activeView === 'analytics' && (
            <div className="p-4 md:p-8 max-w-[960px] w-full mx-auto flex-1 animate-fadeIn">
              <h2 className="font-serif font-bold text-xl md:text-2xl mb-1.5">Database growth & usage metrics</h2>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                Real-time dashboard reporting custom data points, access views, and search keywords.
              </p>

              {analyticsData ? (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-bg-surface border border-border-custom rounded p-4 relative shadow-sm border-l-4 border-l-primary">
                      <div className="text-2xl font-bold text-primary">{analyticsData.metrics.totalNorms}</div>
                      <div className="text-[0.68rem] text-text-muted uppercase tracking-wider mt-1">Total Regulations</div>
                    </div>
                    <div className="bg-bg-surface border border-border-custom rounded p-4 relative shadow-sm border-l-4 border-l-green-val">
                      <div className="text-2xl font-bold text-green-val">{analyticsData.metrics.totalPractices}</div>
                      <div className="text-[0.68rem] text-text-muted uppercase tracking-wider mt-1">State Practices</div>
                    </div>
                    <div className="bg-bg-surface border border-border-custom rounded p-4 relative shadow-sm border-l-4 border-l-gold-val">
                      <div className="text-2xl font-bold text-gold-val">{analyticsData.metrics.totalSources}</div>
                      <div className="text-[0.68rem] text-text-muted uppercase tracking-wider mt-1">Indexed Citations</div>
                    </div>
                    <div className="bg-bg-surface border border-border-custom rounded p-4 relative shadow-sm border-l-4 border-l-red-val">
                      <div className="text-2xl font-bold text-red-val">
                        {((analyticsData.metrics.disputedCount / analyticsData.metrics.totalNorms) * 100).toFixed(0)}%
                      </div>
                      <div className="text-[0.68rem] text-text-muted uppercase tracking-wider mt-1">Contested Rate</div>
                    </div>
                  </div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    
                    <div className="bg-bg-surface border border-border-custom rounded p-4 md:p-5 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-text-secondary pb-2 border-b border-border-custom mb-4">Regulations by Domain</div>
                      <div className="flex flex-col gap-2.5">
                        {(() => {
                          const maxCount = Math.max(...Object.values(analyticsData.domainDistribution) as number[]);
                          return Object.entries(analyticsData.domainDistribution).map(([domain, count]: any) => {
                            const pct = (count / maxCount) * 100;
                            return (
                              <div key={domain} className="flex items-center gap-3">
                                <div className="text-[0.72rem] w-[140px] truncate" title={DOMAIN_LABELS[domain]}>{DOMAIN_LABELS[domain]}</div>
                                <div className="flex-1 h-[14px] bg-bg-input rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                                </div>
                                <div className="text-[0.72rem] font-bold w-[24px] text-right">{count}</div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    <div className="bg-bg-surface border border-border-custom rounded p-4 md:p-5 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-text-secondary pb-2 border-b border-border-custom mb-4">Status Distribution</div>
                      <div className="flex flex-col gap-2.5">
                        {[
                          { label: 'Established', val: analyticsData.metrics.establishedCount, color: 'var(--green-val)' },
                          { label: 'Emerging', val: analyticsData.metrics.emergingCount, color: 'var(--amber-val)' },
                          { label: 'Contested', val: analyticsData.metrics.contestedCount, color: 'var(--red-val)' }
                        ].map(s => {
                          const maxCount = Math.max(
                            analyticsData.metrics.establishedCount,
                            analyticsData.metrics.emergingCount,
                            analyticsData.metrics.contestedCount
                          );
                          const pct = (s.val / maxCount) * 100;
                          return (
                            <div key={s.label} className="flex items-center gap-3">
                              <div className="text-[0.72rem] w-[140px]">{s.label}</div>
                              <div className="flex-1 h-[14px] bg-bg-input rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: s.color }}></div>
                              </div>
                              <div className="text-[0.72rem] font-bold w-[24px] text-right">{s.val}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Viewed regulations */}
                  <div className="bg-bg-surface border border-border-custom rounded p-4 md:p-5 shadow-sm mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-text-secondary pb-2 border-b border-border-custom mb-4">Most Consulted Regulations</div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs text-left min-w-[500px]">
                        <thead>
                          <tr className="bg-bg-surface-alt border-b-2 border-border-custom text-text-secondary">
                            <th className="p-2">ID</th>
                            <th className="p-2">Title</th>
                            <th className="p-2">Domain</th>
                            <th className="p-2 text-right">Views</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.mostViewed.length === 0 ? (
                            <tr><td colSpan={4} className="p-4 text-center text-text-muted">No consultation views logged.</td></tr>
                          ) : (
                            analyticsData.mostViewed.map((item: any) => (
                              <tr 
                                key={item.norm_id} 
                                onClick={() => { setActiveView('explorer'); handleSelectNorm(item.norm_id); }}
                                className="border-b border-bg-app hover:bg-bg-input cursor-pointer"
                              >
                                <td className="p-2"><span className="font-mono text-[0.65rem] bg-bg-input px-1.5 py-0.5 rounded">{item.norm_id}</span></td>
                                <td className="p-2 text-text-primary font-medium">{item.title}</td>
                                <td className="p-2 text-text-secondary">{DOMAIN_LABELS[item.domain] || item.domain}</td>
                                <td className="p-2 text-right font-bold text-primary">{item.views} views</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Searches */}
                  <div className="bg-bg-surface border border-border-custom rounded p-4 md:p-5 shadow-sm">
                    <div className="text-xs font-bold uppercase tracking-wider text-text-secondary pb-2 border-b border-border-custom mb-4">Recent Search Keyword Logs</div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs text-left min-w-[300px]">
                        <thead>
                          <tr className="bg-bg-surface-alt border-b-2 border-border-custom text-text-secondary">
                            <th className="p-2">Keyword Query</th>
                            <th className="p-2 text-right">Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.topSearches.length === 0 ? (
                            <tr><td colSpan={2} className="p-4 text-center text-text-muted">No keywords searched yet.</td></tr>
                          ) : (
                            analyticsData.topSearches.map((item: any) => (
                              <tr key={item.keyword} className="border-b border-bg-app">
                                <td className="p-2 text-text-primary"><i className="fa-solid fa-clock-rotate-left mr-2 text-text-muted"></i> "{item.keyword}"</td>
                                <td className="p-2 text-right font-bold">{item.count} searches</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-text-muted">Compiling server logs...</div>
              )}

            </div>
          )}

          {/* ── PANEL 4: ADMIN PORTAL ── */}
          {activeView === 'admin' && (
            <div className="p-4 md:p-8 max-w-[960px] w-full mx-auto flex-1 animate-fadeIn">
              
              {!adminSession.loggedIn ? (
                isDatabaseEmpty === true ? (
                  /* Setup screen */
                  <div className="max-w-[380px] w-full mx-auto my-16 bg-bg-surface border border-border-custom rounded-lg p-8 shadow-lg animate-fadeIn">
                    <div className="text-center font-serif font-bold text-xl mb-3 text-primary">Initial Admin Setup</div>
                    <p className="text-center text-[0.72rem] text-text-secondary mb-4 leading-relaxed">
                      No administrator accounts exist in the database. Create the master admin account below.
                    </p>
                    <form onSubmit={handleSetupSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider">Username</label>
                        <input type="text" name="username" required className="p-2 border border-border-custom rounded-md bg-bg-input text-text-primary text-xs outline-none focus:border-primary focus:bg-bg-surface" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider">Password</label>
                        <input type="password" name="password" required className="p-2 border border-border-custom rounded-md bg-bg-input text-text-primary text-xs outline-none focus:border-primary focus:bg-bg-surface" />
                      </div>
                      <button type="submit" className="bg-green-val hover:bg-[#0a4d33] text-white text-xs font-semibold p-2.5 rounded-md mt-2 cursor-pointer shadow-xs transition-colors text-center">
                        Register Master Admin
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Login screen */
                  <div className="max-w-[380px] w-full mx-auto my-16 bg-bg-surface border border-border-custom rounded-lg p-8 shadow-lg animate-fadeIn">
                    <div className="text-center font-serif font-bold text-xl mb-6 text-primary">Moderator Session Login</div>
                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider">Username</label>
                        <input type="text" name="username" required className="p-2 border border-border-custom rounded-md bg-bg-input text-text-primary text-xs outline-none focus:border-primary focus:bg-bg-surface" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[0.7rem] font-bold text-text-secondary uppercase tracking-wider">Password</label>
                        <input type="password" name="password" required className="p-2 border border-border-custom rounded-md bg-bg-input text-text-primary text-xs outline-none focus:border-primary focus:bg-bg-surface" />
                      </div>
                      <button type="submit" className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold p-2.5 rounded-md mt-2 cursor-pointer shadow-xs transition-colors text-center">
                        Authenticate Session
                      </button>
                    </form>
                  </div>
                )
              ) : (
                /* Admin Console */
                <div className="bg-bg-surface border border-border-custom rounded-lg p-4 md:p-6 shadow-md">
                  <div className="flex border-b border-border-custom mb-6 gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
                    {[
                      { id: 'editor', label: 'Norms Editor' },
                      { id: 'users', label: 'User Management' },
                      { id: 'import-export', label: 'Data Import/Export' }
                    ].map(sub => (
                      <button 
                        key={sub.id}
                        onClick={() => setAdminTab(sub.id as any)}
                        className={`text-xs font-bold py-2.5 px-4 rounded-t-md border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                          adminTab === sub.id 
                            ? 'bg-bg-surface-alt border-primary text-primary border-t border-x border-border-custom' 
                            : 'text-text-secondary hover:text-primary border-transparent'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  {/* Subtab 1: Editor */}
                  {adminTab === 'editor' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                      
                      {/* Sidebar Selection */}
                      <div className={`${editingNorm ? 'hidden lg:block' : 'block'}`}>
                        <button 
                          onClick={createNewNormForm}
                          className="w-full bg-green-val hover:bg-[#0a4d33] text-white text-xs font-semibold p-2 rounded-md mb-4 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                        >
                          <i className="fa-solid fa-plus"></i> Create New Regulation
                        </button>
                        <div className="bg-bg-sidebar border border-border-custom rounded h-[400px] lg:h-[580px] overflow-y-auto">
                          {norms.map(norm => (
                            <div 
                              key={norm.norm_id} 
                              onClick={() => { setEditingNorm(norm); setIsEditingNew(false); }}
                              className={`p-2.5 border-b border-border-custom cursor-pointer flex justify-between items-center text-xs transition-colors ${
                                editingNorm?.norm_id === norm.norm_id 
                                  ? 'bg-primary-light border-l-2 border-primary' 
                                  : 'hover:bg-bg-input'
                              }`}
                            >
                              <span className="font-mono text-[0.65rem] text-text-muted bg-bg-input px-1 py-0.5 rounded">{norm.norm_id}</span>
                              <span className="truncate flex-1 ml-2 text-text-primary leading-snug">{norm.title}</span>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ml-1.5 ${
                                norm.status === 'established' ? 'bg-green-val' : (norm.status === 'emerging' ? 'bg-amber-val' : 'bg-red-val')
                              }`}></span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Editing Panel */}
                      <div className={`${editingNorm ? 'block' : 'hidden lg:block'} bg-bg-surface-alt border border-border-custom rounded-md p-4 md:p-6`}>
                        {!editingNorm ? (
                          <div className="text-center py-20 flex flex-col items-center gap-3">
                            <i className="fa-solid fa-edit text-3xl text-text-muted"></i>
                            <h3 className="font-semibold text-text-primary text-sm">Select a Regulation to Edit</h3>
                            <p className="text-xs text-text-muted max-w-[280px]">Choose an existing customary law from the panel to the left, or click the create button.</p>
                          </div>
                        ) : (
                          <form onSubmit={handleSaveNorm} className="flex flex-col gap-4">
                            <div className="flex justify-between items-center pb-3 border-b border-border-custom gap-2">
                              <div className="flex items-center gap-2">
                                <button 
                                  type="button" 
                                  onClick={cancelEditor}
                                  className="lg:hidden bg-bg-input hover:bg-border-custom border border-border-custom px-2.5 py-1.5 rounded text-[0.72rem] font-semibold flex items-center gap-1.5 cursor-pointer text-text-secondary"
                                >
                                  <i className="fa-solid fa-arrow-left"></i> List
                                </button>
                                <h4 className="font-bold text-xs md:text-sm">{isEditingNew ? 'Create New Regulation' : `Edit Regulation ${editingNorm.norm_id}`}</h4>
                              </div>
                              {!isEditingNew && (
                                <button 
                                  type="button" 
                                  onClick={() => setConfirmDeleteId(editingNorm.norm_id)}
                                  className="text-red-val hover:text-white border border-red-val hover:bg-red-val text-[0.68rem] px-2.5 py-1 rounded cursor-pointer transition-colors"
                                >
                                  Delete Record
                                </button>
                              )}
                            </div>

                            {/* ID & Domain */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-[0.68rem] font-bold text-text-secondary uppercase">Regulation ID</label>
                                <input 
                                  type="text" 
                                  value={editingNorm.norm_id} 
                                  onChange={(e) => setEditingNorm({ ...editingNorm, norm_id: e.target.value.toUpperCase() })}
                                  placeholder="e.g. IHL-01" 
                                  required 
                                  disabled={!isEditingNew}
                                  className="p-2 border border-border-custom rounded bg-bg-input text-text-primary text-xs outline-none focus:border-primary disabled:opacity-60"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[0.68rem] font-bold text-text-secondary uppercase">Domain</label>
                                <select 
                                  value={editingNorm.domain} 
                                  onChange={(e) => setEditingNorm({ ...editingNorm, domain: e.target.value })}
                                  className="p-2 border border-border-custom rounded bg-bg-input text-text-primary text-xs outline-none cursor-pointer"
                                >
                                  {Object.entries(DOMAIN_LABELS).map(([k,v]) => (
                                    <option key={k} value={k}>{v}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Title */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[0.68rem] font-bold text-text-secondary uppercase">Regulation Title</label>
                              <input 
                                type="text" 
                                value={editingNorm.title} 
                                onChange={(e) => setEditingNorm({ ...editingNorm, title: e.target.value })}
                                placeholder="Rule statement" 
                                required
                                className="p-2 border border-border-custom rounded bg-bg-input text-text-primary text-xs outline-none focus:border-primary"
                              />
                            </div>

                            {/* Status & Codification */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-1">
                                <label className="text-[0.68rem] font-bold text-text-secondary uppercase">Legal Status</label>
                                <select 
                                  value={editingNorm.status} 
                                  onChange={(e) => setEditingNorm({ ...editingNorm, status: e.target.value as any })}
                                  className="p-2 border border-border-custom rounded bg-bg-input text-text-primary text-xs outline-none cursor-pointer"
                                >
                                  <option value="established">Established</option>
                                  <option value="emerging">Emerging</option>
                                  <option value="contested">Contested</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[0.68rem] font-bold text-text-secondary uppercase">Primary Codification</label>
                                <input 
                                  type="text" 
                                  value={editingNorm.primary_codification} 
                                  onChange={(e) => setEditingNorm({ ...editingNorm, primary_codification: e.target.value })}
                                  placeholder="Treaty article reference"
                                  className="p-2 border border-border-custom rounded bg-bg-input text-text-primary text-xs outline-none focus:border-primary"
                                />
                              </div>
                            </div>

                            {/* Contested */}
                            <div className="flex items-center gap-2 mt-1 select-none">
                              <input 
                                type="checkbox" 
                                id="ed-contested-check"
                                checked={editingNorm.contested} 
                                onChange={(e) => setEditingNorm({ ...editingNorm, contested: e.target.checked })}
                                className="w-4 h-4 cursor-pointer"
                              />
                              <label htmlFor="ed-contested-check" className="text-[0.72rem] text-text-secondary cursor-pointer">Mark this regulation as disputed (contested opinio juris / practice)</label>
                            </div>

                            {/* Summary */}
                            <div className="flex flex-col gap-1">
                              <label className="text-[0.68rem] font-bold text-text-secondary uppercase">Detailed Summary</label>
                              <textarea 
                                value={editingNorm.summary} 
                                onChange={(e) => setEditingNorm({ ...editingNorm, summary: e.target.value })}
                                rows={5} 
                                required
                                placeholder="Summary statement..."
                                className="p-2.5 border border-border-custom rounded bg-bg-input text-text-primary text-xs outline-none focus:border-primary leading-relaxed resize-none"
                              />
                            </div>

                            {/* State Practices */}
                            <div className="mt-4 border-t border-border-custom pt-3">
                              <div className="text-[0.7rem] font-bold uppercase tracking-wider text-text-muted mb-2 flex justify-between items-center">
                                State Practices
                                <button type="button" onClick={addPracticeField} className="text-primary text-[0.72rem] hover:underline cursor-pointer"><i className="fa-solid fa-plus"></i> Add Practice</button>
                              </div>
                              <div className="flex flex-col gap-3">
                                {editingNorm.state_practice.map((sp, idx) => (
                                  <div key={idx} className="bg-bg-surface border border-border-custom p-4 rounded relative">
                                    <button type="button" onClick={() => removeNestedItem('practice', idx)} className="absolute top-2 right-2 text-red-val hover:opacity-85 text-sm">&times;</button>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">ID</label>
                                        <input type="text" value={sp.practice_id} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.state_practice[idx].practice_id = e.target.value.toUpperCase();
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">Year</label>
                                        <input type="number" value={sp.year} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.state_practice[idx].year = parseInt(e.target.value) || 2020;
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5 mb-2">
                                      <label className="text-[0.6rem] font-bold text-text-muted uppercase">Description</label>
                                      <input type="text" value={sp.description} onChange={(e) => {
                                        const up = { ...editingNorm };
                                        up.state_practice[idx].description = e.target.value;
                                        setEditingNorm(up);
                                      }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">States (comma separated)</label>
                                        <input type="text" value={sp.states_involved.join(', ')} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.state_practice[idx].states_involved = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">Sources (comma separated)</label>
                                        <input type="text" value={sp.source_ids.join(', ')} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.state_practice[idx].source_ids = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Opinio Juris */}
                            <div className="mt-4 border-t border-border-custom pt-3">
                              <div className="text-[0.7rem] font-bold uppercase tracking-wider text-text-muted mb-2 flex justify-between items-center">
                                Opinio Juris Evidence
                                <button type="button" onClick={addOpinioField} className="text-primary text-[0.72rem] hover:underline cursor-pointer"><i className="fa-solid fa-plus"></i> Add Evidence</button>
                              </div>
                              <div className="flex flex-col gap-3">
                                {editingNorm.opinio_juris.map((oj, idx) => (
                                  <div key={idx} className="bg-bg-surface border border-border-custom p-4 rounded relative">
                                    <button type="button" onClick={() => removeNestedItem('opinio', idx)} className="absolute top-2 right-2 text-red-val hover:opacity-85 text-sm">&times;</button>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">ID</label>
                                        <input type="text" value={oj.oj_id} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.opinio_juris[idx].oj_id = e.target.value.toUpperCase();
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">Evidence Type</label>
                                        <select value={oj.evidence_type} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.opinio_juris[idx].evidence_type = e.target.value;
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary cursor-pointer">
                                          <option value="military_manual">Military Manual</option>
                                          <option value="judicial_statement">Judicial Statement</option>
                                          <option value="un_resolution">UN Resolution</option>
                                          <option value="treaty_preamble">Treaty Preamble</option>
                                          <option value="national_legislation">National Legislation</option>
                                          <option value="official_statement">Official Statement</option>
                                        </select>
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">Year</label>
                                        <input type="number" value={oj.year} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.opinio_juris[idx].year = parseInt(e.target.value) || 2020;
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5 mb-2">
                                      <label className="text-[0.6rem] font-bold text-text-muted uppercase">Description</label>
                                      <input type="text" value={oj.description} onChange={(e) => {
                                        const up = { ...editingNorm };
                                        up.opinio_juris[idx].description = e.target.value;
                                        setEditingNorm(up);
                                      }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <label className="text-[0.6rem] font-bold text-text-muted uppercase">Source IDs (comma separated)</label>
                                      <input type="text" value={oj.source_ids.join(', ')} onChange={(e) => {
                                        const up = { ...editingNorm };
                                        up.opinio_juris[idx].source_ids = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                        setEditingNorm(up);
                                      }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Citations */}
                            <div className="mt-4 border-t border-border-custom pt-3">
                              <div className="text-[0.7rem] font-bold uppercase tracking-wider text-text-muted mb-2 flex justify-between items-center">
                                Citations & Sources
                                <button type="button" onClick={addSourceField} className="text-primary text-[0.72rem] hover:underline cursor-pointer"><i className="fa-solid fa-plus"></i> Add Citation</button>
                              </div>
                              <div className="flex flex-col gap-3">
                                {editingNorm.sources.map((src, idx) => (
                                  <div key={idx} className="bg-bg-surface border border-border-custom p-4 rounded relative">
                                    <button type="button" onClick={() => removeNestedItem('source', idx)} className="absolute top-2 right-2 text-red-val hover:opacity-85 text-sm">&times;</button>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">ID</label>
                                        <input type="text" value={src.source_id} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.sources[idx].source_id = e.target.value.toUpperCase();
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">Type</label>
                                        <select value={src.type} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.sources[idx].type = e.target.value;
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary cursor-pointer">
                                          <option value="treaty">Treaty</option>
                                          <option value="icj_judgment">ICJ Judgment</option>
                                          <option value="icj_advisory">ICJ Advisory</option>
                                          <option value="icrc_rule">ICRC Rule</option>
                                          <option value="military_manual">Military Manual</option>
                                          <option value="un_resolution">UN Resolution</option>
                                          <option value="national_court">National Court</option>
                                          <option value="scholarly_article">Scholarly Article</option>
                                        </select>
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">Evid. Type</label>
                                        <select value={src.evidentiary_type} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.sources[idx].evidentiary_type = e.target.value;
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary cursor-pointer">
                                          <option value="practice">Practice only</option>
                                          <option value="juris">Opinio only</option>
                                          <option value="both">Both</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5 mb-2">
                                      <label className="text-[0.6rem] font-bold text-text-muted uppercase">Full Publication Title</label>
                                      <input type="text" value={src.title} onChange={(e) => {
                                        const up = { ...editingNorm };
                                        up.sources[idx].title = e.target.value;
                                        setEditingNorm(up);
                                      }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">URL</label>
                                        <input type="url" value={src.url || ''} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.sources[idx].url = e.target.value || null;
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <label className="text-[0.6rem] font-bold text-text-muted uppercase">Year</label>
                                        <input type="number" value={src.year || ''} onChange={(e) => {
                                          const up = { ...editingNorm };
                                          up.sources[idx].year = e.target.value ? parseInt(e.target.value) : null;
                                          setEditingNorm(up);
                                        }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <label className="text-[0.6rem] font-bold text-text-muted uppercase">Notes</label>
                                      <input type="text" value={src.notes || ''} onChange={(e) => {
                                        const up = { ...editingNorm };
                                        up.sources[idx].notes = e.target.value || '';
                                        setEditingNorm(up);
                                      }} className="p-1 text-xs border border-border-custom rounded bg-bg-input text-text-primary" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Save Actions */}
                            <div className="mt-6 border-t border-border-custom pt-4 flex gap-2 justify-end">
                              <button type="button" onClick={cancelEditor} className="bg-bg-input hover:bg-border-custom border border-border-custom text-text-secondary text-xs px-4 py-2 rounded-md cursor-pointer transition-colors">Cancel</button>
                              <button type="submit" className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-md cursor-pointer transition-colors flex items-center gap-1.5"><i className="fa-solid fa-cloud-arrow-up"></i> Save Regulation</button>
                            </div>

                          </form>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Subtab 2: Users */}
                  {adminTab === 'users' && (
                    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 animate-fadeIn">
                      
                      {/* Add user */}
                      <div className="bg-bg-surface-alt border border-border-custom rounded-md p-5 h-fit">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-4">Create Moderator Account</h4>
                        <form onSubmit={handleAddUser} className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.65rem] font-bold text-text-muted uppercase">Username</label>
                            <input type="text" name="username" required className="p-2 text-xs border border-border-custom rounded bg-bg-input text-text-primary focus:border-primary outline-none" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.65rem] font-bold text-text-muted uppercase">Password</label>
                            <input type="password" name="password" required className="p-2 text-xs border border-border-custom rounded bg-bg-input text-text-primary focus:border-primary outline-none" />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.65rem] font-bold text-text-muted uppercase">User Role</label>
                            <select name="role" className="p-2 text-xs border border-border-custom rounded bg-bg-input text-text-primary cursor-pointer outline-none">
                              <option value="moderator">Moderator</option>
                              <option value="admin">Administrator</option>
                            </select>
                          </div>
                          <button type="submit" className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold p-2 rounded-md mt-2 cursor-pointer shadow-xs transition-colors text-center">
                            Register Moderator
                          </button>
                        </form>
                      </div>

                      {/* Users table */}
                      <div className="bg-bg-surface-alt border border-border-custom rounded-md p-5">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-4">Authorized Accounts</h4>
                        <table className="w-full border-collapse text-xs text-left">
                          <thead>
                            <tr className="bg-bg-surface border-b-2 border-border-custom text-text-secondary">
                              <th className="p-2.5">Username</th>
                              <th className="p-2.5">Permissions Level</th>
                              <th className="p-2.5 text-right">Moderator Control</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersList.map(u => (
                              <tr key={u.username} className="border-b border-bg-app bg-bg-surface">
                                <td className="p-2.5"><i className="fa-solid fa-circle-user text-text-muted mr-2"></i> {u.username}</td>
                                <td className="p-2.5"><span className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded-full ${
                                  u.role === 'admin' ? 'bg-green-light text-green-val' : 'bg-primary-light text-primary'
                                }`}>{u.role.toUpperCase()}</span></td>
                                <td className="p-2.5 text-right">
                                  {u.username !== 'admin' ? (
                                    <button 
                                      onClick={() => handleDeleteUser(u.username)}
                                      className="text-red-val border border-red-val hover:bg-red-val hover:text-white text-[0.68rem] px-2 py-1 rounded cursor-pointer transition-colors"
                                    >
                                      Purge User
                                    </button>
                                  ) : (
                                    <span className="text-[0.7rem] text-text-muted italic">System Root</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  )}

                  {/* Subtab 3: Import/Export */}
                  {adminTab === 'import-export' && (
                    <div className="max-w-[500px] mx-auto bg-bg-surface-alt border border-border-custom rounded-md p-6 animate-fadeIn">
                      
                      <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-2">Export DB Archive</h4>
                      <p className="text-[0.72rem] text-text-muted leading-relaxed mb-4">
                        Download the complete raw JSON database file containing all 50 customary international laws, involved countries practice lists, and sources.
                      </p>
                      <a 
                        href="/api/data/export" 
                        download="norms_export.json"
                        className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2.5 rounded-md inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <i className="fa-solid fa-download"></i> Download norms_export.json
                      </a>

                      <hr className="border-0 border-t border-border-custom my-6" />

                      <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-2">Import DB Archive</h4>
                      <p className="text-[0.72rem] text-text-muted leading-relaxed mb-4">
                        Upload a norms JSON file to completely overwrite the current database. Warning: This replaces all records in data/norms.json.
                      </p>
                      <div className="flex flex-col gap-3">
                        <input 
                          type="file" 
                          accept=".json"
                          onChange={handleImportFile}
                          className="text-xs bg-bg-input border border-border-custom p-2 rounded cursor-pointer"
                        />
                        <span className="text-[0.68rem] text-text-muted">Ensure file is formatted exactly to the LexCustoms database schema reference template.</span>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* ── TOAST CONTAINER ── */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div 
            key={t.id}
            className={`px-5 py-3 rounded-md shadow-lg text-xs font-semibold flex items-center gap-2.5 border-l-4 transition-all duration-200 pointer-events-auto animate-slideIn bg-bg-surface text-text-primary border-border-custom ${
              t.type === 'success' ? 'border-l-green-val' : (t.type === 'error' ? 'border-l-red-val' : 'border-l-primary')
            }`}
          >
            <i className={`fa-solid ${
              t.type === 'success' ? 'fa-circle-check text-green-val' : (t.type === 'error' ? 'fa-circle-xmark text-red-val' : 'fa-circle-info text-primary')
            }`}></i>
            {t.message}
          </div>
        ))}
      </div>

      {/* ── CONFIRM DELETE DIALOG ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-bg-surface border border-border-custom rounded-lg shadow-xl max-w-[440px] w-full overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-border-custom flex justify-between items-center">
              <span className="font-bold text-sm text-text-primary">Delete Regulation</span>
              <button onClick={() => setConfirmDeleteId(null)} className="text-text-muted text-lg hover:text-text-primary cursor-pointer">&times;</button>
            </div>
            <div className="p-5 text-xs text-text-secondary leading-relaxed">
              Are you sure you want to delete <strong>{confirmDeleteId}</strong>?<br />
              This will permanently remove the customary law and all its logged practices and sources from the database.
            </div>
            <div className="p-4 border-t border-border-custom bg-bg-surface-alt flex justify-end gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="bg-bg-input hover:bg-border-custom border border-border-custom text-text-secondary px-3 py-1.5 rounded-md text-xs cursor-pointer transition-colors">Cancel</button>
              <button onClick={() => handleDeleteNorm(confirmDeleteId)} className="bg-red-val hover:bg-[#822718] text-white px-3 py-1.5 rounded-md text-xs cursor-pointer transition-colors">Permanently Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
