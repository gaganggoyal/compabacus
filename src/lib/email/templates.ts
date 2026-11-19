import "server-only";
import { foundersLine, site, slotRules, times } from "../config";
import type { Award, Registration, School } from "../db/schema";
import { gradeById, gradeLabel, totalQuestions } from "../exam/papers";
import { AWARD_META, fmtDate, fmtDateTime } from "../format";
import { rupees } from "../pricing";
import { type Slot, calendarLink, slotAt, slotLabel } from "../slots";

export type EmailMessage = { to: string; subject: string; html: string; text: string };

/** Building blocks; each renders to both HTML and plain text, so every email has a readable text version. */
type Part =
  | { h: string }
  | { p: string }
  | { note: string }
  | { facts: [string, string][] }
  | { button: string; href: string }
  | { link: string; href: string };

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const abs = (path: string) => `${site.url}${path}`;
const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

function partHtml(part: Part) {
  if ("h" in part) return `<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#15123b;">${esc(part.h)}</h1>`;
  if ("p" in part) return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#2b2840;">${esc(part.p)}</p>`;
  if ("note" in part)
    return `<p style="margin:0 0 14px;padding:12px 14px;border-radius:10px;background:#fff7e6;font-size:14px;line-height:1.55;color:#7a4b00;">${esc(part.note)}</p>`;
  if ("facts" in part)
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 18px;background:#f5f3ff;border-radius:12px;"><tr><td style="padding:14px 18px 6px;">${part.facts
      .map(
        ([k, v]) =>
          `<div style="font-size:12px;color:#6b6880;">${esc(k)}</div><div style="margin:2px 0 10px;font-size:16px;font-weight:700;color:#15123b;">${esc(v)}</div>`,
      )
      .join("")}</td></tr></table>`;
  if ("button" in part)
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 20px;"><tr><td style="border-radius:999px;background:#f59e0b;"><a href="${esc(part.href)}" style="display:inline-block;padding:13px 26px;border-radius:999px;font-size:15px;font-weight:700;color:#15123b;text-decoration:none;">${esc(part.button)}</a></td></tr></table>`;
  return `<p style="margin:0 0 14px;font-size:14px;"><a href="${esc(part.href)}" style="color:#4f46e5;font-weight:600;">${esc(part.link)}</a></p>`;
}

function partText(part: Part) {
  if ("h" in part) return part.h.toUpperCase();
  if ("p" in part) return part.p;
  if ("note" in part) return `> ${part.note}`;
  if ("facts" in part) return part.facts.map(([k, v]) => `${k}: ${v}`).join("\n");
  if ("button" in part) return `${part.button}: ${part.href}`;
  return `${part.link}: ${part.href}`;
}

