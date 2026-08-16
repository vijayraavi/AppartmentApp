// ============================================================
// CONFIGURATION — fill in your values here
// ============================================================

const APP_CONFIG = {
  // Your Google OAuth 2.0 Client ID
  // Get it from https://console.cloud.google.com/  (see README)
  CLIENT_ID: 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com',

  // The name of the Google Sheet that will be created on first run
  SHEET_TITLE: 'ApartmentApp Master Sheet',

  // Monthly maintenance amount per flat (INR)
  MONTHLY_MAINTENANCE: 3000,

  // All flat numbers
  FLATS: ['101', '102', '201', '202', '301', '302', '401', '402', '501', '502'],

  // Your role map (flat → role label shown in UI)
  ROLES: {
    '401': 'Treasurer',
    '102': 'President',
  },

  // Expense categories
  EXPENSE_CATEGORIES: [
    'Watchman Salary',
    'Generator Fuel',
    'Water Bill',
    'WiFi Bill',
    'Electricity Bill',
    'Lift Maintenance',
    'Miscellaneous',
  ],
};
