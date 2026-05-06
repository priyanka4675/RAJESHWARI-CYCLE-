# 🚲 Rajeshwari Cycles — Shop Management System

> **Ramachandrapuram** | Full-stack Cycle Shop Management Web App

Built with React + Supabase. Deployed on Vercel.

---

## 📋 Features

- 📦 **Inventory Management** — Add, edit, delete cycles with stock tracking
- 🧾 **Sales & Invoices** — Create invoices, print receipts, sales history
- 🏭 **Dealer Management** — Add dealers with bank/UPI details
- 💰 **Payment Tracking** — Track what you owe dealers, pay via UPI/GPay/PhonePe
- 📊 **Dashboard** — Live stats, low stock alerts, today's sales
- 📈 **Reports** — Revenue charts, profit analysis, product performance

---

## 🚀 Deployment Guide

### STEP 1 — Set up Supabase

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Choose a strong password → Select region (Asia South - Mumbai is closest)
3. Wait for project to be ready (~2 minutes)
4. Go to **SQL Editor** → Click **New Query**
5. Copy ALL content from `supabase_schema.sql` → Paste → Click **Run**
6. Go to **Project Settings → API**
   - Copy your **Project URL** (looks like: `https://xxxx.supabase.co`)
   - Copy your **anon public** key

### STEP 2 — Create Admin User in Supabase

1. Go to **Authentication → Users** in Supabase dashboard
2. Click **"Invite user"** or **"Add user"**
3. Enter your email and password
4. This will be your admin login

### STEP 3 — Push to GitHub

```bash
# In the project folder:
git init
git add .
git commit -m "Initial commit - Rajeshwari Cycles"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/rajeshwari-cycles.git
git branch -M main
git push -u origin main
```

### STEP 4 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. Click **"Add New Project"**
3. Import your `rajeshwari-cycles` GitHub repository
4. **Before clicking Deploy**, go to **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Your Supabase anon key |

5. Click **Deploy** → Wait ~2 minutes
6. Your site will be live at: `https://rajeshwari-cycles.vercel.app`

---

## 💻 Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/rajeshwari-cycles.git
cd rajeshwari-cycles

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your Supabase URL and key

# Start development server
npm start
```

---

## 📁 Project Structure

```
rajeshwari-cycles/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── Layout.js          # Sidebar + main layout
│   ├── context/
│   │   └── AuthContext.js     # Login/logout state
│   ├── lib/
│   │   └── supabase.js        # Supabase client
│   ├── pages/
│   │   ├── Login.js           # Admin login
│   │   ├── Dashboard.js       # Home dashboard
│   │   ├── Inventory.js       # View/edit stock
│   │   ├── AddProduct.js      # Add new cycle
│   │   ├── Sales.js           # Sales history + print invoice
│   │   ├── CreateInvoice.js   # New sale entry
│   │   ├── Dealers.js         # Dealer management
│   │   ├── Purchases.js       # Stock purchase entry
│   │   ├── Payments.js        # Pay dealers (UPI/GPay)
│   │   └── Reports.js         # Charts & analytics
│   ├── App.js
│   ├── App.css
│   └── index.js
├── supabase_schema.sql         # ← Run this in Supabase SQL Editor
├── vercel.json
├── package.json
└── .env.example
```

---

## 💳 UPI Payment Flow

1. Go to **Payments** page
2. Click **"Pay"** next to a dealer
3. Enter amount
4. Click **Google Pay / PhonePe / UPI Pay** button → Opens payment app
5. Complete payment in the app
6. Come back → Click **"Mark as Paid"**
7. Balance updates automatically ✅

---

## 🛠 Tech Stack

- **Frontend**: React 18 + React Router v6
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Hosting**: Vercel
- **Styling**: Custom CSS (no UI library needed)

---

## 📞 Support

Shop: **Rajeshwari Cycles, Ramachandrapuram**
