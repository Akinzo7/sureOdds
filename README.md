# 🎯 SureOdds: Automated Betting Logic Engine

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)

SureOdds is a production-grade, dual-sport (Football & Basketball) automated data pipeline and logic engine. It fetches daily sports fixtures, processes them through machine-learning and live Vegas odds APIs, and mathematically filters high-confidence predictions into a dynamic, user-friendly dashboard.

🌐 **Live Demo:** [sure-odds-ten.vercel.app](https://sure-odds-ten.vercel.app) *(Replace with your actual domain if it changes)*

---

## ✨ Key Features

### 🧠 The Hybrid Logic Engine
To protect free-tier API limits without sacrificing UI density, the application implements a custom **Hybrid Logic Engine**:
* **Real API Processing:** The top matches of the day are sent to external APIs (API-Sports / API-Basketball) to retrieve live machine-learning predictions and real-time Vegas bookmaker odds (Moneyline, Point Spreads, Totals).
* **Deterministic Fallback Algorithm:** Remaining matches are processed through a deterministic, seeded mathematical fallback generator. This ensures the dashboard remains fully populated with consistent UI data without exceeding strict daily API rate limits.

### 🤖 Fully Automated Data Pipeline (Cron Jobs)
The backend requires zero manual intervention. Vercel Serverless Cron Jobs are configured to automatically wake the Next.js API routes every night.
* **1:00 AM UTC:** Triggers the football scraper to upsert new global soccer fixtures into the database.
* **1:05 AM UTC:** Triggers the basketball scraper. *(Execution is deliberately staggered to prevent serverless memory timeouts).*

### 📊 Dual-Sport Analytics
* **Football (Soccer):** Algorithmic probability filtering for *Over 1.5 Goals, Over 2.5 Goals, Straight Wins, and Both Teams To Score (BTTS)*.
* **Basketball:** Dynamic calculation of Vegas odds for *Moneyline, Point Spreads (Asian Handicap), and Total Points (Over/Under)*.

### 🔒 Secure Server Component Architecture
Built using the Next.js App Router, the application strictly separates Server and Client components. Database connections and third-party API keys are executed 100% server-side, preventing credential leaks and ensuring lightning-fast initial page loads.

---

## 🛠️ Tech Stack

* **Framework:** Next.js (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS & Lucide Icons
* **Database:** Supabase (PostgreSQL) with Row Level Security (RLS)
* **Hosting & Automation:** Vercel (Edge Network & Serverless Cron)
* **External APIs:** API-Sports (Football) & API-Basketball

---

## 🏗️ Architecture & Data Flow

1. **Scraping (Backend):** Vercel Cron hits `/api/fetch-daily-fixtures` and `/api/fetch-basketball-fixtures`.
2. **Storage (Database):** The Next.js API uses Supabase Service Role keys to bypass RLS and `upsert` the data into PostgreSQL tables, preventing duplicate entries.
3. **Processing (Logic Engine):** Server Components (`page.tsx`) pull the raw data and pass it through the `logic-engine.ts` hybrid probability calculators.
4. **Rendering (Frontend):** Client Components (`DashboardClient.tsx`) receive the analyzed data, handle the user state, dynamic market filtering, and Accumulator Bet Slip rendering.

---

## 🚀 Getting Started (Local Development)

To run this project locally, you will need Node.js installed, as well as accounts with Supabase and API-Sports.

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/sureodds.git](https://github.com/your-username/sureodds.git)
cd sureodds
2. Install dependencies
Bash
npm install
3. Set up Environment Variables
Create a .env.local file in the root directory and add your secret keys:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
API_SPORTS_KEY=your_api_sports_key
4. Run the development server
Bash
npm run dev
Open http://localhost:3000 with your browser to see the result.

⚠️ Disclaimer
This project is built strictly for educational, portfolio, and analytical purposes to demonstrate full-stack engineering, API integrations, and mathematical data filtering. It does not process real money, accept wagers, or guarantee betting outcomes. Please gamble responsibly.


***

### How to add it to your project:
1. Open your `sureodds` folder in VS Code.
2. Open the existing `README.md` file.
3. Delete everything currently inside it, paste the new text above, and save.
4. Run these terminal commands to push it:

```bash
git add README.md
git commit -m "docs: add professional README portfolio documentation"
git push origin main