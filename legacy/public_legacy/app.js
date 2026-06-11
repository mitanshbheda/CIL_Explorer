// ── LEXCUSTOMS CLIENT APPLICATION LOGIC ──

let NORMS_DATA = [];
let COUNTRIES_DATA = [];
let ACTIVE_VIEW = 'explorer';
let ACTIVE_NORM_ID = null;
let SEARCH_TIMEOUT = null;
let MAP_INSTANCE = null;
let COUNTRY_MAP_INSTANCE = null;

// Domain labels and order
const DOMAIN_LABELS = {
  armed_conflict: "Laws of Armed Conflict / IHL",
  human_rights: "International Human Rights",
  state_responsibility: "State Responsibility",
  diplomatic_consular: "Diplomatic & Consular Relations",
  law_of_the_sea: "Law of the Sea",
  environment: "International Environmental Law",
  use_of_force: "Use of Force / Jus ad Bellum",
  jurisdiction_immunity: "Jurisdiction & Immunity"
};
const DOMAIN_ORDER = ["armed_conflict", "human_rights", "state_responsibility", "diplomatic_consular", "law_of_the_sea", "environment", "use_of_force", "jurisdiction_immunity"];

const SRC_TYPE_LABELS = {
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

// Static coordinate mappings for plotting states on Leaflet maps
const COUNTRY_COORDINATES = {
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
  "NATO": { lat: 50.8503, lng: 4.3517 }, // Brussels
  "Universal": { lat: 20.0, lng: 0.0 }  // Center of world
};

// Global filter state
let currentStatusFilter = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadAllData();
  
  // Theme Toggle Listener
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  
  // Check Admin Session on load
  checkAdminSession();
});

// ── GET DATA FROM SERVER ───────────────────────────────────────────────────────
function loadAllData() {
  fetch('/api/norms')
    .then(res => res.json())
    .then(data => {
      NORMS_DATA = data;
      applyFilters();
      if (ACTIVE_NORM_ID) renderDetail(ACTIVE_NORM_ID);
    })
    .catch(err => {
      showToast('Error loading norms database', 'error');
      console.error(err);
    });

  fetch('/api/countries')
    .then(res => res.json())
    .then(data => {
      COUNTRIES_DATA = data;
      renderCountryProfiles();
    })
    .catch(err => console.error('Error loading country data:', err));
}

// ── THEME MANAGER ─────────────────────────────────────────────────────────────
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#theme-toggle i');
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