function render(to: string, subject: string, preheader: string, parts: Part[]): EmailMessage {
  const host = site.url.replace(/^https?:\/\//, "");
  const footerText = `Questions? Reply to this email or WhatsApp us on ${site.contact.phone}.\n${site.shortName} · founded by ${foundersLine()} · ${site.contact.city}\n${site.url}`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f1ea;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f1ea;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td style="background:#15123b;padding:22px 28px;">
<div style="font-size:21px;font-weight:800;color:#ffffff;">&#127942; ${esc(site.shortName)}</div>
<div style="margin-top:4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fcd34d;">${esc(site.event)}</div>
</td></tr>
<tr><td style="padding:28px 28px 10px;">${parts.map(partHtml).join("\n")}</td></tr>
<tr><td style="padding:18px 28px 24px;border-top:1px solid #eeeae0;font-size:12px;line-height:1.7;color:#77748a;">
Questions? Reply to this email or WhatsApp us on ${esc(site.contact.phone)}.<br>
${esc(site.shortName)} &middot; founded by ${esc(foundersLine())} &middot; ${esc(site.contact.city)}<br>
<a href="${esc(site.url)}" style="color:#4f46e5;">${esc(host)}</a>
</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${parts.map(partText).join("\n\n")}\n\n--\n${footerText}\n`;
  return { to, subject, html, text };
}

const EXAM_WINDOW = `${fmtDate(times.examStart, { day: "numeric", month: "long", year: undefined })} to ${fmtDate(times.examEnd, { day: "numeric", month: "long", year: "numeric" })}`;
const RESULTS_AT = `${fmtDate(times.resultsAt, { day: "numeric", month: "long", year: "numeric" })}, 12:00 AM IST`;

type Reg = Pick<Registration, "id" | "regNo" | "studentName" | "parentName" | "grade" | "email" | "paymentNote" | "feeAmount" | "slotStart" | "schoolId">;

export function registeredEmail(r: Reg, upi: { vpa: string; ready: boolean }): EmailMessage {
  const fee = rupees(r.feeAmount);
  return render(r.email!, `${r.studentName} is registered · ${r.regNo}`, `Registration number ${r.regNo}. Next step: pay ${fee} to confirm.`, [
    { h: `Welcome to ${site.shortName}!` },
    { p: `Hi ${firstName(r.parentName)}, thank you for registering ${r.studentName} for the ${site.name}.` },
    {
      facts: [
        ["Registration number", r.regNo],
        ["Student", r.studentName],
        ["Class", gradeLabel(r.grade)],
        ["Exam window", `${EXAM_WINDOW}, online from home`],
      ],
    },
    { p: "Keep this email. You log in with the registration number above and the 6-digit PIN you created. We never send your PIN by email." },
    {
      p: upi.ready
        ? `Next step: pay ${fee} by UPI to ${upi.vpa}, then enter the 12-digit UPI reference number (UTR) on the payment page. After that, book a one-hour exam slot in December.`
        : `Next step: pay ${fee} by UPI on the payment page, then enter the 12-digit UPI reference number (UTR). After that, book a one-hour exam slot in December.`,
    },
    { button: `Pay ${fee} and confirm`, href: abs("/dashboard/payment") },
    { link: "Practise with free mock tests", href: abs(`/practice?class=${r.grade}`) },
  ]);
}

export function paymentVerifiedEmail(r: Reg): EmailMessage {
  const g = gradeById(r.grade);
  const slot = slotAt(r.slotStart);
  return render(r.email!, `Payment verified: ${r.studentName} is confirmed`, slot ? `Exam slot: ${slotLabel(slot)}.` : "Next: book your exam slot.", [
    { h: "You're all set!" },
    { p: `Hi ${firstName(r.parentName)}, we have verified the ${rupees(r.feeAmount)} payment for ${r.studentName} (${r.regNo}). ${r.studentName} is confirmed for the ${gradeLabel(r.grade)} paper.` },
    {
      facts: [
        ...(g ? ([["Paper", `${totalQuestions(g.paper)} multiple-choice questions · ${g.paper.durationSec / 60} minutes`]] as [string, string][]) : []),
        ["Exam slot", slot ? slotLabel(slot) : "Not booked yet: pick a one-hour slot in December"],
        ["Results", RESULTS_AT],
      ],
    },
    { p: "Use a phone, tablet or computer with a steady internet connection. There is one attempt, so practise first with the free mock tests." },
    slot ? { button: "Open dashboard", href: abs("/dashboard") } : { button: "Book your exam slot", href: abs("/dashboard/slot") },
    { link: "Free mock tests", href: abs(`/practice?class=${r.grade}`) },
  ]);
}

export function slotBookedEmail(r: Reg, slot: Slot): EmailMessage {
  const g = gradeById(r.grade);
  return render(r.email!, `Exam slot booked: ${slotLabel(slot)}`, `${r.studentName} can start the exam any time during this hour.`, [
    { h: "Exam slot booked" },
    { p: `Hi ${firstName(r.parentName)}, ${r.studentName}'s exam slot is booked.` },
    {
      facts: [
        ["Slot", slotLabel(slot)],
        ["Student", `${r.studentName} (${r.regNo})`],
        ...(g ? ([["Paper", `${gradeLabel(r.grade)} · ${totalQuestions(g.paper)} questions · ${g.paper.durationSec / 60} minutes`]] as [string, string][]) : []),
      ],
    },
    { p: `Log in a few minutes early and press Start any time during the ${slotRules.minutes}-minute slot. If you miss it, book another open slot from the dashboard.` },
    { button: "Add to Google Calendar", href: calendarLink(slot, `${site.shortName} exam: ${r.studentName}`, `Log in at ${abs("/login")} with ${r.regNo} and start the exam during this hour.`) },
    { link: "Open dashboard", href: abs("/dashboard") },
  ]);
}

type SchoolMsg = Pick<School, "code" | "name" | "contactName" | "email" | "feeAmount" | "paymentNote">;

export function schoolRegisteredEmail(s: SchoolMsg, upi: { vpa: string; ready: boolean }): EmailMessage {
  const fee = rupees(s.feeAmount);
  return render(s.email, `${s.name} is registered · ${s.code}`, `School code ${s.code}. Next step: pay ${fee} to confirm.`, [
    { h: `Welcome to ${site.shortName}!` },
    { p: `Hi ${firstName(s.contactName)}, thank you for registering ${s.name} for the ${site.name}.` },
    {
      facts: [
        ["School code", s.code],
        ["Login", `${s.email} and the password you chose`],
        ["School fee", `${fee}, one time, any number of students`],
      ],
    },
    {
      p: upi.ready
        ? `Next step: pay ${fee} by UPI to ${upi.vpa}, then enter the 12-digit UPI reference number (UTR) in your school dashboard.`
        : `Next step: pay ${fee} by UPI from your school dashboard, then enter the 12-digit UPI reference number (UTR).`,
    },
    { p: "You can add students right away. Every student gets a registration number and PIN that you can print as login slips." },
    { button: "Open school dashboard", href: abs("/schools/dashboard") },
  ]);
}

