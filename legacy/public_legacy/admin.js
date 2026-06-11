// ── LEXCUSTOMS ADMIN DASHBOARD LOGIC ──

let LOGGED_IN_USER = null;
let EDITING_NORM_ID = null;

// Check if admin is authenticated
function checkAdminSession() {
  fetch('/api/auth/session')
    .then(res => res.json())
    .then(data => {
      const loginPanel = document.getElementById('admin-login-panel');
      const dashPanel = document.getElementById('admin-dashboard-panel');
      const sessionIndicator = document.getElementById('session-indicator');

      if (data.loggedIn) {
        LOGGED_IN_USER = data.user;
        loginPanel.style.display = 'none';
        dashPanel.style.display = 'block';
        sessionIndicator.style.display = 'block';
        document.getElementById('session-username').textContent = `${data.user.username} (${data.user.role})`;
        
        loadAdminNormsList();
        loadUserAccounts();
      } else {
        LOGGED_IN_USER = null;
        loginPanel.style.display = 'block';
        dashPanel.style.display = 'none';
        sessionIndicator.style.display = 'none';
      }
    });
}

// Login Handler
function handleAdminLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-user').value;
  const password = document.getElementById('login-pass').value;
  const errorMsg = document.getElementById('login-error-msg');

  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => {
    if (!res.ok) throw new Error('Authentication failed');
    return res.json();
  })
  .then(data => {
    errorMsg.style.display = 'none';
    showToast('Authenticated successfully', 'success');
    
    // Clear login form inputs
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';

    checkAdminSession();
  })
  .catch(err => {
    errorMsg.style.display = 'block';
    errorMsg.textContent = 'Invalid username or password.';
    showToast('Failed to authenticate', 'error');
  });
}

// Logout Handler
function logoutAdmin() {
  fetch('/api/auth/logout', { method: 'POST' })
    .then(() => {
      showToast('Logged out of session', 'info');
      checkAdminSession();
      switchView('explorer');
    });
}

// Switch Admin panel sub-tabs
function switchAdminTab(tabName, btn) {
  btn.parentElement.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.admin-tab-content').forEach(p => p.style.display = 'none');
  document.getElementById(`admin-tab-${tabName}`).style.display = 'block';
}

// ── EDITOR LIST & SELECTION ──
function loadAdminNormsList() {
  fetch('/api/norms')
    .then(res => res.json())
    .then(norms => {
      const container = document.getElementById('admin-norms-list');
      norms.sort((a,b) => a.norm_id.localeCompare(b.norm_id));
      
      container.innerHTML = norms.map(norm => `
        <div class="list-item ${EDITING_NORM_ID === norm.norm_id ? 'active' : ''}" onclick="selectAdminNorm('${norm.norm_id}')" style="font-size:0.78rem;">
          <span class="item-id">${norm.norm_id}</span>
          <div class="item-title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(norm.title)}</div>
          <span class="pip pip-${norm.status}"></span>
        </div>
      `).join('');
    });
}

function selectAdminNorm(id) {
  EDITING_NORM_ID = id;
  loadAdminNormsList();

  const norm = NORMS_DATA.find(n => n.norm_id === id);
  if (!norm) return;

  renderEditorForm(norm);
}

