# Kudos Cup Abacus Championship 2026

An online abacus competition site for children from Nursery to Class 12 (ages 4–18). Registration costs ₹499 per child, with a launch offer of ₹10 until 25 December 2026; schools pay ₹9,999 (launch offer ₹999) for unlimited students. Payment is by UPI QR. Students book a one-hour exam slot between 1 and 31 December 2026, and winners are announced automatically at midnight IST on 1 January 2027.

Kudos Cup is the brand for this and future championships, founded by Gagan (Founder) and Vansh (Co-founder). This championship runs at https://kudoscup.com.

## Features

**Pricing, slots and schools**
- Prices live in `pricing` in `src/lib/config.ts`: regular ₹499 / school ₹9,999, launch offer ₹10 / ₹999 until `offerEndsAt` (25 Dec 2026, 11:59 PM IST).
  - The offer is real: afterwards, new sign-ups pay the regular price. Every registration and school stores the fee it signed up with (`fee_amount`), so the price shown at sign-up is the price they pay, even if they pay later.
  - Pages show the strikethrough price and a countdown, and switch to the regular price by themselves within about 5 minutes of the deadline (cached with `cacheLife`, no redeploy needed).
- Exam slots (`src/lib/slots.ts`): 156 one-hour slots across December (school-day evenings, more at weekends and on 25 Dec), 100 seats each (`slotRules`).
  - Seat counts are real bookings. "Filling fast" shows only when a slot is 70% booked; full slots can't be picked. Booking is atomic, so a slot never overfills.
  - Students book after paying. The exam can only be started during the booked hour; a student who misses it books another open slot.
  - Public schedule at `/schedule` and on the home page.
- School accounts (`/schools`): one fee for any number of students.
  - The school adds students one by one or by pasting a class list (Name, DOB, Class), prints login slips with PINs, downloads a CSV, books one slot for a whole class, and sees every result.
  - School students pay nothing themselves: their payment status mirrors the school's. Their PINs are stored encrypted (AES-GCM, key from `SESSION_SECRET`) so the school can reprint slips; logins still check the scrypt hash.

**For parents and students**
- Landing page with a live countdown, the exam format, categories, awards, key dates and FAQ.
- Registration in about 2 minutes. The parent picks the child's class (Nursery to Class 12) and sets a 6-digit PIN. The form checks that the child's age fits the class, so nobody can take an easier paper.
- Payment with a ₹10 UPI QR or a "pay with UPI app" button. The parent then enters the 12-digit UTR from their app.
- A dashboard showing progress, payment status and exam status, plus an admit card and the result with a certificate download.
- Unlimited free mock tests for every class, with instant scoring and an answer review showing the right option.
- The timed exam:
  - Every question is multiple choice: 4 options, one correct. The wrong options are realistic slips (a column off by 10 or 100, a forgotten row, a wrong sign), most share the answer's last digit, and the correct option's position is random, so guessing and elimination tricks don't help.
  - Every child gets a unique paper of the same difficulty, with no repeated questions.
  - The clock runs on the server, and answers autosave every 8 seconds.
  - Students can resume after a disconnect, and the paper submits itself when time runs out.
  - Each Flash Round question can be played once.
  - Leaving the exam screen is counted. Three or more exits flag the attempt for review.
- The results Hall of Fame, published automatically at New Year midnight.
- PDF certificates with a QR code, signed by the founders, and a public page to verify any certificate.
- Emails to the parent:
  - On registration, with the registration number and how to pay.
  - When a payment is verified or rejected.
  - When the exam is submitted.
  - With the result and certificate link.
- "Forgot PIN?" by email: a single-use link that works for 30 minutes.

**For the organiser (`/admin`)**
- An overview with stats, verified revenue, registrations per day and a breakdown by category.
- Registrations with search and filters, CSV export, PIN reset and "mark paid" for cash payments.
- Payments:
  - Verify or reject each one.
  - Bulk verify: paste your bank statement and every matching UTR is approved.
- Exam attempts: flagged list, disqualify or restore, and allow a retake.
- Results: compute and preview, publish now, hide, or automatic reveal. Results export as CSV.
- Emails: a log of every email with its delivery status, a "send test email" button, and one click to email results to every family.

## Competition format

Each class has its own paper and its own ranking. Every paper ends with a Flash Round, where numbers flash one at a time and the child picks the total.

