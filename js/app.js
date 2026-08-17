// ============================================================
// app.js — Bootstrap, router, access control & PWA
// ============================================================

let currentPage = 'dashboard';

// ---- Access Control ----

let currentUserEmail = null;
let userRole = 'owner'; // 'owner' | 'readonly'

function detectUserRole(email) {
  const ro = APP_CONFIG.READ_ONLY_EMAILS || [];
  const ow = APP_CONFIG.OWNER_EMAILS || [];

  // If both lists are empty → everyone is owner
  if (ro.length === 0 && ow.length === 0) return 'owner';

  const lc = (email || '').toLowerCase();
  if (ro.map((e) => e.toLowerCase()).includes(lc)) return 'readonly';
  if (ow.map((e) => e.toLowerCase()).includes(lc)) return 'owner';

  // Email not in either list → deny (treat as readonly so they see data but can't modify)
  return 'readonly';
}

function isOwner() {
  return userRole === 'owner';
}

function applyRoleUI() {
  const badge = document.getElementById('access-badge');
  const backupBtn = document.getElementById('backup-btn');
  const mobBackupBtn = document.getElementById('mob-backup-btn');

  if (badge) {
    badge.textContent = userRole === 'owner' ? '✦ Owner' : '👁 Viewer';
    badge.className = `access-badge ${userRole === 'owner' ? 'owner' : 'readonly'}`;
    badge.classList.remove('hidden');
  }

  if (backupBtn) backupBtn.classList.toggle('hidden', !isOwner());
  if (mobBackupBtn) mobBackupBtn.classList.toggle('hidden', !isOwner());
}

// ---- Navigation ----

function navigate(page) {
  currentPage = page;

  // Sync desktop nav
  document.querySelectorAll('#desktop-nav .nav-link').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Sync mobile nav
  document.querySelectorAll('#mobile-nav .mob-nav-btn').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  switch (page) {
    case 'dashboard': renderDashboard(); break;
    case 'flats':     renderFlats();     break;
    case 'expenses':  renderExpenses();  break;
    default:          renderDashboard();
  }
}

// ---- Backup ----

async function backupSheet() {
  if (!isOwner()) {
    showToast('Backup is available to owners only', 'error');
    return;
  }

  const btn = document.getElementById('backup-btn');
  const mobBtn = document.getElementById('mob-backup-btn');
  const setLoading = (v) => {
    [btn, mobBtn].forEach((b) => { if (b) b.disabled = v; });
  };

  try {
    setLoading(true);
    showToast('Creating backup…');

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
                + `_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const backupName = `${APP_CONFIG.APARTMENT_NAME} — Backup ${stamp}`;

    const sid = localStorage.getItem('spreadsheetId');
    if (!sid) throw new Error('No spreadsheet ID found. Please reload the app.');

    await gapi.client.drive.files.copy({
      fileId: sid,
      resource: { name: backupName },
    });

    showToast(`Backup created: "${backupName}" ✓`, 'success');
  } catch (err) {
    showToast(`Backup failed: ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

// ---- App startup ----

function startApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('auth-error').classList.add('hidden');

  // Populate user info
  const profile = getCurrentUserProfile();
  currentUserEmail = profile ? profile.email : null;
  userRole = detectUserRole(currentUserEmail);

  const nameEl = document.getElementById('user-name');
  if (nameEl && profile) {
    nameEl.textContent = profile.name || profile.email || '';
  }

  applyRoleUI();
  showToast('Initializing Google Sheets…');

  initSheets()
    .then(() => {
      showToast(`Connected to sheet ✓`, 'success');
      navigate('dashboard');
    })
    .catch((err) => {
      showToast(`Sheet error: ${err.message}`, 'error');
      document.getElementById('main-content').innerHTML = `
        <div class="error">
          <strong>Could not connect to Google Sheets.</strong><br>
          ${err.message}<br><br>
          Make sure you granted the required permissions and try signing in again.
        </div>`;
    });
}

// ---- UI helpers ----

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast-${type} show`;
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showModal(bodyHTML, onConfirm) {
  const overlay = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  body.innerHTML = bodyHTML;
  overlay.classList.remove('hidden');

  document.getElementById('modal-confirm').onclick = async () => {
    const result = await onConfirm();
    if (result !== false) closeModal();
  };
  document.getElementById('modal-cancel').onclick = closeModal;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); }, { once: true });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ---- GAPI init ----

function gapiLoaded() {
  gapi.load('client', initGapiClient);
}

async function initGapiClient() {
  await gapi.client.init({});
  initApp();
}

function gisLoaded() {
  // GIS library loaded; auth init happens in initApp
}

function initApp() {
  initAuth(() => {
    startApp();
  });

  if (!isSignedIn()) {
    document.getElementById('login-screen').classList.remove('hidden');
  } else {
    startApp();
  }
}

// ---- PWA Service Worker ----

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