// Renders the fully populated editor form
function renderEditorForm(norm, isNew = false) {
  const panel = document.getElementById('admin-editor-form-panel');
  const titleText = isNew ? 'Create New Customary Law/Regulation' : `Edit Regulation ${norm.norm_id}`;

  panel.innerHTML = `
    <div class="admin-section-header">
      <span class="admin-section-title">${titleText}</span>
      ${!isNew ? `<button class="btn btn-danger btn-sm" onclick="deleteNormPrompt('${norm.norm_id}', '${escapeHtml(norm.title)}')">
        <i class="fa-solid fa-trash-can"></i> Delete Regulation
      </button>` : ''}
    </div>

    <form onsubmit="saveNormForm(event, '${norm.norm_id}', ${isNew})">
      <!-- Row 1: ID & Domain -->
      <div class="form-row-2">
        <div class="form-group">
          <label>Regulation / Norm ID</label>
          <input type="text" id="ed-norm-id" value="${norm.norm_id || ''}" placeholder="e.g. IHL-01" required ${!isNew ? 'readonly' : ''}>
        </div>
        <div class="form-group">
          <label>Regulation Domain</label>
          <select id="ed-domain">
            <option value="armed_conflict" ${norm.domain === 'armed_conflict' ? 'selected' : ''}>Laws of Armed Conflict / IHL</option>
            <option value="human_rights" ${norm.domain === 'human_rights' ? 'selected' : ''}>International Human Rights</option>
            <option value="state_responsibility" ${norm.domain === 'state_responsibility' ? 'selected' : ''}>State Responsibility</option>
            <option value="diplomatic_consular" ${norm.domain === 'diplomatic_consular' ? 'selected' : ''}>Diplomatic & Consular</option>
            <option value="law_of_the_sea" ${norm.domain === 'law_of_the_sea' ? 'selected' : ''}>Law of the Sea</option>
            <option value="environment" ${norm.domain === 'environment' ? 'selected' : ''}>Environmental Law</option>
            <option value="use_of_force" ${norm.domain === 'use_of_force' ? 'selected' : ''}>Use of Force</option>
            <option value="jurisdiction_immunity" ${norm.domain === 'jurisdiction_immunity' ? 'selected' : ''}>Jurisdiction & Immunity</option>
          </select>
        </div>
      </div>

      <!-- Title -->
      <div class="form-group">
        <label>Regulation / Law Title (Plain-English Rule Statement)</label>
        <input type="text" id="ed-title" value="${escapeHtml(norm.title || '')}" placeholder="Short rule statement" required>
      </div>

      <!-- Row 2: Status & Codification -->
      <div class="form-row-2">
        <div class="form-group">
          <label>Legal Status</label>
          <select id="ed-status">
            <option value="established" ${norm.status === 'established' ? 'selected' : ''}>Established</option>
            <option value="emerging" ${norm.status === 'emerging' ? 'selected' : ''}>Emerging</option>
            <option value="contested" ${norm.status === 'contested' ? 'selected' : ''}>Contested</option>
          </select>
        </div>
        <div class="form-group">
          <label>Primary Codification (Treaty / Case Citation)</label>
          <input type="text" id="ed-codification" value="${escapeHtml(norm.primary_codification || '')}" placeholder="e.g. ICRC Rule 1; AP I Art. 48">
        </div>
      </div>

      <!-- Contested Flag -->
      <div class="form-group" style="flex-direction:row; align-items:center; gap:0.5rem; margin-bottom: 1.25rem;">
        <input type="checkbox" id="ed-contested" ${norm.contested ? 'checked' : ''} style="width:auto; margin-top:2px;">
        <label for="ed-contested" style="cursor:pointer; text-transform:none;">Mark this regulation as disputed (has significant state dissent)</label>
      </div>

      <!-- Summary Statement -->
      <div class="form-group">
        <label>Comprehensive Summary (evidence of state practice, opinion juris, and disputes)</label>
        <textarea id="ed-summary" rows="5" required placeholder="Write a detailed summary of the customary rule...">${escapeHtml(norm.summary || '')}</textarea>
      </div>

      <!-- NESTED SECTION 1: STATE PRACTICE -->
      <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <div class="filter-group-title" style="font-size:0.75rem;">State Practice records <i class="fa-solid fa-earth-americas"></i></div>
        <div class="nested-list-editor" id="ed-practice-container">
          <!-- Dyn list -->
        </div>
        <button class="btn btn-secondary btn-sm" type="button" onclick="addPracticeField()" style="margin-top:0.5rem;">
          <i class="fa-solid fa-plus"></i> Add Practice Record
        </button>
      </div>

      <!-- NESTED SECTION 2: OPINIO JURIS -->
      <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <div class="filter-group-title" style="font-size:0.75rem;">Opinio Juris evidence <i class="fa-solid fa-gavel"></i></div>
        <div class="nested-list-editor" id="ed-opinio-container">
          <!-- Dyn list -->
        </div>
        <button class="btn btn-secondary btn-sm" type="button" onclick="addOpinioField()" style="margin-top:0.5rem;">
          <i class="fa-solid fa-plus"></i> Add Opinio Juris Record
        </button>
      </div>

      <!-- NESTED SECTION 3: SOURCES -->
      <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
        <div class="filter-group-title" style="font-size:0.75rem;">Source Citations & Documents <i class="fa-solid fa-book-bookmark"></i></div>
        <div class="nested-list-editor" id="ed-sources-container">
          <!-- Dyn list -->
        </div>
        <button class="btn btn-secondary btn-sm" type="button" onclick="addSourceField()" style="margin-top:0.5rem;">
          <i class="fa-solid fa-plus"></i> Add Source Citation
        </button>
      </div>

      <!-- Save Actions -->
      <div style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.25rem; display:flex; gap:0.5rem; justify-content:flex-end;">
        <button class="btn btn-secondary" type="button" onclick="cancelEditor()">Cancel</button>
        <button class="btn btn-success" type="submit"><i class="fa-solid fa-cloud-arrow-up"></i> Save Regulation</button>
      </div>
    </form>
  `;

  // Render nested entries
  if (norm.state_practice) norm.state_practice.forEach(sp => addPracticeField(sp));
  if (norm.opinio_juris) norm.opinio_juris.forEach(oj => addOpinioField(oj));
  if (norm.sources) norm.sources.forEach(src => addSourceField(src));
}

