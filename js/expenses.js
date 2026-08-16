// ============================================================
// expenses.js — Expenses view
// ============================================================

async function renderExpenses() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="loading">Loading expenses…</div>`;

  async function render() {
    try {
      const expenses = await getExpenses();

      // Group by year-month for display
      const rows = expenses
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

      // Category totals
      const totals = {};
      expenses.forEach((e) => {
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

      const grandTotal = expenses.reduce((s, e) => s + Number(e['Amount'] || 0), 0);

      main.innerHTML = `
        <h2 class="page-title">Expenses</h2>

        <div class="toolbar">
          <button class="btn btn-primary" onclick="openAddExpense()">+ Add Expense</button>
        </div>

        <div class="section-grid">
          <div class="card">
            <h3>All-time by Category</h3>
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
            <h3>Recent Expenses</h3>
            <table class="data-table">
              <thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Description</th><th>By</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      main.innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
  }

  await render();

  window.openAddExpense = () => {
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
}
