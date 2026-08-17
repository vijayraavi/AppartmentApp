// ============================================================
// CONFIGURATION — fill in your values here
// ============================================================

const APP_CONFIG = {
  // ── Apartment Identity ──────────────────────────────────
  APARTMENT_NAME: 'The Pride of Tirumala',

  // ── Google OAuth 2.0 Client ID ──────────────────────────
  // Get it from https://console.cloud.google.com/  (see README)
  CLIENT_ID: '33627201770-ks4fo1kpdf777h7kanlmva3rtghk7u33.apps.googleusercontent.com',

  // ── Google Sheet title (created on first run) ───────────
  SHEET_TITLE: 'The Pride of Tirumala — Master Sheet',

  // ── Monthly maintenance amount per flat (INR) ───────────
  MONTHLY_MAINTENANCE: 3000,

  // ── All flat numbers ────────────────────────────────────
  FLATS: ['101', '102', '201', '202', '301', '302', '401', '402', '501', '502'],

  // ── Role map (flat → role label shown in UI) ────────────
  ROLES: {
    '401': 'Treasurer',
    '102': 'President',
  },

  // ── Expense categories ──────────────────────────────────
  EXPENSE_CATEGORIES: [
    'Watchman Salary',
    'Generator Fuel',
    'Water Bill',
    'WiFi Bill',
    'Electricity Bill',
    'Lift Maintenance',
    'Miscellaneous',
  ],

  // ── Access Control ──────────────────────────────────────
  // READ-ONLY users: can view all data but cannot add/edit anything.
  // Add the Gmail / Google account email addresses of viewers here.
  READ_ONLY_EMAILS: [
    // 'viewer1@gmail.com',
    // 'viewer2@gmail.com',
  ],

  // OWNER (read-write) users: full access including Backup.
  // Add the Gmail / Google account email addresses of owners here.
  // If both lists are empty every signed-in user gets owner access.
  OWNER_EMAILS: [
    // 'owner@gmail.com',
    // 'treasurer@gmail.com',
  ],
};