function createNewNormForm() {
  EDITING_NORM_ID = null;
  loadAdminNormsList();

  const template = {
    norm_id: '',
    title: '',
    domain: 'armed_conflict',
    status: 'established',
    primary_codification: '',
    contested: false,
    summary: '',
    state_practice: [],
    opinio_juris: [],
    sources: []
  };

  renderEditorForm(template, true);
}

function cancelEditor() {
  const panel = document.getElementById('admin-editor-form-panel');
  EDITING_NORM_ID = null;
  loadAdminNormsList();
  
  panel.innerHTML = `
    <div class="welcome-screen" style="margin: 4rem auto;">
      <i class="fa-solid fa-edit" style="font-size: 2.5rem; color: var(--text-muted);"></i>
      <h3>Select a Regulation to Edit</h3>
      <p>Choose a regulation from the column to the left, or create a brand new one to add to the database.</p>
    </div>
  `;
}

// ── DYNAMIC SUBFORMS GENERATOR ──
function addPracticeField(data = {}) {
  const container = document.getElementById('ed-practice-container');
  const index = container.children.length;
  
  const div = document.createElement('div');
  div.className = 'nested-item-form';
  div.id = `practice-item-${index}`;
  div.innerHTML = `
    <button class="remove-nested-btn" type="button" onclick="removeNestedItem('practice-item-${index}')">&times;</button>
    <div class="form-row-2">
      <div class="form-group">
        <label>Practice ID</label>
        <input type="text" class="sp-id" value="${data.practice_id || 'SP-' + Math.random().toString(36).substr(2, 5).toUpperCase()}" required>
      </div>
      <div class="form-group">
        <label>Year</label>
        <input type="number" class="sp-year" value="${data.year || 2020}" required>
      </div>
    </div>
    <div class="form-group">
      <label>Act/Practice Description</label>
      <input type="text" class="sp-desc" value="${escapeHtml(data.description || '')}" placeholder="Describe the physical state action..." required>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label>States Involved (comma separated)</label>
        <input type="text" class="sp-states" value="${(data.states_involved || []).join(', ')}" placeholder="e.g. United States, United Kingdom" required>
      </div>
      <div class="form-group">
        <label>Linked Source IDs (comma separated)</label>
        <input type="text" class="sp-src-ids" value="${(data.source_ids || []).join(', ')}" placeholder="e.g. SRC-01, SRC-02">
      </div>
    </div>
  `;
  container.appendChild(div);
}