| Class | Paper | Questions | Time | Ages allowed |
| --- | --- | --- | --- | --- |
| Nursery | 1-digit addition, 2 rows + Flash Round | 25 | 6 min | 4–5 |
| LKG | 1-digit addition, 3 rows + Flash Round | 30 | 7 min | 4–6 |
| UKG | 1-digit add & subtract, 3 rows + Flash Round | 35 | 8 min | 4–7 |
| Class 1 | 1-digit add & subtract, 4 rows + Flash Round | 35 | 8 min | 5–8 |
| Class 2 | 1-digit add & subtract, 5 rows, with small & big friends + Flash Round | 40 | 10 min | 6–9 |
| Class 3 | 2-digit sums (3 rows), 2×1 multiplication + Flash Round | 45 | 10 min | 7–10 |
| Class 4 | 2-digit sums (4 rows), 2×1 & 3×1 multiplication + Flash Round | 45 | 10 min | 8–11 |
| Class 5 | 2-digit sums (5 rows), multiplication, division by 1 digit + Flash Round | 55 | 12 min | 9–12 |
| Class 6 | 3-digit sums (4 rows), 3×1 & 2×2, 3-digit ÷ 1-digit + Flash Round | 55 | 12 min | 10–13 |
| Class 7 | 3-digit sums (5 rows), 2×2 & 3×2, division by 1 digit + Flash Round | 55 | 12 min | 11–14 |
| Class 8 | 3–4 digit sums (5 rows), 3×2, division by 1–2 digits + Flash Round | 55 | 12 min | 12–15 |
| Class 9 | 4-digit sums (5 rows), 3×2 & 4×2, 4-digit ÷ 2-digit + Flash Round | 55 | 12 min | 13–16 |
| Class 10 | 4-digit sums (6 rows), 4×2, 4–5 digit ÷ 2-digit + Flash Round | 55 | 12 min | 14–17 |
| Class 11 | 4–5 digit sums (6 rows), 4×2 & 3×3, 5-digit ÷ 2-digit + Flash Round | 55 | 12 min | 15–18 |
| Class 12 | 5-digit sums (6 rows), 4×3, 5–6 digit ÷ 2–3 digit + Flash Round | 55 | 12 min | 16–18 |

"Ages allowed" is the age on 1 December 2026: the typical age for the class plus or minus a year.

Students are ranked within their class by score, then by shorter time taken, then by earlier submission. There is no negative marking. The awards are:
- Champion, 1st Runner-up and 2nd Runner-up for ranks 1–3 in each class.
- Distinction for 90% or more, and Merit for 75% or more.
- Participation for everyone else who completes the exam.

Edit the class papers (rows, digits, question counts, timings, allowed ages) in `src/lib/exam/papers.ts`. Edit the brand and event name, dates, contact details and prizes in `src/lib/config.ts`.

## Run locally

```bash
npm install
cp .env.example .env.local      # then fill in the values
npm run db:push                 # creates the SQLite tables in local.db
npm run dev                     # http://localhost:3000
```

The organiser panel is at `/admin` and uses the `ADMIN_PASSWORD` from `.env.local`. Setting `EXAM_TEST_MODE=true` lets you take the real exam before 1 December for testing.

## Deploy

The live site runs on the VPS at 161.97.97.34, next to the other apps there.

| | |
| --- | --- |
| Address | https://kudoscup.com (www redirects to it) |
| App | `/var/www/kudoscup`, run by the `kudoscup` system user |
| Service | `kudoscup.service` (systemd), port 3400. Logs: `journalctl -u kudoscup -f` |
| Settings and secrets | `/var/www/kudoscup/.env.production.local` (chmod 600) |
| Database | `/var/lib/kudoscup/abacus.db` (SQLite) |
| Backups | daily at 03:30 to `/var/backups/kudoscup`, kept 14 days (`/etc/cron.d/kudoscup-backup`) |
| HTTPS | the shared Caddy container. The block is in `deploy/Caddyfile.snippet`, appended to `/root/cricketverse_deploy/deployment/vps/Caddyfile` |

**To deploy an update:** run `./scripts/deploy.sh` from this folder. It uploads the code, then on the server installs packages, builds, adds any new database tables or columns, restarts the service and checks it came up. It refuses to apply a database change that would lose data.

**Future championships:** give each one its own subdomain (for example `maths.kudoscup.com`), deployment and database. Keep this one at kudoscup.com, because its certificate QR codes point there.

### SEO and the sitemap