export function schoolPaymentVerifiedEmail(s: SchoolMsg): EmailMessage {
  return render(s.email, `Payment verified: ${s.name} is confirmed`, "Your students can now book exam slots.", [
    { h: "Your school is confirmed!" },
    { p: `Hi ${firstName(s.contactName)}, we have verified the ${rupees(s.feeAmount)} payment for ${s.name} (${s.code}). Every student you add is covered.` },
    { p: "Next: add your students, print their login slips, and book a one-hour exam slot for each student (or let them book it themselves)." },
    { button: "Open school dashboard", href: abs("/schools/dashboard") },
  ]);
}

export function schoolPaymentRejectedEmail(s: SchoolMsg): EmailMessage {
  return render(s.email, `Action needed: payment for ${s.code} not verified`, "Please check the UPI reference number and submit it again.", [
    { h: "We couldn't verify your payment" },
    { p: `Hi ${firstName(s.contactName)}, we couldn't match the UPI reference entered for ${s.name} (${s.code}) with a ${rupees(s.feeAmount)} payment in our account.` },
    ...(s.paymentNote ? [{ note: s.paymentNote }] : []),
    { p: "Please check the 12-digit UTR in your UPI app and submit it again from the school dashboard." },
    { button: "Fix payment", href: abs("/schools/dashboard/payment") },
  ]);
}

export function paymentRejectedEmail(r: Reg): EmailMessage {
  return render(r.email!, `Action needed: payment for ${r.regNo} not verified`, "Please check the UPI reference number and submit it again.", [
    { h: "We couldn't verify your payment" },
    { p: `Hi ${firstName(r.parentName)}, we couldn't match the UPI reference you entered for ${r.studentName} (${r.regNo}) with a ${rupees(r.feeAmount)} payment in our account.` },
    ...(r.paymentNote ? [{ note: r.paymentNote }] : []),
    { p: "Please check the 12-digit UTR in your UPI app and submit it again. If you haven't paid yet, you can pay on the same page." },
    { button: "Fix payment", href: abs("/dashboard/payment") },
  ]);
}

export function examSubmittedEmail(r: Reg, submittedAt: Date): EmailMessage {
  return render(r.email!, `${r.studentName}'s paper is submitted`, `Results on ${RESULTS_AT}.`, [
    { h: "Paper received" },
    { p: `Hi ${firstName(r.parentName)}, we received ${r.studentName}'s ${gradeLabel(r.grade)} paper on ${fmtDateTime(submittedAt)} IST.` },
    {
      facts: [
        ["Results", RESULTS_AT],
        ["Certificate", "Every child who completes the exam gets a verified e-certificate"],
      ],
    },
    { button: "Open dashboard", href: abs("/dashboard") },
  ]);
}

export type ResultInfo = { award: Award; rank: number; score: number; maxScore: number; certNo: string };

export function resultsEmail(r: Reg, a: ResultInfo): EmailMessage {
  const meta = AWARD_META[a.award];
  const podium = a.award === "champion" || a.award === "runner_up_1" || a.award === "runner_up_2";
  return render(r.email!, `${meta.emoji} Results are out: ${r.studentName}, ${meta.label}`, `${r.studentName}'s certificate is ready to download.`, [
    { h: podium ? `Congratulations, ${firstName(r.studentName)}!` : "Results are out!" },
    { p: `Hi ${firstName(r.parentName)}, here is ${r.studentName}'s result in the ${gradeLabel(r.grade)} category of the ${site.name}.` },
    {
      facts: [
        ["Award", meta.label],
        ["Rank in class", `#${a.rank}`],
        ["Score", `${a.score} / ${a.maxScore}`],
        ["Certificate no.", a.certNo],
      ],
    },
    ...(a.award === "champion"
      ? [
          {
            note: `🎁 As the class topper, ${firstName(r.studentName)} has also won a surprise gift voucher! ${
              r.schoolId ? "We'll send it through the school." : "We'll send it to your registered email or mobile number soon."
            } We never ask for any payment, OTP or bank details.`,
          },
        ]
      : []),
    { button: "Download certificate", href: abs(`/certificate/${encodeURIComponent(a.certNo)}`) },
    { link: "See the Hall of Fame", href: abs("/results") },
  ]);
}

export function pinResetEmail(r: Reg, link: string): EmailMessage {
  return render(r.email!, `Reset your ${site.shortName} PIN`, "This link works once and expires in 30 minutes.", [
    { h: "Set a new PIN" },
    { p: `Hi ${firstName(r.parentName)}, we received a request to reset the login PIN for ${r.studentName} (${r.regNo}).` },
    { button: "Set a new PIN", href: link },
    { p: "This link works once and expires in 30 minutes. If you didn't ask for it, ignore this email and your PIN stays the same." },
  ]);
}

export function testEmail(to: string): EmailMessage {
  return render(to, `${site.shortName} test email`, "If you can read this, emails are working.", [
    { h: "Emails are working" },
    { p: `This is a test email from the ${site.shortName} organiser panel, sent on ${fmtDateTime(Date.now())} IST.` },
    { link: "Open the organiser panel", href: abs("/admin/emails") },
  ]);
}
