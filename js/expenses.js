// ============================================================
// expenses.js — Expenses view
// ============================================================

async function renderExpenses() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="loading">Loading expenses…</div>`;

  const now = new Date();
  let filterMonth = 0;      // 0 = all months
  let filterYear = now.getFullYear();

  const readonly = !isOwner();

  async function render() {
    try {
      const allExpenses = await getExpenses();

      // Apply month/year filter for the monthly report
      const filtered = filterMonth === 0
        ? allExpenses
        : allExpenses.filter((e) => {
            const d = new Date(e['Date']);
            return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
          });

      const rows = filtered
        .slice()
        .reverse()
        .map(
          (e) => `
          <tr>
            <td>${e['Date']}</td>
            <td><span class="cat-badge">${e['Category']}</span></td>
            <td class="amount">₹${Number(e['Amount']).toLocaleString('en-IN')}</td>
            <td>${e['Description'] || '—'}</td>
            <td>${e['Added By'] || '—'}</td>
          </tr>`
        )
        .join('') || '<tr><td colspan="5" class="muted center">No expenses recorded yet.</td></tr>';

      // Category totals for filtered data
      const totals = {};
      filtered.forEach((e) => {
        totals[e['Category']] = (totals[e['Category']] || 0) + Number(e['Amount'] || 0);
      });
      const totalRows = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([cat, amt]) => `
          <tr>
            <td><span class="cat-badge">${cat}</span></td>
            <td class="amount">₹${amt.toLocaleString('en-IN')}</td>
          </tr>`
        )
        .join('') || '<tr><td colspan="2" class="muted">—</td></tr>';

      const grandTotal = filtered.reduce((s, e) => s + Number(e['Amount'] || 0), 0);

      const periodLabel = filterMonth === 0
        ? `All of ${filterYear}`
        : `${monthName(filterMonth)} ${filterYear}`;

      const monthOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        .map((m) => `<option value="${m}" ${m === filterMonth ? 'selected' : ''}>${m === 0 ? 'All Months' : monthName(m)}</option>`)
        .join('');
      const yearOptions = [filterYear - 1, filterYear, filterYear + 1]
        .map((y) => `<option value="${y}" ${y === filterYear ? 'selected' : ''}>${y}</option>`)
        .join('');

      main.innerHTML = `
        <h2 class="page-title">Expenses</h2>

        ${readonly ? `<div class="readonly-notice">👁 You have read-only access. Contact an owner to make changes.</div>` : ''}

        <div class="toolbar">
          ${!readonly ? `<button class="btn btn-primary" onclick="openAddExpense()">+ Add Expense</button>` : ''}
          <div class="month-picker">
            <label>Month:</label>
            <select id="exp-sel-month">${monthOptions}</select>
            <select id="exp-sel-year">${yearOptions}</select>
            <button class="btn btn-primary" onclick="applyExpenseFilter()">Go</button>
            <button class="btn btn-ghost" onclick="exportExpensesPDF()" title="Export current view as PDF">🖨️ Export PDF</button>
          </div>
        </div>

        <div id="pdf-report">
          <div class="pdf-header print-only">
            <h2>🏛️ ${APP_CONFIG.APARTMENT_NAME} — Expense Report</h2>
            <p>${periodLabel}</p>
          </div>

          <div class="section-grid">
            <div class="card">
              <h3>By Category — ${periodLabel}</h3>
              <table class="data-table">
                <thead><tr><th>Category</th><th>Total</th></tr></thead>
                <tbody>${totalRows}</tbody>
                <tfoot>
                  <tr class="total-row">
                    <td><strong>Grand Total</strong></td>
                    <td class="amount"><strong>₹${grandTotal.toLocaleString('en-IN')}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div class="card">
              <h3>Expense Details — ${periodLabel}</h3>
              <table class="data-table">
                <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th>By</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      window.applyExpenseFilter = () => {
        filterMonth = Number(document.getElementById('exp-sel-month').value);
        filterYear = Number(document.getElementById('exp-sel-year').value);
        render();
      };
    } catch (err) {
      main.innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
  }

  await render();

  window.openAddExpense = () => {
    if (!isOwner()) { showToast('Write access required', 'error'); return; }
    const catOptions = APP_CONFIG.EXPENSE_CATEGORIES.map(
      (c) => `<option value="${c}">${c}</option>`
    ).join('');
    const today = new Date().toISOString().split('T')[0];

    showModal(`
      <h3>Add Expense</h3>
      <label>Date</label>
      <input id="exp-date" type="date" class="form-input" value="${today}" />
      <label>Category</label>
      <select id="exp-cat" class="form-input">
        ${catOptions}
      </select>
      <label>Amount (₹)</label>
      <input id="exp-amount" type="number" class="form-input" placeholder="0" min="0" />
      <label>Description</label>
      <input id="exp-desc" class="form-input" placeholder="Optional details" />
      <label>Added By</label>
      <input id="exp-by" class="form-input" placeholder="Your name" />
    `, async () => {
      const date = document.getElementById('exp-date').value;
      const cat = document.getElementById('exp-cat').value;
      const amt = Number(document.getElementById('exp-amount').value);
      const desc = document.getElementById('exp-desc').value.trim();
      const by = document.getElementById('exp-by').value.trim();

      if (!date || !cat || !amt) {
        showToast('Please fill date, category and amount', 'error');
        return false; // Keep modal open
      }
      try {
        showToast('Saving expense…');
        await addExpense(date, cat, amt, desc, by);
        showToast('Expense added ✓', 'success');
        render();
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };

  window.exportExpensesPDF = () => {
    document.body.classList.add('printing-expenses');
    window.print();
    document.body.classList.remove('printing-expenses');
  };
}