- One sitemap serves phones and computers: **https://kudoscup.com/sitemap.xml**. The site is responsive (same URLs and content on every device), so Google's mobile-first crawler uses the same list.
- To submit it: in [Google Search Console](https://search.google.com/search-console), add a **Domain** property for `kudoscup.com`, add the TXT record it shows at Nameslink, verify, then open **Sitemaps** and submit `sitemap.xml`. In [Bing Webmaster Tools](https://www.bing.com/webmasters), import the site from Search Console.
- Optional: to verify with an HTML tag instead of DNS, set `GOOGLE_SITE_VERIFICATION` (and `BING_SITE_VERIFICATION`) in `.env.production.local` and redeploy.
- Every public page has a title, description and canonical URL. The home page carries `EducationEvent` (with both offers), `FAQPage`, `Organization` and `WebSite` structured data. Private pages are `noindex` or blocked in `robots.txt`.

### Emails

Emails go out through Resend, from `noreply@kudoscup.com`. Replies go to `hello@kudoscup.com`, an inbox in Resend (resend.com/inboxes).

- Kudos Cup has its own Resend account on the Free plan: 100 emails a day and 3,000 a month. Results day needs one email per student. With more than about 100 students, click "Send result emails" once a day until none are waiting, or upgrade to Pro ($20) for that month.
- The domain is in the Tokyo region (ap-northeast-1), with sending and receiving on. Its DNS records are at Nameslink.
- The server uses a sending-only API key limited to kudoscup.com. It is `RESEND_API_KEY` in `.env.production.local` (after changing it, run `systemctl restart kudoscup`).

Without a key, emails are recorded as "not sent" in `/admin/emails` and nothing else is affected. Optional settings: `EMAIL_FROM` and `EMAIL_REPLY_TO`.

## Go-live checklist (before 1 Dec)

- [x] Domain kudoscup.com pointed at the VPS.
- [x] Emails switched on (see "Emails" above). Send yourself a test from `/admin/emails` to see what parents get.
- [x] `hello@kudoscup.com` is a Resend inbox (resend.com/inboxes). Parents' replies go there.
- [x] Contact phone and WhatsApp: +91 95696 08101 (in `src/lib/config.ts`).
- [ ] In `src/lib/config.ts`, confirm the city, and set `organiser` to your registered business name if you have one.
- [x] `UPI_ID` is set to the Paytm UPI ID. The payment page shows "payments open soon" whenever no real UPI ID is set.
- [x] `ADMIN_PASSWORD` and `SESSION_SECRET` are generated fresh on the server.
- [x] `NEXT_PUBLIC_SITE_URL=https://kudoscup.com`. It's used in certificate QR codes, so don't change it after results are out.
- [x] **`EXAM_TEST_MODE=false`** on the server.
- [ ] Review the policy pages (`/terms`, `/privacy`, `/refund-policy`, `/rules`). They're templates.
- [ ] Do a full test run: register, pay ₹10, take a mock test, then check `/admin`.

## Running the event

- **Daily in Nov–Dec:** open `/admin/payments`, paste the day's UPI statement into Bulk verify, then handle any leftovers by hand.
- **Throughout December:** check `/admin/attempts?filter=flagged` and disqualify only with good reason.
- **By 31 Dec, 11:59 PM:** make sure every payment is verified. Only verified payments are ranked.
- **1 Jan, 12:00 AM:** results compute and publish themselves. Nothing to do. Use `/admin/results` to preview them early or to hide them in an emergency.
- **1 Jan, morning:** open `/admin/emails` and click **Email results to families**. It's safe to click again, because families already emailed are skipped.

## Tech stack

Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS 4 · Drizzle ORM + libSQL/SQLite · jose (sessions) · zod · qrcode · pdf-lib.

Main files:
- `src/lib/exam/papers.ts`: the class-wise papers.
- `src/lib/exam/generator.ts`: seeded question generator, including the abacus "direct move" rules for the youngest classes and the multiple-choice options.
- `src/components/exam/exam-runner.tsx`: the exam and practice interface.
- `src/app/actions/*`: server actions for registration, payment, exam and admin.
- `src/lib/results.ts`: ranking and awards.
- `src/lib/certificate.ts`: certificate PDF.
- `src/lib/email/*`: email templates, sending (Resend, rate-limited, logged) and the triggers.
- `deploy/` and `scripts/`: the systemd unit, the Caddy block, the deploy script and the nightly backup.
