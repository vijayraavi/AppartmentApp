// ============================================================
// dashboard.js — Dashboard view
// ============================================================

async function renderDashboard() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="loading">Loading dashboard…</div>`;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  try {
    const summary = await getMonthlySummary(month, year);

    // Expense breakdown by category for current month
    const byCat = {};
    summary.monthExpenses.forEach((e) => {
      byCat[e['Category']] = (byCat[e['Category']] || 0) + Number(e['Amount'] || 0);
    });
    const expBreakdown = Object.entries(byCat)
      .map(
        ([cat, amt]) => `
        <tr>
          <td>${cat}</td>
          <td class="amount">₹${amt.toLocaleString('en-IN')}</td>
        </tr>`
      )
      .join('') || '<tr><td colspan="2" class="muted">No expenses recorded</td></tr>';

    const unpaidList = summary.unpaidFlats.length
      ? summary.unpaidFlats
          .map(
            (f) =>
              `<span class="badge badge-unpaid">Flat ${f}</span>`
          )
          .join(' ')
      : '<span class="badge badge-paid">All flats paid! 🎉</span>';

    main.innerHTML = `
      <h2 class="page-title">Dashboard — ${monthName(month)} ${year}</h2>

      <div class="stats-grid">
        <div class="stat-card green">
          <div class="stat-label">Total Collected</div>
          <div class="stat-value">₹${summary.totalCollected.toLocaleString('en-IN')}</div>
          <div class="stat-sub">of ₹${summary.expectedCollection.toLocaleString('en-IN')} expected</div>
        </div>
        <div class="stat-card red">
          <div class="stat-label">Total Expenses</div>
          <div class="stat-value">₹${summary.totalExpenses.toLocaleString('en-IN')}</div>
          <div class="stat-sub">${summary.monthExpenses.length} item(s) this month</div>
        </div>
        <div class="stat-card ${summary.balance >= 0 ? 'blue' : 'orange'}">
          <div class="stat-label">Balance</div>
          <div class="stat-value">₹${summary.balance.toLocaleString('en-IN')}</div>
          <div class="stat-sub">${summary.balance >= 0 ? 'Surplus' : 'Deficit'}</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-label">Flats Paid</div>
          <div class="stat-value">${summary.paidFlats.length} / ${summary.totalFlats}</div>
          <div class="stat-sub">${summary.unpaidFlats.length} pending</div>
        </div>
      </div>

      <div class="section-grid">
        <div class="card">
          <h3>Pending Flats</h3>
          <div class="badge-group">${unpaidList}</div>
        </div>
        <div class="card">
          <h3>Expense Breakdown (${monthName(month)} ${year})</h3>
          <table class="data-table">
            <thead><tr><th>Category</th><th>Amount</th></tr></thead>
            <tbody>${expBreakdown}</tbody>
          </table>
        </div>
      </div>

      <div class="card mt">
        <h3>All-time Overview</h3>
        <p class="muted">Use the Payments and Expenses tabs to view full history.</p>
      </div>
    `;
  } catch (err) {
    main.innerHTML = `<div class="error">Failed to load dashboard: ${err.message}</div>`;
  }
}

function monthName(m) {
  return [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][m];
}
