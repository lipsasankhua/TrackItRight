# TrackItRight

AI-powered client communication and deadline tracker for service firms — law offices, architecture studios, interior design agencies, and creative agencies.

**Developed by Lipsa Sankhua**
Built during internship at Talking Crooks IT Pvt. Ltd.

**Live demo:** https://trackitright.netlify.app
**Backend API:** https://trackitright.onrender.com

---

## What it does

Client requests come in through calls, WhatsApp messages, voice notes, and emails, and small firms often lose track of them — a deadline gets missed, or extra work gets done but never billed, simply because no one wrote it down in time.

TrackItRight captures client messages (typed text or voice notes), automatically extracts deadlines, tasks, and change requests using an LLM, and logs each one with proof of exactly when and how the client asked for it — so there's never a disputed "the client never said that" moment. It also keeps a running total of unbilled extra work, so firms can see, in real numbers, how much they're leaving on the table.

## Features

- **AI-powered extraction** — paste or type a client message, and it's automatically classified as a deadline, a task, or extra/unbilled work, with a summary, due date, and estimated value pulled out by an LLM
- **Voice note transcription** — upload an audio file (e.g. a WhatsApp voice note); it's transcribed to text and run through the same extraction pipeline
- **Proof of record** — every extracted entry is permanently linked to the original raw message and its timestamp, viewable via "View proof" on the Timeline
- **Unbilled work tracker** — running total of extra work requested but not yet billed, with a mark-as-billed action
- **Deadline dashboard** — upcoming deadlines surfaced before they're missed, plus a breakdown chart of requests by type
- **Semantic similarity detection (RAG)** — new messages are compared against a client's past messages using locally-generated embeddings, flagging possibly related or repeat requests
- **Client reports** — per-client summary of all logged activity

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router, Recharts, lucide-react |
| Backend | Node.js, Express |
| Database | SQLite (via sql.js) |
| AI — extraction | Groq API |
| AI — transcription | Groq Whisper (`whisper-large-v3-turbo`) |
| AI — similarity (RAG) | Local embeddings via `@xenova/transformers` — no external API dependency |
| Deployment | Backend on Render, frontend on Netlify |

## Running locally

**Backend**
```bash
cd backend
npm install
npm run dev
```
Runs on `http://localhost:5000`. Requires a `.env` file in `backend/`:
```

PORT=5000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`.

> The frontend's `src/api/client.js` points at the live Render backend by default. To test against your local backend instead, change `BASE_URL` in that file to `http://localhost:5000`.

## Project structure

```
trackitright/
├── backend/
│   ├── server.js
│   ├── routes/          # clients, entries, dashboard, unbilled, reports
│   ├── services/        # aiExtraction, transcription, embeddings
│   └── db/               # schema.sql, db.js, seed.js
└── frontend/
    └── src/
        ├── pages/        # Login, Dashboard, ConversationPanel, Timeline, UnbilledTracker, Reports
        ├── components/   # Sidebar
        └── api/          # client.js
```

## Database

Three core tables: `clients`, `messages` (raw text, source, embedding), and `entries` (AI-extracted structured data, linked back to its source message). Full schema details are in the accompanying Database Schema Design document.

## Scope notes

- Designed for WhatsApp Business API and call-transcription integration; simulated via manual text input and file upload in this version, since those integrations require third-party business approval outside prototype scope.
- Login is UI-only in this version — no backend credential verification.
- The deployed backend runs on Render's free tier, which has a non-persistent filesystem; the app automatically re-seeds demo data on startup so the live demo is never empty, but any additional data added live will not survive a service restart.

## Future work

- Live WhatsApp Business API and call-transcription integration
- Authenticated multi-user accounts per firm
- Automatic deadline alerts via email/SMS
- PDF export for client-shareable reports
- Migration to a persistent managed database (PostgreSQL) for production use
