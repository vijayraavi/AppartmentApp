// ============================================================
// auth.js — Google Identity Services OAuth2 (client-side)
// ============================================================

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
].join(' ');

let tokenClient = null;
let accessToken = null;

function initAuth(onSignedIn) {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: APP_CONFIG.CLIENT_ID,
    scope: SCOPES,
    callback: (response) => {
      if (response.error) {
        console.error('Auth error:', response.error);
        showAuthError(response.error);
        return;
      }
      accessToken = response.access_token;
      gapi.client.setToken({ access_token: accessToken });
      saveTokenToSession(response);
      onSignedIn();
    },
  });

  // Try to restore session silently
  const saved = loadTokenFromSession();
  if (saved) {
    accessToken = saved.access_token;
    gapi.client.setToken({ access_token: accessToken });
    onSignedIn();
  }
}

function signIn() {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

function signOut() {
  const token = gapi.client.getToken();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token, () => {});
    gapi.client.setToken(null);
  }
  accessToken = null;
  sessionStorage.removeItem('gapi_token');
  window.location.reload();
}

function getAccessToken() {
  return accessToken;
}

function isSignedIn() {
  return !!accessToken;
}

function saveTokenToSession(tokenResponse) {
  const expiry = Date.now() + (tokenResponse.expires_in - 60) * 1000;
  sessionStorage.setItem(
    'gapi_token',
    JSON.stringify({ access_token: tokenResponse.access_token, expiry })
  );
}

function loadTokenFromSession() {
  const raw = sessionStorage.getItem('gapi_token');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Date.now() < parsed.expiry) return parsed;
  } catch (_) {}
  sessionStorage.removeItem('gapi_token');
  return null;
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) {
    el.textContent = `Authentication error: ${msg}`;
    el.classList.remove('hidden');
  }
}
