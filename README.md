# Abacus Stars Championship 2026

An online abacus competition site for children aged 4–18. Registration costs ₹10, paid by UPI QR. The exam window is open from 1 to 31 December 2026, and winners are announced automatically at midnight IST on 1 January 2027.

## Features

**For parents and students**
- Landing page with a live countdown, the exam format, categories, awards, key dates and FAQ.
- Registration in about 2 minutes. The age group is assigned automatically from the date of birth, and the parent picks a level and sets a 6-digit PIN.
- Payment with a ₹10 UPI QR or a "pay with UPI app" button. The parent then enters the 12-digit UTR from their app.
- A dashboard showing progress, payment status and exam status, plus an admit card and the result with a certificate download.
- Unlimited free mock tests for all 7 levels, with instant scoring and answer review.
- The timed exam:
  - Every child gets a unique paper of the same difficulty.
  - The clock runs on the server, and answers autosave every 8 seconds.
  - Students can resume after a disconnect, and the paper submits itself when time runs out.
  - Each Flash Round question can be played once.
  - Leaving the exam screen is counted. Three or more exits flag the attempt for review.
- The results Hall of Fame, published automatically at New Year midnight.
- PDF certificates with a QR code, and a public page to verify any certificate.

**For the organiser (`/admin`)**
- An overview with stats, verified revenue, registrations per day and a breakdown by category.
- Registrations with search and filters, CSV export, PIN reset and "mark paid" for cash payments.
- Payments:
  - Verify or reject each one.
  - Bulk verify: paste your bank statement and every matching UTR is approved.
- Exam attempts: flagged list, disqualify or restore, and allow a retake.
- Results: compute and preview, publish now, hide, or automatic reveal. Results export as CSV.

## Competition format

| Level | Content | Questions | Time |
| --- | --- | --- | --- |
| L0 Starter | 1-digit, 3 rows, addition (direct) + flash | 35 | 8 min |
| L1 Beginner | 1-digit, 4 rows, ± direct + flash | 45 | 8 min |
| L2 Junior | 1-digit, 5 rows, with formulas + flash | 45 | 10 min |
| L3 Intermediate | 2-digit 4 rows, 2×1 multiplication + flash | 55 | 10 min |
| L4 Advanced | 2-digit 5 rows, ×, ÷ by 1 digit + flash | 60 | 12 min |
| L5 Expert | 3-digit 5 rows, 3×1/2×2, 3–4 ÷ 1 + flash | 60 | 12 min |
| L6 Grand Master | 3–4 digit 6 rows, 3×2/4×1, 4÷2 + flash | 60 | 12 min |

Age groups are A 4–6, B 7–8, C 9–10, D 11–12, E 13–14 and F 15–18, by age on 1 December 2026. Each combination of age group and level is ranked separately.

Students are ranked by score, then by shorter time taken, then by earlier submission. The awards are:
- Champion, 1st Runner-up and 2nd Runner-up for ranks 1–3 in each category.
- Distinction for 90% or more, and Merit for 75% or more.
- Participation for everyone else who completes the exam.

Edit the levels in `src/lib/exam/levels.ts`. Edit the name, dates, contact details, age groups and prizes in `src/lib/config.ts`.

## Run locally

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run db:push                 # creates the SQLite tables in local.db
npm run dev                     # http://localhost:3000
```

The organiser panel is at `/admin` and uses the `ADMIN_PASSWORD` from `.env.local`. Setting `EXAM_TEST_MODE=true` lets you take the real exam before 1 December for testing.

## Deploy

The site needs a Node.js host and a database. Either option below works with no code changes.

**Option A: Vercel + Turso (managed, free tiers)**
1. Create a Turso database. Copy its `libsql://…` URL and an auth token.
2. Run `DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run db:push` once.
3. Import the GitHub repo into Vercel and set these environment variables: `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`, `UPI_ID`, `UPI_PAYEE_NAME` and `EXAM_TEST_MODE=false`.
4. Add your domain.

**Option B: a single VPS**
1. Run `npm ci && npm run build`.
2. Set `DATABASE_URL=file:/var/data/abacus.db` and run `npm run db:push`.
3. Start the site with `npm start` behind nginx or Caddy with HTTPS, and keep it running with pm2 or systemd.
4. Back up the `.db` file daily.

## Go-live checklist (before 1 Dec)

- [ ] Change the name, organiser, contact phone, WhatsApp and email in `src/lib/config.ts`.
- [ ] Set `UPI_ID` and `UPI_PAYEE_NAME` to your real UPI account. A current account or UPI business account is best for exporting statements.
- [ ] Set a strong `ADMIN_PASSWORD` and a fresh `SESSION_SECRET` (`openssl rand -hex 32`).
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the live domain. It's used in certificate QR codes.
- [ ] Set **`EXAM_TEST_MODE=false`**.
- [ ] Review the policy pages (`/terms`, `/privacy`, `/refund-policy`, `/rules`). They're templates.
- [ ] Do a full test run: register, pay ₹10, take a mock test, then check `/admin`.

## Running the event

- **Daily in Nov–Dec:** open `/admin/payments`, paste the day's UPI statement into Bulk verify, then handle any leftovers by hand.
- **Throughout December:** check `/admin/attempts?filter=flagged` and disqualify only with good reason.
- **By 31 Dec, 11:59 PM:** make sure every payment is verified. Only verified payments are ranked.
- **1 Jan, 12:00 AM:** results compute and publish themselves. Nothing to do. Use `/admin/results` to preview them early or to hide them in an emergency.

## Tech stack

Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS 4 · Drizzle ORM + libSQL/SQLite · jose (sessions) · zod · qrcode · pdf-lib.

Main files:
- `src/lib/exam/generator.ts`: seeded question generator, including the abacus "direct move" rules for beginner levels.
- `src/components/exam/exam-runner.tsx`: the exam and practice interface.
- `src/app/actions/*`: server actions for registration, payment, exam and admin.
- `src/lib/results.ts`: ranking and awards.
- `src/lib/certificate.ts`: certificate PDF.