// ── ROUTING & PANELS ──────────────────────────────────────────────────────────
function switchView(viewName) {
  ACTIVE_VIEW = viewName;
  
  // Update Tab States
  document.querySelectorAll('.nav-tab').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle visible panel
  document.querySelectorAll('.view-panel').forEach(panel => {
    if (panel.id === `view-${viewName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Dynamic Sidebar visibility based on View
  const sidebar = document.getElementById('app-sidebar');
  if (viewName === 'explorer') {
    sidebar.style.display = 'flex';
  } else {
    sidebar.style.display = 'none';
  }

  // Load stats if analytics view opened
  if (viewName === 'analytics') {
    loadAnalyticsDashboard();
  }
}

// ── SEARCH INDEXING & FILTER ENGINE (Relevance Weighted) ─────────────────────
function handleSearchInput() {
  // Clear previous log timeouts to prevent spamming server logs
  clearTimeout(SEARCH_TIMEOUT);
  
  applyFilters();

  const query = document.getElementById('global-search').value.trim();
  if (query.length > 2) {
    SEARCH_TIMEOUT = setTimeout(() => {
      const resultsCount = getFilteredCount();
      fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, resultsCount })
      }).catch(err => console.error(err));
    }, 1000);
  }
}

function getFilteredCount() {
  return applyFilterLogic(NORMS_DATA).length;
}

function toggleStatusFilter(statusVal, element) {
  currentStatusFilter = statusVal;
  element.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  element.classList.add('active');
  applyFilters();
}

function applyFilters() {
  const filtered = applyFilterLogic(NORMS_DATA);
  renderNormsList(filtered);
}

function applyFilterLogic(norms) {
  const searchQuery = document.getElementById('global-search').value.toLowerCase().trim();
  const domainFilter = document.getElementById('filter-domain').value;
  const regionFilter = document.getElementById('filter-region').value;
  const tradeBlocFilter = document.getElementById('filter-trade-bloc').value;

  return norms.map(norm => {
    let score = 0;
    
    // Weighted search scoring
    if (searchQuery) {
      const idMatch = norm.norm_id.toLowerCase().includes(searchQuery);
      const titleMatch = norm.title.toLowerCase().includes(searchQuery);
      const summaryMatch = (norm.summary || '').toLowerCase().includes(searchQuery);
      const codifMatch = (norm.primary_codification || '').toLowerCase().includes(searchQuery);

      if (norm.norm_id.toLowerCase() === searchQuery) score += 100;
      else if (idMatch) score += 40;

      if (norm.title.toLowerCase() === searchQuery) score += 80;
      else if (titleMatch) score += 30;

      if (codifMatch) score += 20;
      if (summaryMatch) score += 15;

      // Check state practices
      norm.state_practice.forEach(sp => {
        if (sp.description.toLowerCase().includes(searchQuery)) score += 5;
        sp.states_involved.forEach(st => {
          if (st.toLowerCase().includes(searchQuery)) score += 8;
        });
      });

      // Check opinions
      norm.opinio_juris.forEach(oj => {
        if (oj.description.toLowerCase().includes(searchQuery)) score += 5;
      });

      // Check sources
      norm.sources.forEach(src => {
        if (src.title.toLowerCase().includes(searchQuery)) score += 3;
      });
    }

    return { ...norm, searchScore: score };
  })
  .filter(norm => {
    // If query exists, score must be > 0
    if (searchQuery && norm.searchScore === 0) return false;
    
    // Domain Filter
    if (domainFilter && norm.domain !== domainFilter) return false;
    
    // Status Filter
    if (currentStatusFilter && norm.status !== currentStatusFilter) return false;

    // Region & Trade Bloc Filters (derived from involved states)
    if (regionFilter || tradeBlocFilter) {
      let matchedState = false;
      
      norm.state_practice.forEach(sp => {
        sp.states_involved.forEach(stateName => {
          const profile = COUNTRIES_DATA.find(c => c.name === stateName);
          if (profile) {
            const regionMatch = !regionFilter || profile.region === regionFilter;
            const tradeMatch = !tradeBlocFilter || profile.trade_bloc === tradeBlocFilter;
            if (regionMatch && tradeMatch) matchedState = true;
          }
        });
      });

      if (!matchedState) return false;
    }

    return true;
  })
  .sort((a, b) => {
    if (searchQuery) {
      return b.searchScore - a.searchScore; // Relevance sort
    }
    // Default alphabetical by ID
    return a.norm_id.localeCompare(b.norm_id);
  });
}

// ── RENDER NORMS LIST ──────────────────────────────────────────────────────────
function renderNormsList(filteredNorms) {
  const container = document.getElementById('sidebar-list');
  const countBadge = document.getElementById('list-count-badge');
  
  countBadge.innerHTML = `<i class="fa-solid fa-list-check"></i> ${filteredNorms.length} Regulations Found`;
  
  if (filteredNorms.length === 0) {
    container.innerHTML = `<div style="padding: 2rem 1rem; text-align:center; color:var(--text-muted); font-size:0.8rem;">
      <i class="fa-regular fa-folder-open" style="font-size: 1.8rem; margin-bottom: 0.5rem; display:block;"></i>
      No matching regulations found.
    </div>`;
    return;
  }

  container.innerHTML = filteredNorms.map(norm => {
    const isActive = norm.norm_id === ACTIVE_NORM_ID ? 'active' : '';
    return `
      <div class="list-item ${isActive}" onclick="selectNorm('${norm.norm_id}')">
        <span class="item-id">${norm.norm_id}</span>
        <div class="item-title">${escapeHtml(norm.title)}</div>
        <span class="pip pip-${norm.status}" title="${norm.status}"></span>
      </div>
    `;
  }).join('');
}

function selectNorm(id) {
  ACTIVE_NORM_ID = id;
  
  // Highlight in sidebar
  document.querySelectorAll('.list-item').forEach(item => {
    const itemId = item.querySelector('.item-id').textContent;
    if (itemId === id) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Track View Analytics
  fetch(`/api/analytics/view/${id}`, { method: 'POST' }).catch(err => console.log(err));

  renderDetail(id);
}

// ── RENDER DOCUMENT DETAIL (Serif Presentation) ────────────────────────────────
function renderDetail(id) {
  const norm = NORMS_DATA.find(n => n.norm_id === id);
  if (!norm) return;

  document.getElementById('explorer-welcome').style.display = 'none';
  const detail = document.getElementById('explorer-detail');
  detail.style.display = 'block';

  const statusLabel = norm.status.charAt(0).toUpperCase() + norm.status.slice(1);
  const isDisputed = norm.contested;

  // Compile timeline data chronologically
  const timelineEvents = [];
  norm.state_practice.forEach(sp => {
    timelineEvents.push({
      year: sp.year,
      title: sp.description,
      type: 'practice',
      meta: `States: ${sp.states_involved.join(', ')}`
    });
  });
  norm.opinio_juris.forEach(oj => {
    timelineEvents.push({
      year: oj.year,
      title: oj.description,
      type: 'juris',
      meta: `Evidence: ${oj.evidence_type.replace('_', ' ')}`
    });
  });
  timelineEvents.sort((a, b) => a.year - b.year);

  // Generate citation string
  const domainLabel = DOMAIN_LABELS[norm.domain];
  const currentYear = new Date().getFullYear();
  const citation = `LexCustoms Database, "${norm.title}" (Rule Reference: ${norm.norm_id}, Domain: ${domainLabel}), Customary International Law Reference Index (${currentYear}). Available at: http://localhost:3000/api/norms/${norm.norm_id}`;

  detail.innerHTML = `
    <div class="legal-header">
      <div class="legal-eyebrow">
        <span>REFERENCE INDEX CODE</span>
        <span>${escapeHtml(norm.norm_id)}</span>
      </div>
      <h3 class="legal-title">${escapeHtml(norm.title)}</h3>
      <div class="legal-badges">
        <span class="badge badge-${norm.status}">${statusLabel}</span>
        <span class="badge badge-domain">${domainLabel}</span>
        ${isDisputed ? `<span class="badge badge-disputed"><i class="fa-solid fa-triangle-exclamation"></i> Disputed Norm</span>` : ''}
      </div>
    </div>
    
    <div class="legal-body">
      <!-- Tabs Selector -->
      <div class="doc-tabs">
        <button class="doc-tab-btn active" onclick="switchDocTab(this, 'tab-summary')">Summary & Rule</button>
        <button class="doc-tab-btn" onclick="switchDocTab(this, 'tab-practice')">State Practice (${norm.state_practice.length})</button>
        <button class="doc-tab-btn" onclick="switchDocTab(this, 'tab-juris')">Opinio Juris (${norm.opinio_juris.length})</button>
        <button class="doc-tab-btn" onclick="switchDocTab(this, 'tab-sources')">Citations (${norm.sources.length})</button>
        <button class="doc-tab-btn" onclick="switchDocTab(this, 'tab-timeline')">Chronological Timeline</button>
        <button class="doc-tab-btn" onclick="switchDocTab(this, 'tab-map'); loadNormMap('${norm.norm_id}')">Geographical Plot</button>
      </div>

      <!-- Tab 1: Summary -->
      <div class="doc-panel active" id="tab-summary">
        <div class="legal-summary">
          ${escapeHtml(norm.summary || 'No summary statement compiled yet. Content moderation pending.')}
        </div>
        
        <div class="cite-container" style="margin-top: 1.5rem;">
          <div class="filter-group-title" style="margin-bottom:0.4rem;">HOW TO CITE THIS RECORD</div>
          <div class="cite-text" id="citation-value">${escapeHtml(citation)}</div>
          <button class="btn btn-secondary btn-sm" onclick="copyCitationText()" style="margin-top:0.75rem;">
            <i class="fa-solid fa-copy"></i> Copy Citation
          </button>
        </div>
        
        <p style="font-size:0.78rem; color:var(--text-muted); line-height: 1.5; margin-top: 1rem;">
          Primary Codification Reference: <strong>${escapeHtml(norm.primary_codification || 'Uncodified / Purely Customary')}</strong>
        </p>
      </div>

      <!-- Tab 2: State Practice -->
      <div class="doc-panel" id="tab-practice">
        <div class="sources-list">
          ${norm.state_practice.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No state practice entries logged.</p>' : 
            norm.state_practice.map(sp => `
              <div class="source-card">
                <div class="source-header">
                  <div class="source-title">${escapeHtml(sp.description)}</div>
                  <span class="source-type">${sp.year}</span>
                </div>
                <div class="evidence-meta">
                  <span><strong>Participating:</strong> ${sp.states_involved.join(', ')}</span>
                  <span><strong>Refs:</strong> ${sp.source_ids.join(', ')}</span>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>

      <!-- Tab 3: Opinio Juris -->
      <div class="doc-panel" id="tab-juris">
        <div class="evidence-list">
          ${norm.opinio_juris.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No opinio juris records logged.</p>' : 
            norm.opinio_juris.map(oj => `
              <div class="evidence-card">
                <p>${escapeHtml(oj.description)}</p>
                <div class="evidence-meta">
                  <span><strong>Evidence:</strong> ${oj.evidence_type.replace('_', ' ').toUpperCase()}</span>
                  <span><strong>Year:</strong> ${oj.year}</span>
                  <span><strong>Refs:</strong> ${oj.source_ids.join(', ')}</span>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>

      <!-- Tab 4: Sources -->
      <div class="doc-panel" id="tab-sources">
        <div class="sources-list">
          ${norm.sources.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No citations loaded.</p>' : 
            norm.sources.map(src => {
              const urlTag = src.url ? `<a href="${src.url}" target="_blank">${escapeHtml(src.title)} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.65rem;"></i></a>` : escapeHtml(src.title);
              return `
                <div class="source-card">
                  <div class="source-header">
                    <div class="source-title">${urlTag}</div>
                    <span class="source-type">${SRC_TYPE_LABELS[src.type] || src.type.replace('_', ' ')}</span>
                  </div>
                  <div class="evidence-meta">
                    <span><strong>Year:</strong> ${src.year || 'N/A'}</span>
                    <span><strong>ID:</strong> ${src.source_id}</span>
                    <span><strong>Proof Value:</strong> ${src.evidentiary_type.toUpperCase()}</span>
                  </div>
                  ${src.notes ? `<div class="source-notes">${escapeHtml(src.notes)}</div>` : ''}
                </div>
              `;
            }).join('')
          }
        </div>
      </div>

      <!-- Tab 5: Timeline -->
      <div class="doc-panel" id="tab-timeline">
        <div class="timeline">
          ${timelineEvents.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">No chronological events recorded.</p>' : 
            timelineEvents.map(ev => `
              <div class="timeline-event">
                <div class="timeline-year">${ev.year}</div>
                <div class="timeline-dot-wrapper">
                  <span class="timeline-dot timeline-dot-${ev.type}"></span>
                </div>
                <div class="timeline-content">
                  <div class="timeline-title">${escapeHtml(ev.title)}</div>
                  <div class="evidence-meta">${ev.meta}</div>
                </div>
              </div>
            `).join('')
          }
        </div>
      </div>

      <!-- Tab 6: Map -->
      <div class="doc-panel" id="tab-map">
        <div class="map-element" id="map-leaflet-container"></div>
        <div class="map-description">Interactive map plotting states contributing to the practice of this customary regulation. Click markers for details.</div>
      </div>
    </div>
  `;
}

function switchDocTab(btn, panelId) {
  const container = btn.closest('.legal-card');
  container.querySelectorAll('.doc-tab-btn').forEach(b => b.classList.remove('active'));
  container.querySelectorAll('.doc-panel').forEach(p => p.classList.remove('active'));
  
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}

function copyCitationText() {
  const text = document.getElementById('citation-value').textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Citation copied to clipboard', 'info');
  });
}

// ── LEAFLET MAP INTEGRATION ───────────────────────────────────────────────────
function loadNormMap(normId) {
  const norm = NORMS_DATA.find(n => n.norm_id === normId);
  if (!norm) return;

  // Lazy initialize map on tab render
  setTimeout(() => {
    if (MAP_INSTANCE) {
      MAP_INSTANCE.remove();
      MAP_INSTANCE = null;
    }

    const container = document.getElementById('map-leaflet-container');
    if (!container) return;

    // Collect all involved countries coordinates
    const markers = [];
    norm.state_practice.forEach(sp => {
      sp.states_involved.forEach(stateName => {
        const coords = COUNTRY_COORDINATES[stateName];
        if (coords) {
          markers.push({
            name: stateName,
            lat: coords.lat,
            lng: coords.lng,
            note: sp.description
          });
        }
      });
    });

    const hasMarkers = markers.length > 0;
    const center = hasMarkers ? [markers[0].lat, markers[0].lng] : [20.0, 0.0];
    const zoom = hasMarkers ? 3 : 1;

    MAP_INSTANCE = L.map('map-leaflet-container', { scrollWheelZoom: false }).setView(center, zoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
    }).addTo(MAP_INSTANCE);

    // Track unique locations to avoid piling markers at the same coordinate
    const plottedCoords = {};
    markers.forEach(m => {
      const coordKey = `${m.lat.toFixed(3)},${m.lng.toFixed(3)}`;
      if (plottedCoords[coordKey]) {
        // Append note to existing popup info
        plottedCoords[coordKey].bindPopup(`${plottedCoords[coordKey].getPopup().getContent()}<hr style="margin:4px 0; border:0; border-top:1px solid #ccc;">${m.note}`);
      } else {
        const marker = L.marker([m.lat, m.lng]).addTo(MAP_INSTANCE);
        marker.bindPopup(`<strong style="font-size:0.8rem;">${m.name}</strong><br><span style="font-size:0.75rem; color:#555;">${m.note}</span>`);
        plottedCoords[coordKey] = marker;
      }
    });

    // Invalidate size to ensure it renders correctly (fixes Leaflet gray box bug)
    MAP_INSTANCE.invalidateSize();
  }, 100);
}

// ── COUNTRY PROFILES DIRECTORY ────────────────────────────────────────────────
function renderCountryProfiles() {
  const grid = document.getElementById('country-profiles-grid');
  if (COUNTRIES_DATA.length === 0) {
    grid.innerHTML = '<p>No country profiles database populated.</p>';
    return;
  }

  grid.innerHTML = COUNTRIES_DATA.map(c => `
    <div class="country-card" onclick="selectCountryProfile('${c.name}')">
      <div class="country-name">${escapeHtml(c.name)}</div>
      <div class="country-meta-item">
        <span class="country-meta-label">Region</span>
        <span>${c.region}</span>
      </div>
      <div class="country-meta-item">
        <span class="country-meta-label">Trade Bloc</span>
        <span>${c.trade_bloc}</span>
      </div>
      <div class="country-meta-item">
        <span class="country-meta-label">Customs Authority</span>
        <span style="max-width: 140px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${c.authority}</span>
      </div>
      <div class="country-badge-row">
        <span class="badge badge-domain">${c.practice_count} Practices</span>
        <span class="badge badge-established">${c.domain_count} Domains</span>
      </div>
    </div>
  `).join('');
}

function selectCountryProfile(name) {
  const profile = COUNTRIES_DATA.find(c => c.name === name);
  if (!profile) return;

  document.getElementById('country-directory').style.display = 'none';
  const detail = document.getElementById('country-profile-detail');
  detail.style.display = 'block';

  detail.innerHTML = `
    <div class="country-profile-header">
      <div>
        <h3 class="country-profile-title">${escapeHtml(profile.name)}</h3>
        <p style="color:var(--text-muted); font-size:0.8rem; margin-top:0.25rem;">Customs & Customary Law Profile Dashboard</p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="closeCountryProfile()"><i class="fa-solid fa-arrow-left"></i> Directory</button>
    </div>

    <div class="country-details-block">
      <div class="country-details-item">
        <span class="country-details-label">Region</span>
        <span class="country-details-value">${profile.region}</span>
      </div>
      <div class="country-details-item">
        <span class="country-details-label">Trade Bloc Affiliate</span>
        <span class="country-details-value">${profile.trade_bloc}</span>
      </div>
      <div class="country-details-item">
        <span class="country-details-label">Customs Authority</span>
        <span class="country-details-value">${profile.authority}</span>
      </div>
      <div class="country-details-item">
        <span class="country-details-label">Regulatory Scope</span>
        <span class="country-details-value">${profile.industry}</span>
      </div>
    </div>

    <div class="analytics-chart-row" style="margin-top: 1.5rem;">
      <div class="chart-container-card" style="height: 380px;">
        <div class="chart-title">Geographic Focus Map</div>
        <div class="map-element" id="country-leaflet-container" style="height:280px;"></div>
      </div>

      <div class="chart-container-card" style="height: 380px; overflow-y: auto;">
        <div class="chart-title">Regulatory Linkages (${profile.norms.length} Rules)</div>
        <table class="analytics-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Norm/Regulation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${profile.norms.map(n => `
              <tr style="cursor:pointer;" onclick="switchView('explorer'); selectNorm('${n.norm_id}')">
                <td><span class="item-id">${n.norm_id}</span></td>
                <td>${escapeHtml(n.title)}</td>
                <td><span class="pip pip-${n.status}"></span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Plot country coordinate marker
  setTimeout(() => {
    if (COUNTRY_MAP_INSTANCE) {
      COUNTRY_MAP_INSTANCE.remove();
      COUNTRY_MAP_INSTANCE = null;
    }
    const coords = COUNTRY_COORDINATES[profile.name] || { lat: 20.0, lng: 0.0 };
    COUNTRY_MAP_INSTANCE = L.map('country-leaflet-container', { scrollWheelZoom: false }).setView([coords.lat, coords.lng], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(COUNTRY_MAP_INSTANCE);
    L.marker([coords.lat, coords.lng]).addTo(COUNTRY_MAP_INSTANCE)
      .bindPopup(`<strong>${profile.name}</strong><br>${profile.authority}`)
      .openPopup();
    
    COUNTRY_MAP_INSTANCE.invalidateSize();
  }, 100);
}

function closeCountryProfile() {
  document.getElementById('country-profile-detail').style.display = 'none';
  document.getElementById('country-directory').style.display = 'block';
}

// ── ANALYTICS HUB DASHBOARD ────────────────────────────────────────────────────
function loadAnalyticsDashboard() {
  fetch('/api/analytics')
    .then(res => res.json())
    .then(data => {
      // Map Metrics
      document.getElementById('stat-total-norms').textContent = data.metrics.totalNorms;
      document.getElementById('stat-total-practices').textContent = data.metrics.totalPractices;
      document.getElementById('stat-total-sources').textContent = data.metrics.totalSources;
      
      const contestedPct = ((data.metrics.disputedCount / data.metrics.totalNorms) * 100).toFixed(0);
      document.getElementById('stat-contested-pct').textContent = `${contestedPct}%`;

      // Render Domain Distribution Bar Chart
      const domainContainer = document.getElementById('chart-domain-dist');
      const maxDomain = Math.max(...Object.values(data.domain_distribution));
      domainContainer.innerHTML = Object.entries(data.domain_distribution).map(([domain, count]) => {
        const pct = (count / maxDomain) * 100;
        return `
          <div class="bar-chart-row">
            <div class="bar-chart-label" title="${DOMAIN_LABELS[domain]}">${DOMAIN_LABELS[domain]}</div>
            <div class="bar-chart-bar-wrapper">
              <div class="bar-chart-fill" style="width: ${pct}%; background-color: var(--accent);"></div>
            </div>
            <div class="bar-chart-value">${count}</div>
          </div>
        `;
      }).join('');

      // Render Status Distribution Bar Chart
      const statusContainer = document.getElementById('chart-status-dist');
      const statusCounts = [
        { label: 'Established', val: data.metrics.establishedCount, color: 'var(--green)' },
        { label: 'Emerging', val: data.metrics.emergingCount, color: 'var(--gold)' },
        { label: 'Contested', val: data.metrics.contestedCount, color: 'var(--red)' }
      ];
      const maxStatus = Math.max(...statusCounts.map(s => s.val));
      statusContainer.innerHTML = statusCounts.map(s => {
        const pct = (s.val / maxStatus) * 100;
        return `
          <div class="bar-chart-row">
            <div class="bar-chart-label">${s.label}</div>
            <div class="bar-chart-bar-wrapper">
              <div class="bar-chart-fill" style="width: ${pct}%; background-color: ${s.color};"></div>
            </div>
            <div class="bar-chart-value">${s.val}</div>
          </div>
        `;
      }).join('');

      // Most Viewed Table
      const viewTable = document.getElementById('table-most-viewed');
      if (data.mostViewed.length === 0) {
        viewTable.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No logs logged yet. Close and open documents to gather views.</td></tr>';
      } else {
        viewTable.innerHTML = data.mostViewed.map(item => `
          <tr style="cursor:pointer;" onclick="switchView('explorer'); selectNorm('${item.norm_id}')">
            <td><span class="item-id">${item.norm_id}</span></td>
            <td>${escapeHtml(item.title)}</td>
            <td>${DOMAIN_LABELS[item.domain] || item.domain}</td>
            <td style="text-align:right; font-weight:600;">${item.views} views</td>
          </tr>
        `).join('');
      }

      // Top Searches Table
      const searchTable = document.getElementById('table-top-searches');
      if (data.topSearches.length === 0) {
        searchTable.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--text-muted);">No queries logged yet.</td></tr>';
      } else {
        searchTable.innerHTML = data.topSearches.map(item => `
          <tr>
            <td><i class="fa-solid fa-clock-rotate-left" style="color:var(--text-muted); margin-right: 0.5rem;"></i> "${escapeHtml(item.keyword)}"</td>
            <td style="text-align:right; font-weight:600;">${item.count} searches</td>
          </tr>
        `).join('');
      }
    });
}

// ── TOAST MESSENGER ────────────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'circle-check' : (type === 'error' ? 'circle-xmark' : 'circle-info');
  toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> ${message}`;
  
  container.appendChild(toast);
  
  // Slide out after 2.8s
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.2s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 2800);
}

// ── UTILS ──────────────────────────────────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
