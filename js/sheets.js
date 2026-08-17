// ============================================================
// sheets.js — Google Sheets API helpers
// ============================================================

const SHEET_NAMES = {
  CONFIG: 'Config',
  FLATS: 'Flats',
  PAYMENTS: 'Payments',
  EXPENSES: 'Expenses',
  SUMMARY: 'Monthly Summary',
};

let spreadsheetId = null;

// ---- Bootstrap ----

async function initSheets() {
  await gapi.client.load('sheets', 'v4');
  await gapi.client.load('drive', 'v3');

  const savedId = localStorage.getItem('spreadsheetId');
  if (savedId) {
    // Verify it still exists
    try {
      await gapi.client.sheets.spreadsheets.get({ spreadsheetId: savedId });
      spreadsheetId = savedId;
      await ensureSummarySheet(spreadsheetId);
      return spreadsheetId;
    } catch (_) {
      localStorage.removeItem('spreadsheetId');
    }
  }

  // Search Drive for existing sheet
  const search = await gapi.client.drive.files.list({
    q: `name='${APP_CONFIG.SHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: 'files(id,name)',
  });
  if (search.result.files && search.result.files.length > 0) {
    spreadsheetId = search.result.files[0].id;
    localStorage.setItem('spreadsheetId', spreadsheetId);
    await ensureSummarySheet(spreadsheetId);
    return spreadsheetId;
  }

  // Create fresh sheet
  spreadsheetId = await createMasterSheet();
  localStorage.setItem('spreadsheetId', spreadsheetId);
  return spreadsheetId;
}

async function createMasterSheet() {
  const response = await gapi.client.sheets.spreadsheets.create({
    resource: {
      properties: { title: APP_CONFIG.SHEET_TITLE },
      sheets: [
        { properties: { title: SHEET_NAMES.CONFIG } },
        { properties: { title: SHEET_NAMES.FLATS } },
        { properties: { title: SHEET_NAMES.PAYMENTS } },
        { properties: { title: SHEET_NAMES.EXPENSES } },
        { properties: { title: SHEET_NAMES.SUMMARY } },
      ],
    },
  });
  const id = response.result.spreadsheetId;
  await seedMasterSheet(id);
  return id;
}

async function seedMasterSheet(id) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  // Config sheet
  await writeRange(id, `${SHEET_NAMES.CONFIG}!A1`, [
    ['Key', 'Value'],
    ['monthly_maintenance', APP_CONFIG.MONTHLY_MAINTENANCE],
    ['created_date', dateStr],
    ['app_version', '1.0'],
  ]);

  // Flats sheet header
  await writeRange(id, `${SHEET_NAMES.FLATS}!A1`, [
    ['Flat No', 'Owner Name', 'Phone', 'Role', 'Status'],
    ...APP_CONFIG.FLATS.map((f) => [
      f,
      '',
      '',
      APP_CONFIG.ROLES[f] || '',
      'Active',
    ]),
  ]);

  // Payments sheet header
  await writeRange(id, `${SHEET_NAMES.PAYMENTS}!A1`, [
    ['Flat No', 'Month', 'Year', 'Amount', 'Paid Date', 'Notes'],
  ]);

  // Expenses sheet header
  await writeRange(id, `${SHEET_NAMES.EXPENSES}!A1`, [
    ['Date', 'Category', 'Amount', 'Description', 'Added By'],
  ]);

  // Summary sheet header
  await seedSummarySheet(id);
}

// ---- Summary sheet ----

// Month names for sheet formulas
const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

async function seedSummarySheet(id) {
  const headers = [
    'Month', 'Year',
    'Expected Collection', 'Total Collected',
    'Total Expenses', 'Balance (Surplus/Deficit)',
    'Status',
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const rows = [headers];

  for (let m = 1; m <= 12; m++) {
    const monthStr = MONTH_NAMES_SHORT[m - 1];
    const totalFlats = APP_CONFIG.FLATS.length;
    const expected = totalFlats * APP_CONFIG.MONTHLY_MAINTENANCE;
    const rowIndex = m + 1; // row in the summary sheet (row 1 = header)

    // Month stored as number in Payments sheet; expenses use date strings
    const collectedFormula =
      `=SUMPRODUCT((VALUE(${SHEET_NAMES.PAYMENTS}!B$2:B$10000)=${m})*(VALUE(${SHEET_NAMES.PAYMENTS}!C$2:C$10000)=${currentYear})*VALUE(${SHEET_NAMES.PAYMENTS}!D$2:D$10000))`;
    const expensesFormula =
      `=SUMPRODUCT((MONTH(DATEVALUE(${SHEET_NAMES.EXPENSES}!A$2:A$10000))=${m})*(YEAR(DATEVALUE(${SHEET_NAMES.EXPENSES}!A$2:A$10000))=${currentYear})*VALUE(${SHEET_NAMES.EXPENSES}!C$2:C$10000))`;
    const balanceFormula = `=D${rowIndex}-E${rowIndex}`;
    const statusFormula = `=IF(F${rowIndex}>0,"Surplus",IF(F${rowIndex}<0,"Deficit","Break Even"))`;

    rows.push([monthStr, currentYear, expected, collectedFormula, expensesFormula, balanceFormula, statusFormula]);
  }

  await writeRange(id, `${SHEET_NAMES.SUMMARY}!A1`, rows);
}

async function ensureSummarySheet(id) {
  try {
    const meta = await gapi.client.sheets.spreadsheets.get({ spreadsheetId: id });
    const sheetTitles = meta.result.sheets.map((s) => s.properties.title);
    if (!sheetTitles.includes(SHEET_NAMES.SUMMARY)) {
      // Add the tab
      await gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: id,
        resource: {
          requests: [{ addSheet: { properties: { title: SHEET_NAMES.SUMMARY } } }],
        },
      });
      await seedSummarySheet(id);
    }
  } catch (_) {
    // Non-fatal: summary sheet is a bonus feature
  }
}

// ---- Low-level helpers ----

async function writeRange(sid, range, values) {
  return gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId: sid || spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });
}

async function appendRow(sheetName, values) {
  return gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [values] },
  });
}

async function readRange(range) {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.result.values || [];
}

async function updateCell(range, value) {
  return gapi.client.sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[value]] },
  });
}

// Convert sheet rows (array of arrays) to array of objects using header row
function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : '';
    });
    return obj;
  });
}

// ---- Flats ----

async function getFlats() {
  const rows = await readRange(`${SHEET_NAMES.FLATS}!A1:E`);
  return rowsToObjects(rows);
}

async function updateFlat(flatNo, ownerName, phone) {
  const rows = await readRange(`${SHEET_NAMES.FLATS}!A1:E`);
  const idx = rows.findIndex((r, i) => i > 0 && r[0] === flatNo);
  if (idx === -1) return;
  const rowNum = idx + 1;
  await writeRange(null, `${SHEET_NAMES.FLATS}!B${rowNum}:C${rowNum}`, [
    [ownerName, phone],
  ]);
}

// ---- Payments ----

async function getPayments() {
  const rows = await readRange(`${SHEET_NAMES.PAYMENTS}!A1:F`);
  return rowsToObjects(rows);
}

async function addPayment(flatNo, month, year, amount, paidDate, notes) {
  await appendRow(SHEET_NAMES.PAYMENTS, [
    flatNo,
    month,
    year,
    amount,
    paidDate,
    notes || '',
  ]);
}

async function getPaymentsForMonth(month, year) {
  const all = await getPayments();
  return all.filter(
    (p) => String(p['Month']) === String(month) && String(p['Year']) === String(year)
  );
}

// ---- Expenses ----

async function getExpenses() {
  const rows = await readRange(`${SHEET_NAMES.EXPENSES}!A1:E`);
  return rowsToObjects(rows);
}

async function addExpense(date, category, amount, description, addedBy) {
  await appendRow(SHEET_NAMES.EXPENSES, [
    date,
    category,
    amount,
    description || '',
    addedBy || '',
  ]);
}

// ---- Summary helpers ----

async function getMonthlySummary(month, year) {
  const [payments, expenses, flats] = await Promise.all([
    getPaymentsForMonth(month, year),
    getExpenses(),
    getFlats(),
  ]);

  const totalFlats = APP_CONFIG.FLATS.length;
  const expectedCollection = totalFlats * APP_CONFIG.MONTHLY_MAINTENANCE;

  const paidFlats = new Set(payments.map((p) => p['Flat No']));
  const totalCollected = payments.reduce(
    (s, p) => s + Number(p['Amount'] || 0),
    0
  );

  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e['Date']);
    return d.getMonth() + 1 === Number(month) && d.getFullYear() === Number(year);
  });
  const totalExpenses = monthExpenses.reduce(
    (s, e) => s + Number(e['Amount'] || 0),
    0
  );

  const unpaidFlats = APP_CONFIG.FLATS.filter((f) => !paidFlats.has(f));

  return {
    month,
    year,
    totalFlats,
    expectedCollection,
    totalCollected,
    totalExpenses,
    balance: totalCollected - totalExpenses,
    paidFlats: [...paidFlats],
    unpaidFlats,
    monthExpenses,
    flatDetails: flats,
  };
}
