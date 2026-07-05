<div align="center">

# 🐦 Flutterify

### An AI-powered study companion for cracking Flutter / Dart / mobile system-design interviews.

A guided **60-day plan** that blends **theory**, **hands-on logic building**, and **system & architecture** — with an AI mentor that explains every concept *in depth and in plain English*, so you actually understand it instead of memorizing.

Built with **Next.js · Supabase · Google Gemini · Tailwind CSS**

</div>

---

## 🎬 Demo

<div align="center">

<!-- 
  To embed the video:
  1. Open any GitHub issue or PR in this repo
  2. Drag and drop docs/demo.mov into the comment box
  3. Wait for it to upload — GitHub gives you a URL like:
     https://github.com/user-attachments/assets/...
  4. Replace the placeholder below with that URL (just paste it on its own line)
-->



https://github.com/user-attachments/assets/REPLACE_WITH_UPLOADED_VIDEO_URL

</div>

---

## ✨ What it does

Flutterify turns a huge interview-prep curriculum (**1,400+ questions**) into a calm, day-by-day learning experience. Each day mixes three tracks:

- **📘 Theory** — Dart & Flutter concepts explained simply, with analogies and the *behind-the-scenes "why"* (not just definitions).
- **💻 Logic building** — coding drills where the mentor **guides your thinking without giving the solution**; a question is marked done only when you submit your own code.
- **🏗 System & Architecture** — mobile system design & solution-architecture questions (payments, offline-first, real-time, fintech, AI features, and more).

Every explanation is generated **once by AI, then cached** — so re-opening a question is instant and free, and everyone sees the same high-quality answer.

---

## 🚀 Key features

| | |
|---|---|
| 🧠 **In-depth AI answers** | Behind-the-scenes explanations in simple English, with analogies, trade-offs, "what breaks if you do it wrong", and an interview-ready summary. |
| 💾 **Answer caching** | Generated once and stored in Supabase — revisits load instantly and cost zero tokens. |
| ✅ **Progress tracking** | Mark questions done; logic questions are **code-gated**. Progress and a **consistency heatmap** sync across devices. |
| 🃏 **Flashcards + quick revision** | Auto-generated flashcards and a collapsible "quick revision" gist for fast recall before interviews. |
| 🔒 **Google sign-in** | Supabase Auth (Google OAuth). Row-level security keeps each user's progress private. |
| 🎨 **Clean, modern UI** | Dark sidebar, pastel day cards, and a focused reading experience. |
| 🛟 **Resilient** | Handles AI rate limits / quota gracefully, retries transient failures, and never shows half-broken answers. |

---

## 🛠 Tech stack

- **[Next.js](https://nextjs.org/)** (App Router, Turbopack) + **React 19** + **TypeScript**
- **[Supabase](https://supabase.com/)** — Postgres, Auth (Google OAuth), Row-Level Security
- **[Google Gemini](https://ai.google.dev/)** — free-tier LLM for answer generation
- **[Tailwind CSS](https://tailwindcss.com/)** — styling
- **[Vercel](https://vercel.com/)** — deployment

---

## 📂 Project structure

```
flutterify/
├─ content/curriculum/           # Source markdown — the actual question banks
├─ scripts/parse-curriculum.mjs  # Turns the markdown into src/data/curriculum.json
├─ src/
│  ├─ app/                       # Next.js routes (dashboard, day, question, api/*)
│  ├─ components/                # UI (Sidebar, QuestionView, Flashcards, Heatmap…)
│  ├─ data/curriculum.json       # Generated curriculum the app reads at runtime
│  └─ lib/                       # Supabase clients, Gemini (llm.ts), prompts
└─ supabase/                     # schema.sql + migrations
```

> The app reads the committed `src/data/curriculum.json` at runtime. The `content/curriculum/` markdown is the editable source — run `npm run parse` to regenerate the JSON after editing it.

---

## 🧑‍💻 Local setup

### Prerequisites

- **Node.js 18+** and npm
- A free **[Supabase](https://supabase.com/)** account
- A free **[Google AI Studio](https://aistudio.google.com/apikey)** API key (no credit card needed)

---

### Step 1 — Clone and install

```bash
git clone https://github.com/Akashtripathi7/flutterify.git
cd flutterify
npm install
```

---

### Step 2 — Set up Supabase

Supabase stores your progress, caches AI answers, and handles Google sign-in.

1. Create a new project at **[supabase.com](https://supabase.com/)**.
2. Go to **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.  
   This creates the tables (`profiles`, `question_answers`, `progress`, `token_usage`) with Row-Level Security policies.
3. Run [`supabase/RUN_THIS_MIGRATION.sql`](supabase/RUN_THIS_MIGRATION.sql) next — it adds the `flashcards` / `code` columns the app needs.
4. Enable Google sign-in: **Authentication → Providers → Google → Enable**.  
   Add your Google OAuth **Client ID** and **Client Secret**, then set the redirect URL to:
   ```
   http://localhost:3000/auth/callback
   ```
5. Copy your keys from **Project Settings → API**:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **Anon / publishable key**

> **Getting Google OAuth credentials:** Go to [console.cloud.google.com](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID → Web application. Add `http://localhost:3000` as an authorised origin and `http://localhost:3000/auth/callback` as a redirect URI.

---

### Step 3 — Get a Gemini API key

Gemini generates the in-depth explanations. The app calls it only the *first* time each question is opened, then caches the answer — so it stays comfortably within the free tier.

1. Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**.
2. Click **Create API key → Create API key in a new project**.
3. Copy the key — it starts with `AIza` (~39 characters).

---

### Step 4 — Configure environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in your values:

```env
# Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key

# Google Gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.5-flash

# Per-user daily token budget (blocks generation once exceeded)
DAILY_TOKEN_LIMIT=500000
```

**Gemini model options:**

| Model | Free-tier requests/day | Quality |
|---|---|---|
| `gemini-2.5-flash` | ~20 | Best |
| `gemini-2.0-flash` | ~200 | Good |

Since answers are cached after the first generation, each question costs **one request, ever**.

---

### Step 5 — Run

```bash
npm run dev        # starts on http://localhost:3000
```

Other handy scripts:

```bash
npm run parse      # regenerate src/data/curriculum.json from content/curriculum/
npm run build      # production build
npm run dev:fresh  # kills stale dev server and restarts
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, and start learning.

---

## ☁️ Deploy to Vercel

1. Push the repo to GitHub.
2. On **[vercel.com](https://vercel.com/)** → **New Project** → import your `flutterify` repo.
3. Add the same environment variables under **Project → Settings → Environment Variables**.
4. In Supabase, add your Vercel URL to Google OAuth redirect URLs:
   ```
   https://your-app.vercel.app/auth/callback
   ```
5. Deploy — Vercel rebuilds automatically on every push to `main`.

---

## 🔑 How AI + caching works

1. You open a question → the app checks Supabase for a cached answer.
2. **Cache hit** → returns instantly, zero tokens used.
3. **Cache miss** → calls Gemini with a tuned prompt (simple English, behind-the-scenes depth, length adapted to topic), stores the answer and flashcards, then returns it.
4. Marking a question **done** records progress (logic questions require submitting code first).

This keeps the app fast, cheap, and consistent — everyone sees the same high-quality explanation.

---

## 📜 License

Personal / educational project. Use it, learn from it, make it your own.

<div align="center">

Made with ☕ and a lot of `setState()`.

</div>
