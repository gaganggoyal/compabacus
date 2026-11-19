"use client";

import { Eye, EyeOff, KeyRound, Lock, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  type SchoolFormState,
  addSchoolStudentAction,
  bulkAddStudentsAction,
  registerSchoolAction,
  removeSchoolStudentAction,
  resetSchoolStudentPinAction,
  schoolBulkBookAction,
  schoolLoginAction,
} from "@/app/actions/school";
import { useOfferLive } from "@/components/offer-countdown";
import { Field, btn, cn, inputCls } from "@/components/ui";
import { INDIAN_STATES, pricing } from "@/lib/config";
import { GRADES } from "@/lib/exam/papers";
import { rupees } from "@/lib/pricing";
import { SCHEDULE, seatsLeft, slotDay, slotState, slotTime } from "@/lib/slots";

/** Submits without React resetting the inputs, so a validation error never wipes what was typed. */
function keepValues(action: (fd: FormData) => void) {
  return (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    startTransition(() => action(fd));
  };
}

function Notice({ state }: { state: SchoolFormState }) {
  if (!state.message) return null;
  return (
    <p className={cn("rounded-2xl px-4 py-3 text-sm font-medium", state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700")} role="alert">
      {state.message}
    </p>
  );
}

export function SchoolRegisterForm() {
  const [state, action, pending] = useActionState<SchoolFormState, FormData>(registerSchoolAction, {});
  const live = useOfferLive();
  const e = state.errors ?? {};
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-8" noValidate>
      <Notice state={state} />
      <fieldset>
        <legend className="font-display text-xl font-bold">School details</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="School name" error={e.name} hint="Printed on your students' certificates" className="sm:col-span-2">
            <input name="name" className={inputCls} aria-invalid={!!e.name} placeholder="e.g. Sunrise Public School" />
          </Field>
          <Field label="City" error={e.city}>
            <input name="city" className={inputCls} aria-invalid={!!e.city} autoComplete="address-level2" />
          </Field>
          <Field label="State" error={e.state}>
            <select name="state" defaultValue="" className={inputCls} aria-invalid={!!e.state}>
              <option value="" disabled>
                Choose state
              </option>
              {INDIAN_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
      </fieldset>
      <fieldset>
        <legend className="font-display text-xl font-bold">Contact person</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Name" error={e.contactName} hint="Principal, coordinator or abacus teacher">
            <input name="contactName" className={inputCls} aria-invalid={!!e.contactName} autoComplete="name" />
          </Field>
          <Field label="Mobile (WhatsApp)" error={e.phone}>
            <input name="phone" inputMode="tel" className={inputCls} aria-invalid={!!e.phone} autoComplete="tel" placeholder="98765 43210" />
          </Field>
          <Field label="Email" error={e.email} hint="You log in with this email" className="sm:col-span-2">
            <input name="email" type="email" className={inputCls} aria-invalid={!!e.email} autoComplete="email" />
          </Field>
          <Field label="Password" error={e.password} hint="At least 8 characters">
            <input name="password" type="password" className={inputCls} aria-invalid={!!e.password} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" error={e.passwordConfirm}>
            <input name="passwordConfirm" type="password" className={inputCls} aria-invalid={!!e.passwordConfirm} autoComplete="new-password" />
          </Field>
        </div>
      </fieldset>
      <label className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-ink/10">
        <input type="checkbox" name="consent" className="mt-0.5 h-5 w-5 rounded accent-indigo-600" />
        <span className="text-ink/70">
          The students we register have their parents&apos; consent to take part, and we accept the{" "}
          <Link href="/terms" className="font-semibold text-indigo-600 underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-indigo-600 underline">
            privacy policy
          </Link>
          .{e.consent && <span className="mt-1 block font-semibold text-rose-600">{e.consent}</span>}
        </span>
      </label>
      <button type="submit" disabled={pending} className={cn(btn("gold", "lg"), "w-full")}>
        {pending ? "Creating school account…" : `Create school account · ${rupees(live ? pricing.school.offer : pricing.school.regular)}`}
      </button>
    </form>
  );
}

export function SchoolLoginForm() {
  const [state, action, pending] = useActionState<SchoolFormState, FormData>(schoolLoginAction, {});
  return (
    <form action={action} onSubmit={keepValues(action)} className="space-y-4">
      <Notice state={state} />
      <Field label="School email or school code">
        <input name="login" className={inputCls} autoComplete="username" placeholder="you@school.edu.in or KCS26-12345" required />
      </Field>
      <Field label="Password">
        <input name="password" type="password" className={inputCls} autoComplete="current-password" required />
      </Field>
      <button type="submit" disabled={pending} className={cn(btn("primary", "lg"), "w-full")}>
        <Lock className="h-4 w-4" /> {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}

function AddedList({ state }: { state: SchoolFormState }) {
  if (!state.added?.length && !state.skipped?.length) return null;
  return (
    <div className="space-y-3">
      {!!state.added?.length && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-emerald-200">
          <p className="bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-emerald-800">Added · logins (also in the list below)</p>
          <ul className="max-h-64 divide-y divide-ink/6 overflow-y-auto bg-white text-sm">
            {state.added.map((a) => (
              <li key={a.regNo} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
                <span className="font-semibold">{a.name}</span>
                <span className="font-mono text-xs">
                  {a.regNo} · PIN <b>{a.pin}</b>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!!state.skipped?.length && (
        <div className="overflow-hidden rounded-2xl ring-1 ring-amber-200">
          <p className="bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-amber-800">Skipped</p>
          <ul className="max-h-48 divide-y divide-ink/6 overflow-y-auto bg-white text-sm">
            {state.skipped.map((s, i) => (
              <li key={i} className="px-4 py-2">
                <span className="font-semibold">{s.name}</span>: <span className="text-ink/65">{s.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AddStudentForm() {
  const [state, action, pending] = useActionState<SchoolFormState, FormData>(addSchoolStudentAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  // Clear the form after a successful add, ready for the next student; keep it on errors.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  const e = state.errors ?? {};
  return (
    <form ref={formRef} action={action} onSubmit={keepValues(action)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Student's full name" error={e.studentName} className="sm:col-span-2">
          <input name="studentName" className={inputCls} aria-invalid={!!e.studentName} placeholder="As it should appear on the certificate" />
        </Field>
        <Field label="Date of birth" error={e.dob}>
          <input type="date" name="dob" min="2008-01-01" max="2023-12-31" className={inputCls} aria-invalid={!!e.dob} />
        </Field>
        <Field label="Class" error={e.grade}>
          <select name="grade" defaultValue="" className={inputCls} aria-invalid={!!e.grade}>
            <option value="" disabled>
              Choose class
            </option>
            {GRADES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gender (optional)">
          <select name="gender" defaultValue="" className={inputCls}>
            <option value="">Prefer not to say</option>
            <option value="girl">Girl</option>
            <option value="boy">Boy</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Parent's name (optional)">
          <input name="parentName" className={inputCls} />
        </Field>
        <Field label="Parent's mobile (optional)" error={e.phone}>
          <input name="phone" inputMode="tel" className={inputCls} aria-invalid={!!e.phone} />
        </Field>
        <Field label="Parent's email (optional)" error={e.email} hint="Gets slot confirmations and the result">
          <input name="email" type="email" className={inputCls} aria-invalid={!!e.email} />
        </Field>
      </div>
      <Notice state={state} />
      <AddedList state={state} />
      <button type="submit" disabled={pending} className={btn("primary")}>
        {pending ? "Adding…" : "Add student"}
      </button>
    </form>
  );
}

export function BulkAddForm() {
  const [state, action, pending] = useActionState<SchoolFormState, FormData>(bulkAddStudentsAction, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="One student per line: Name, Date of birth, Class (optional: parent mobile, parent email)" hint="Copy the columns straight from Excel or Google Sheets. Up to 300 lines at a time.">
        <textarea
          name="rows"
          rows={8}
          className={cn(inputCls, "font-mono text-sm")}
          placeholder={"Aarav Sharma, 14-05-2017, Class 3, 9876543210\nDiya Patel, 02-11-2019, UKG\nKabir Singh, 21-08-2014, 6, , kabir.parent@gmail.com"}
        />
      </Field>
      <Notice state={state} />
      <AddedList state={state} />
      <button type="submit" disabled={pending} className={btn("primary")}>
        <Users className="h-4 w-4" /> {pending ? "Adding students…" : "Add all students"}
      </button>
    </form>
  );
}

export function BulkBookForm({ counts, asOf, grades }: { counts: Record<string, number>; asOf: number; grades: { id: string; label: string; waiting: number }[] }) {
  const [state, action, pending] = useActionState<SchoolFormState, FormData>(schoolBulkBookAction, {});
  const options = useMemo(
    () =>
      SCHEDULE.map((d) => ({
        day: d.day,
        slots: d.slots
          .map((s) => ({ ...s, left: seatsLeft(counts[s.start] ?? 0), state: slotState(s, counts[s.start] ?? 0, asOf) }))
          .filter((s) => s.state === "open" || s.state === "filling"),
      })).filter((d) => d.slots.length),
    [counts, asOf],
  );
  const waitingTotal = grades.reduce((n, g) => n + g.waiting, 0);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Students without a slot">
          <select name="grade" defaultValue="all" className={inputCls}>
            <option value="all">All classes ({waitingTotal})</option>
            {grades
              .filter((g) => g.waiting)
              .map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label} ({g.waiting})
                </option>
              ))}
          </select>
        </Field>
        <Field label="Slot (IST)">
          <select name="slot" defaultValue="" className={inputCls} required>
            <option value="" disabled>
              Choose a slot
            </option>
            {options.map((d) => (
              <optgroup key={d.day} label={slotDay(Date.parse(`${d.day}T12:00:00+05:30`))}>
                {d.slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {slotDay(s.start)} · {slotTime(s.start)} ({s.left} seats left)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
      </div>
      <Notice state={state} />
      <button type="submit" disabled={pending || !waitingTotal} className={btn("primary")}>
        {pending ? "Booking…" : "Book this slot"}
      </button>
    </form>
  );
}

export function StudentPin({ pin }: { pin: string | null }) {
  const [show, setShow] = useState(false);
  if (!pin) return <span className="text-xs text-ink/40">Reset to view</span>;
  return (
    <button type="button" onClick={() => setShow((s) => !s)} className="inline-flex items-center gap-1.5 font-mono text-sm" aria-label={show ? "Hide PIN" : "Show PIN"}>
      {show ? pin : "••••••"}
      {show ? <EyeOff className="h-3.5 w-3.5 text-ink/40" /> : <Eye className="h-3.5 w-3.5 text-ink/40" />}
    </button>
  );
}

const small = "inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition disabled:opacity-50";

export function StudentActions({ id, name, canRemove }: { id: string; name: string; canRemove: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {msg && <span className="rounded-full bg-amber-100 px-3 py-1 font-mono text-xs font-bold text-amber-900">{msg}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Give ${name} a new PIN? The old PIN stops working.`)) return;
          start(async () => {
            const r = await resetSchoolStudentPinAction(id);
            setMsg(r.pin ? `New PIN ${r.pin}` : (r.error ?? "Failed"));
          });
        }}
        className={cn(small, "bg-ink/5 text-ink hover:bg-ink/10")}
      >
        <KeyRound className="h-3.5 w-3.5" /> New PIN
      </button>
      {canRemove && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm(`Remove ${name}? This deletes the registration.`)) return;
            start(async () => {
              const r = await removeSchoolStudentAction(id);
              if (r.error) setMsg(r.error);
            });
          }}
          className={cn(small, "bg-rose-50 text-rose-700 hover:bg-rose-100")}
          aria-label={`Remove ${name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