function addOpinioField(data = {}) {
  const container = document.getElementById('ed-opinio-container');
  const index = container.children.length;
  
  const div = document.createElement('div');
  div.className = 'nested-item-form';
  div.id = `opinio-item-${index}`;
  div.innerHTML = `
    <button class="remove-nested-btn" type="button" onclick="removeNestedItem('opinio-item-${index}')">&times;</button>
    <div class="form-row-3">
      <div class="form-group">
        <label>Opinio Juris ID</label>
        <input type="text" class="oj-id" value="${data.oj_id || 'OJ-' + Math.random().toString(36).substr(2, 5).toUpperCase()}" required>
      </div>
      <div class="form-group">
        <label>Evidence Type</label>
        <select class="oj-evid-type">
          <option value="un_resolution" ${data.evidence_type === 'un_resolution' ? 'selected' : ''}>UN Resolution</option>
          <option value="treaty_preamble" ${data.evidence_type === 'treaty_preamble' ? 'selected' : ''}>Treaty Preamble</option>
          <option value="national_legislation" ${data.evidence_type === 'national_legislation' ? 'selected' : ''}>National Legislation</option>
          <option value="judicial_statement" ${data.evidence_type === 'judicial_statement' ? 'selected' : ''}>Judicial Statement</option>
          <option value="official_statement" ${data.evidence_type === 'official_statement' ? 'selected' : ''}>Official Statement</option>
          <option value="military_manual" ${data.evidence_type === 'military_manual' ? 'selected' : ''}>Military Manual</option>
        </select>
      </div>
      <div class="form-group">
        <label>Year</label>
        <input type="number" class="oj-year" value="${data.year || 2020}" required>
      </div>
    </div>
    <div class="form-group">
      <label>Belief Description</label>
      <input type="text" class="oj-desc" value="${escapeHtml(data.description || '')}" placeholder="Describe the opinio juris belief demonstration..." required>
    </div>
    <div class="form-group">
      <label>Linked Source IDs (comma separated)</label>
      <input type="text" class="oj-src-ids" value="${(data.source_ids || []).join(', ')}" placeholder="e.g. SRC-01">
    </div>
  `;
  container.appendChild(div);
}

function addSourceField(data = {}) {
  const container = document.getElementById('ed-sources-container');
  const index = container.children.length;
  
  const div = document.createElement('div');
  div.className = 'nested-item-form';
  div.id = `source-item-${index}`;
  div.innerHTML = `
    <button class="remove-nested-btn" type="button" onclick="removeNestedItem('source-item-${index}')">&times;</button>
    <div class="form-row-3">
      <div class="form-group">
        <label>Source ID</label>
        <input type="text" class="src-id" value="${data.source_id || 'SRC-' + Math.random().toString(36).substr(2, 5).toUpperCase()}" required>
      </div>
      <div class="form-group">
        <label>Source Type</label>
        <select class="src-type">
          <option value="treaty" ${data.type === 'treaty' ? 'selected' : ''}>Treaty / Convention</option>
          <option value="icj_judgment" ${data.type === 'icj_judgment' ? 'selected' : ''}>ICJ Judgment</option>
          <option value="icj_advisory" ${data.type === 'icj_advisory' ? 'selected' : ''}>ICJ Advisory Opinion</option>
          <option value="icrc_rule" ${data.type === 'icrc_rule' ? 'selected' : ''}>ICRC Rule</option>
          <option value="military_manual" ${data.type === 'military_manual' ? 'selected' : ''}>Military Manual</option>
          <option value="un_resolution" ${data.type === 'un_resolution' ? 'selected' : ''}>UN Resolution</option>
          <option value="national_court" ${data.type === 'national_court' ? 'selected' : ''}>National Court Decision</option>
          <option value="scholarly_article" ${data.type === 'scholarly_article' ? 'selected' : ''}>Scholarly Article</option>
        </select>
      </div>
      <div class="form-group">
        <label>Evidentiary Proof Value</label>
        <select class="src-evid-type">
          <option value="practice" ${data.evidentiary_type === 'practice' ? 'selected' : ''}>State Practice only</option>
          <option value="juris" ${data.evidentiary_type === 'juris' ? 'selected' : ''}>Opinio Juris only</option>
          <option value="both" ${data.evidentiary_type === 'both' ? 'selected' : ''}>Both simultaneous</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Full Citation Title</label>
      <input type="text" class="src-title" value="${escapeHtml(data.title || '')}" placeholder="Full publication title citation..." required>
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label>Reference URL</label>
        <input type="url" class="src-url" value="${data.url || ''}" placeholder="http://...">
      </div>
      <div class="form-group">
        <label>Publication Year</label>
        <input type="number" class="src-year" value="${data.year || ''}" placeholder="2020">
      </div>
    </div>
    <div class="form-group">
      <label>Evidentiary Notes</label>
      <input type="text" class="src-notes" value="${escapeHtml(data.notes || '')}" placeholder="Minority views or dispute flag notes...">
    </div>
  `;
  container.appendChild(div);
}

