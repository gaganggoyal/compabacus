import { type SQL, and, count, desc, eq, like, or } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { PaymentActions, ResetPinButton } from "@/components/admin/admin-forms";
import { Badge, PageLoading, cn, inputCls } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { PAYMENT_STATUSES } from "@/lib/db/schema";
import { GRADES, gradeLabel } from "@/lib/exam/papers";
import { fmtDateTime } from "@/lib/format";

const PAGE = 50;

export default function RegistrationsPage({ searchParams }: PageProps<"/admin/registrations">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Registrations searchParams={searchParams} />
    </Suspense>
  );
}

function payTone(s: string) {
  return s === "verified" ? "emerald" : s === "submitted" ? "amber" : s === "rejected" ? "rose" : "slate";
}

async function Registrations({ searchParams }: { searchParams: PageProps<"/admin/registrations">["searchParams"] }) {
  await requireAdmin();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = str("q").trim();
  const pay = str("pay");
  const grade = str("grade");
  const page = Math.max(1, Number(str("page")) || 1);

  const where: SQL[] = [];
  if (q) {
    const p = `%${q}%`;
    where.push(
      or(
        like(schema.registrations.studentName, p),
        like(schema.registrations.regNo, p),
        like(schema.registrations.phone, p),
        like(schema.registrations.city, p),
        like(schema.registrations.parentName, p),
        like(schema.registrations.email, p),
        like(schema.registrations.utr, p),
      )!,
    );
  }
  if ((PAYMENT_STATUSES as readonly string[]).includes(pay)) where.push(eq(schema.registrations.paymentStatus, pay as (typeof PAYMENT_STATUSES)[number]));
  if (grade) where.push(eq(schema.registrations.grade, grade));
  const cond = where.length ? and(...where) : undefined;

  const [{ n }] = await db.select({ n: count() }).from(schema.registrations).where(cond);
  const rows = await db
    .select()
    .from(schema.registrations)
    .where(cond)
    .orderBy(desc(schema.registrations.createdAt))
    .limit(PAGE)
    .offset((page - 1) * PAGE);
  const pages = Math.max(1, Math.ceil(n / PAGE));
  const qs = (p: number) => {
    const u = new URLSearchParams({ q, pay, grade, page: String(p) });
    return `/admin/registrations?${u.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <h1 className="font-display text-3xl font-bold">Registrations</h1>
        <p className="text-sm text-ink/55">{n} found</p>
      </div>
      <form className="grid gap-2 rounded-2xl bg-white p-3 ring-1 ring-ink/8 sm:grid-cols-[2fr_1fr_1fr_auto]">
        <input name="q" defaultValue={q} placeholder="Search name, reg no, phone, email, city, UTR…" className={inputCls} />
        <select name="pay" defaultValue={pay} className={inputCls}>
          <option value="">Any payment</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="grade" defaultValue={grade} className={inputCls}>
          <option value="">Any class</option>
          {GRADES.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-white">
          Filter
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink/8">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <thead className="border-b border-ink/8 text-xs uppercase tracking-wider text-ink/45">
            <tr>
              <th className="px-4 py-3">Reg no.</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Registered</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/6">
            {rows.map((r) => (
              <tr key={r.id} className="align-top hover:bg-indigo-50/30">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{r.regNo}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{r.studentName}</p>
                  <p className="text-xs text-ink/50">
                    {r.dob} · {r.city}, {r.state}
                  </p>
                  {r.school && <p className="text-xs text-ink/40">{r.school}</p>}
                </td>
                <td className="px-4 py-3 text-xs font-semibold">{gradeLabel(r.grade)}</td>
                <td className="px-4 py-3 text-xs">
                  <p>{r.parentName}</p>
                  <a href={`https://wa.me/${r.phone.startsWith("+") ? r.phone.slice(1) : `91${r.phone}`}`} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                    {r.phone}
                  </a>
                  {r.email && <p className="text-ink/45">{r.email}</p>}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={payTone(r.paymentStatus)}>{r.paymentStatus}</Badge>
                  {r.utr && <p className="mt-1 font-mono text-[11px] text-ink/50">{r.utr}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-ink/55">{fmtDateTime(r.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-end gap-1.5">
                    <PaymentActions id={r.id} status={r.paymentStatus} />
                    <ResetPinButton id={r.id} regNo={r.regNo} />
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink/45">
                  No registrations match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
            .map((p) => (
              <Link
                key={p}
                href={qs(p)}
                className={cn("grid h-9 min-w-9 place-items-center rounded-full px-3 font-semibold", p === page ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10")}
              >
                {p}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
