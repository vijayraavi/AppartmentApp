# 🏢 Apartment Maintenance App

A simple web app to manage monthly maintenance payments and expenses for your apartment complex.  
**Backend: Google Sheets** (auto-created on first run) | **Auth: Google OAuth2** | **Hosting: GitHub Pages**

🌐 **Live App:** [https://vijayraavi.github.io/AppartmentApp/](https://vijayraavi.github.io/AppartmentApp/)

---

## Features

- **Dashboard** — Monthly collected amount, expenses, balance (surplus/deficit), pending flats
- **Flats & Payments** — 10 flats (101–502), mark monthly payments, edit owner details
- **Expenses** — Add/view watchman salary, generator fuel, water bill, WiFi, electricity, lift maintenance, misc
  - 📅 **Month filter** — view expenses for any month/year
  - 🖨️ **Export PDF** — print/save monthly expense report as PDF
- **Google Sheets** — All data stored in a master sheet auto-created in your Google Drive on first login
  - 📊 **Monthly Summary tab** — auto-computed surplus/deficit for every month of the year

---

## Setup (One-time — ~15 minutes)

### Step 1: Create a Google Cloud Project & OAuth Client ID

1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Click **Select Project** → **New Project** → name it `ApartmentApp` → **Create**
3. In the left menu go to **APIs & Services → Library**
4. Search and enable both:
   - **Google Sheets API**
   - **Google Drive API**
5. Go to **APIs & Services → OAuth consent screen**
   - Choose **External** → **Create**
   - Fill: App name = `Apartment Maintenance App`, your email for support & developer contact
   - Click **Save and Continue** through all steps
   - On the **Test users** step, add the Gmail accounts of all 3 users (you, president, other person)
   - Click **Save and Continue** → **Back to Dashboard**
6. Go to **APIs & Services → Credentials**
   - Click **+ Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `ApartmentApp Web`
   - **Authorised JavaScript origins** — add:
     - `http://localhost` (for local testing)
     - `https://YOUR_GITHUB_USERNAME.github.io` (for GitHub Pages)
   - Click **Create**
   - Copy the **Client ID** (looks like `xxxxxxxx.apps.googleusercontent.com`)

### Step 2: Add Client ID to the app

Open `config.js` and replace:
```js
CLIENT_ID: 'YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com',
```
with your actual Client ID.

---

## Hosting: GitHub Pages (Free, Recommended)

### Live URL

**[https://vijayraavi.github.io/AppartmentApp/](https://vijayraavi.github.io/AppartmentApp/)**

### Deploy (one-time setup)

1. Push this repo to GitHub (if not already done)
2. Go to your repo on GitHub → **Settings → Pages**
3. Under **Source**, select **Deploy from a branch** → `main` branch → `/ (root)` folder → **Save**
4. Your app will be available at: `https://vijayraavi.github.io/AppartmentApp/`

### Add GitHub Pages URL to OAuth

Back in Google Cloud Console → **Credentials → your OAuth client** → add to **Authorised JavaScript origins**:
```
https://vijayraavi.github.io
```
Save. It may take a few minutes to propagate.

### Share with others

Give the URL `https://vijayraavi.github.io/AppartmentApp/` to the president and the third user. They need to sign in with the Gmail accounts you added as **Test users** in the consent screen.

---

## First Run

1. Open the app URL
2. Click **Sign in with Google** — use your own Gmail account
3. Grant the requested permissions (Sheets + Drive)
4. The app will automatically:
   - Create a Google Sheet called **"ApartmentApp Master Sheet"** in your Drive
   - Set up 4 tabs: Config, Flats, Payments, Expenses
   - Pre-populate all 10 flats (101, 102, 201, 202, 301, 302, 401, 402, 501, 502)
5. Start using the app! 🎉

---

## Google Sheet Structure

| Tab | Purpose |
|-----|---------|
| **Config** | App settings (monthly amount, version) |
| **Flats** | Flat numbers, owner names, phones, roles |
| **Payments** | All payment records (flat, month, year, amount, date) |
| **Expenses** | All expense records (date, category, amount, description) |
| **Monthly Summary** | Auto-computed surplus/deficit for each month (formulas, read-only) |

The **Monthly Summary** tab shows for each month:
- Expected Collection (number of flats × monthly maintenance)
- Total Collected (from Payments sheet)
- Total Expenses (from Expenses sheet)
- Balance = Collected − Expenses (positive = **Surplus**, negative = **Deficit**)
- Status label: *Surplus / Deficit / Break Even*

You can open the sheet directly in Google Sheets for manual edits anytime.

---

## Flats Reference

| Flat | Role |
|------|------|
| 101 | — |
| **102** | **President** |
| 201 | — |
| 202 | — |
| 301 | — |
| 302 | — |
| **401** | **Treasurer** |
| 402 | — |
| 501 | — |
| 502 | — |

Monthly maintenance: **₹3,000 per flat** (total expected: ₹30,000/month)

---

## Local Testing

Just open `index.html` in a browser. Make sure `http://localhost` is in your OAuth authorized origins.

> **Note**: Chrome may block OAuth popups from file:// URLs. Use a local server:
> ```
> python3 -m http.server 8080
> # Then open http://localhost:8080
> ```