function removeNestedItem(itemId) {
  document.getElementById(itemId).remove();
}

// ── SAVE FORM SUBMISSION ──
function saveNormForm(e, originalId, isNew) {
  e.preventDefault();

  const id = document.getElementById('ed-norm-id').value.toUpperCase().trim();
  const title = document.getElementById('ed-title').value.trim();
  const domain = document.getElementById('ed-domain').value;
  const status = document.getElementById('ed-status').value;
  const codification = document.getElementById('ed-codification').value.trim();
  const contested = document.getElementById('ed-contested').checked;
  const summary = document.getElementById('ed-summary').value.trim();

  // Collate State Practice
  const state_practice = [];
  document.querySelectorAll('#ed-practice-container .nested-item-form').forEach(el => {
    state_practice.push({
      practice_id: el.querySelector('.sp-id').value.toUpperCase().trim(),
      year: parseInt(el.querySelector('.sp-year').value, 10) || 2020,
      description: el.querySelector('.sp-desc').value.trim(),
      states_involved: el.querySelector('.sp-states').value.split(',').map(s => s.trim()).filter(Boolean),
      source_ids: el.querySelector('.sp-src-ids').value.split(',').map(s => s.trim()).filter(Boolean)
    });
  });

  // Collate Opinio Juris
  const opinio_juris = [];
  document.querySelectorAll('#ed-opinio-container .nested-item-form').forEach(el => {
    opinio_juris.push({
      oj_id: el.querySelector('.oj-id').value.toUpperCase().trim(),
      evidence_type: el.querySelector('.oj-evid-type').value,
      year: parseInt(el.querySelector('.oj-year').value, 10) || 2020,
      description: el.querySelector('.oj-desc').value.trim(),
      source_ids: el.querySelector('.oj-src-ids').value.split(',').map(s => s.trim()).filter(Boolean)
    });
  });

  // Collate Sources
  const sources = [];
  document.querySelectorAll('#ed-sources-container .nested-item-form').forEach(el => {
    const yr = el.querySelector('.src-year').value;
    sources.push({
      source_id: el.querySelector('.src-id').value.toUpperCase().trim(),
      type: el.querySelector('.src-type').value,
      title: el.querySelector('.src-title').value.trim(),
      url: el.querySelector('.src-url').value.trim() || null,
      year: yr ? parseInt(yr, 10) : null,
      evidentiary_type: el.querySelector('.src-evid-type').value,
      notes: el.querySelector('.src-notes').value.trim() || ""
    });
  });

  const payload = {
    norm_id: id,
    title,
    domain,
    status,
    primary_codification: codification,
    contested,
    summary,
    state_practice,
    opinio_juris,
    sources
  };

  const url = isNew ? '/api/norms' : `/api/norms/${originalId}`;
  const method = isNew ? 'POST' : 'PUT';

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to save regulation');
    return res.json();
  })
  .then(saved => {
    showToast(`Regulation ${saved.norm_id} saved successfully`, 'success');
    EDITING_NORM_ID = saved.norm_id;
    loadAllData(); // Reload main explorer cache
    loadAdminNormsList();
    selectAdminNorm(saved.norm_id);
  })
  .catch(err => {
    showToast('Error saving regulation details', 'error');
    console.error(err);
  });
}

