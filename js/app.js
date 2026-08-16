// ============================================================
// app.js — Bootstrap & router
// ============================================================

let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach((el) => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  switch (page) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'flats':
      renderFlats();
      break;
    case 'expenses':
      renderExpenses();
      break;
    default:
      renderDashboard();
  }
}

// ---- App startup ----

function startApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('auth-error').classList.add('hidden');

  showToast('Initializing Google Sheets…');

  initSheets()
    .then((id) => {
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
  let toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
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

  // Show login screen if not signed in yet
  if (!isSignedIn()) {
    document.getElementById('login-screen').classList.remove('hidden');
  } else {
    startApp();
  }
}
