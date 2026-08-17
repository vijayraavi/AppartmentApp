// ============================================================
// flats.js — Flats & Payments view
// ============================================================

async function renderFlats() {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="loading">Loading flats…</div>`;

  const now = new Date();
  let selMonth = now.getMonth() + 1;
  let selYear = now.getFullYear();
  const readonly = !isOwner();

  async function render() {
    try {
      const [flats, paidThisMonth] = await Promise.all([
        getFlats(),
        getPaymentsForMonth(selMonth, selYear),
      ]);
      const paidSet = new Set(paidThisMonth.map((p) => p['Flat No']));

      const flatRows = flats
        .map((f) => {
          const paid = paidSet.has(f['Flat No']);
          const role = f['Role'] ? `<span class="role-badge">${f['Role']}</span>` : '';
          const safeOwner = (f['Owner Name'] || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
          const safePhone = (f['Phone'] || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            ? `<span class="muted" style="font-size:0.8rem">View only</span>`
            : `
              ${
                !paid
                  ? `<button class="btn btn-sm btn-primary" onclick="markPaid('${f['Flat No']}', ${selMonth}, ${selYear})">Mark Paid</button>`
                  : `<button class="btn btn-sm btn-ghost" disabled>Paid</button>`
              }
              <button class="btn btn-sm btn-ghost" onclick="editFlat('${f['Flat No']}', '${safeOwner}', '${safePhone}')">Edit</button>
            `;
          return `
          <tr>
            <td><strong>Flat ${f['Flat No']}</strong> ${role}</td>
            <td>${f['Owner Name'] || '<span class="muted">—</span>'}</td>
            <td>${f['Phone'] || '<span class="muted">—</span>'}</td>
            <td>
              <span class="badge ${paid ? 'badge-paid' : 'badge-unpaid'}">
                ${paid ? '✓ Paid' : '✗ Pending'}
              </span>
            </td>
            <td>${actions}</td>
          </tr>`;
        })
        .join('');

      main.innerHTML = `
        <h2 class="page-title">Flats &amp; Payments</h2>

        ${readonly ? `<div class="readonly-notice">👁 You have read-only access. Contact an owner to make changes.</div>` : ''}

        <div class="toolbar">
          <div class="month-picker">
            <label>Month:</label>
            <select id="sel-month">
              ${[1,2,3,4,5,6,7,8,9,10,11,12]
                .map((m) => `<option value="${m}" ${m===selMonth?'selected':''}>${monthName(m)}</option>`)
                .join('')}
            </select>
            <select id="sel-year">
              ${[selYear-1, selYear, selYear+1]
                .map((y) => `<option value="${y}" ${y===selYear?'selected':''}>${y}</option>`)
                .join('')}
            </select>
            <button class="btn btn-primary" onclick="applyMonthFilter()">Go</button>
          </div>
          <div class="toolbar-info">
            ${paidSet.size} / ${APP_CONFIG.FLATS.length} paid for ${monthName(selMonth)} ${selYear}
          </div>
        </div>

        <div class="card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Flat</th><th>Owner</th><th>Phone</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>${flatRows}</tbody>
          </table>
        </div>

        <div class="card mt">
          <h3>Payment History</h3>
          ${await paymentHistoryTable()}
        </div>
      `;

      window.applyMonthFilter = () => {
        selMonth = Number(document.getElementById('sel-month').value);
        selYear = Number(document.getElementById('sel-year').value);
        render();
      };
    } catch (err) {
      main.innerHTML = `<div class="error">Error: ${err.message}</div>`;
    }
  }

  await render();

  window.markPaid = async (flatNo, month, year) => {
    if (!isOwner()) { showToast('Write access required', 'error'); return; }
    const amount = APP_CONFIG.MONTHLY_MAINTENANCE;
    const paidDate = new Date().toISOString().split('T')[0];
    try {
      showToast('Recording payment…');
      await addPayment(flatNo, month, year, amount, paidDate, '');
      showToast(`Flat ${flatNo} marked as paid ✓`, 'success');
      render();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  window.editFlat = (flatNo, ownerName, phone) => {
    if (!isOwner()) { showToast('Write access required', 'error'); return; }
    showModal(`
      <h3>Edit Flat ${flatNo}</h3>
      <label>Owner Name</label>
      <input id="m-owner" class="form-input" value="${ownerName}" placeholder="Owner name" />
      <label>Phone</label>
      <input id="m-phone" class="form-input" value="${phone}" placeholder="Phone number" />
    `, async () => {
      const name = document.getElementById('m-owner').value.trim();
      const ph = document.getElementById('m-phone').value.trim();
      try {
        showToast('Saving…');
        await updateFlat(flatNo, name, ph);
        showToast('Flat updated ✓', 'success');
        render();
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  };
}

async function paymentHistoryTable() {
  const payments = await getPayments();
  if (!payments.length) return '<p class="muted">No payments recorded yet.</p>';
  const rows = payments
    .slice()
    .reverse()
    .slice(0, 50)
    .map(
      (p) => `
      <tr>
        <td>Flat ${p['Flat No']}</td>
        <td>${monthName(Number(p['Month']))} ${p['Year']}</td>
        <td class="amount">₹${Number(p['Amount']).toLocaleString('en-IN')}</td>
        <td>${p['Paid Date']}</td>
        <td>${p['Notes'] || '—'}</td>
      </tr>`
    )
    .join('');
  return `
    <table class="data-table">
      <thead><tr><th>Flat</th><th>Month</th><th>Amount</th><th>Date</th><th>Notes</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