// ── DELETE REGULATION ──
function deleteNormPrompt(id, title) {
  document.getElementById('delete-norm-label').textContent = `${id} — ${title}`;
  openModal('confirm-delete-modal');
  
  // Attach confirm trigger
  document.getElementById('confirm-delete-btn').onclick = () => {
    deleteNorm(id);
  };
}

function deleteNorm(id) {
  fetch(`/api/norms/${id}`, { method: 'DELETE' })
    .then(res => {
      if (!res.ok) throw new Error('Failed to delete regulation');
      closeModal('confirm-delete-modal');
      showToast(`Regulation ${id} deleted`, 'success');
      cancelEditor();
      loadAllData();
    })
    .catch(err => {
      showToast('Error deleting regulation', 'error');
      console.error(err);
    });
}

// ── USER MANAGEMENT CRUD ──
function loadUserAccounts() {
  if (!LOGGED_IN_USER) return;
  fetch('/api/users')
    .then(res => res.json())
    .then(users => {
      const tbody = document.getElementById('table-user-accounts');
      tbody.innerHTML = users.map(u => `
        <tr>
          <td><i class="fa-solid fa-circle-user" style="color:var(--text-muted); margin-right:0.5rem;"></i> ${u.username}</td>
          <td><span class="badge ${u.role === 'admin' ? 'badge-established' : 'badge-domain'}">${u.role.toUpperCase()}</span></td>
          <td style="text-align:right;">
            ${u.username.toLowerCase() !== 'admin' ? `
              <button class="btn btn-danger btn-sm" onclick="deleteUserAccount('${u.username}')" style="padding:0.2rem 0.5rem;">
                <i class="fa-solid fa-user-minus"></i> Remove
              </button>
            ` : '<span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Master Admin</span>'}
          </td>
        </tr>
      `).join('');
    });
}

function handleAddUser(e) {
  e.preventDefault();
  const username = document.getElementById('new-user-name').value.trim();
  const password = document.getElementById('new-user-pass').value;
  const role = document.getElementById('new-user-role').value;
  const errorDiv = document.getElementById('user-create-error');

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
    errorDiv.style.display = 'none';
    showToast(`User ${username} created`, 'success');
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-pass').value = '';
    loadUserAccounts();
  })
  .catch(err => {
    errorDiv.style.display = 'block';
    errorDiv.textContent = err.message || 'Failed to create user.';
  });
}

function deleteUserAccount(username) {
  if (confirm(`Remove user account "${username}"?`)) {
    fetch(`/api/users/${username}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete user');
        showToast(`User account ${username} deleted`, 'success');
        loadUserAccounts();
      })
      .catch(err => console.error(err));
  }
}

// ── IMPORT DATABASE OVERWRITE ──
function handleImportJSON() {
  const fileInput = document.getElementById('import-json-file');
  const statusMsg = document.getElementById('import-status-msg');

  if (fileInput.files.length === 0) {
    statusMsg.style.color = 'var(--red)';
    statusMsg.textContent = 'Please choose a valid norms JSON file first.';
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importedData)
      })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.error); });
        return res.json();
      })
      .then(data => {
        statusMsg.style.color = 'var(--green)';
        statusMsg.textContent = `Success! Imported ${data.count} regulations. Cache reloaded.`;
        showToast('Database overwritten successfully', 'success');
        fileInput.value = '';
        loadAllData();
        loadAdminNormsList();
        cancelEditor();
      })
      .catch(err => {
        statusMsg.style.color = 'var(--red)';
        statusMsg.textContent = err.message || 'Import rejected by server.';
      });

    } catch (err) {
      statusMsg.style.color = 'var(--red)';
      statusMsg.textContent = 'Failed to parse file. Ensure it is a valid JSON schema.';
    }
  };

  reader.readAsText(file);
}
