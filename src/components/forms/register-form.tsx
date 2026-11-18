"use client";

import { Check, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, startTransition } from "react";
import { type FormState, registerAction } from "@/app/actions/student";
import { Field, btn, cn, inputCls } from "@/components/ui";
import { INDIAN_STATES, ageGroupFor, ageOn } from "@/lib/config";
import { LEVELS } from "@/lib/exam/levels";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  const [dob, setDob] = useState("");
  const [level, setLevel] = useState("");
  const [stateName, setStateName] = useState("");
  const e = state.errors ?? {};

  const group = /^\d{4}-\d{2}-\d{2}$/.test(dob) ? ageGroupFor(dob) : null;
  const age = /^\d{4}-\d{2}-\d{2}$/.test(dob) ? ageOn(dob) : null;

  return (
    <form
      action={action}
      onSubmit={(ev) => {
        ev.preventDefault();
        const fd = new FormData(ev.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-10"
      noValidate
    >
      {state.message && (
        <div className={cn("rounded-2xl px-4 py-3 text-sm font-medium", state.errors ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800")} role="alert">
          {state.message}
        </div>
      )}

      <fieldset>
        <legend className="font-display text-xl font-bold">Student details</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Student's full name" error={e.studentName} hint="Printed exactly like this on the certificate" className="sm:col-span-2">
            <input name="studentName" autoComplete="off" className={inputCls} aria-invalid={!!e.studentName} placeholder="e.g. Aarav Sharma" />
          </Field>
          <Field label="Date of birth" error={e.dob} hint={group ? undefined : "Age is counted as on 1 Dec 2026"}>
            <input
              type="date"
              name="dob"
              value={dob}
              onChange={(ev) => setDob(ev.target.value)}
              min="2008-01-01"
              max="2023-12-31"
              className={inputCls}
              aria-invalid={!!e.dob}
            />
            {group && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" /> Age {age} → Group {group.id} · {group.label}
              </span>
            )}
            {!group && age !== null && !e.dob && <span className="mt-1.5 block text-xs font-semibold text-rose-600">Age {age} is outside 4–18</span>}
          </Field>
          <Field label="Gender (optional)">
            <select name="gender" defaultValue="" className={inputCls}>
              <option value="">Prefer not to say</option>
              <option value="girl">Girl</option>
              <option value="boy">Boy</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="School / abacus academy (optional)" className="sm:col-span-2">
            <input name="school" className={inputCls} placeholder="Shown on the certificate" />
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl font-bold">Competition level</legend>
        <p className="mt-1 text-sm text-ink/60">
          Choose what your child has learnt so far. Not sure?{" "}
          <Link href="/practice" target="_blank" className="font-semibold text-indigo-600 underline-offset-2 hover:underline">
            Try a free mock test
          </Link>
          .
        </p>
        {e.level && <p className="mt-2 text-sm font-medium text-rose-600">{e.level}</p>}
        <input type="hidden" name="level" value={level} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {LEVELS.map((l) => (
            <button
              type="button"
              key={l.id}
              onClick={() => setLevel(l.id)}
              aria-pressed={level === l.id}
              className={cn(
                "relative rounded-2xl bg-white p-4 text-left ring-1 transition",
                level === l.id ? "ring-2 ring-indigo-600 shadow-lg shadow-indigo-600/10" : "ring-ink/12 hover:ring-ink/30",
              )}
            >
              {level === l.id && (
                <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
              <p className="font-display font-bold">
                {l.name} <span className="text-xs font-semibold text-ink/40">{l.id}</span>
              </p>
              <p className="mt-0.5 text-sm text-ink/70">{l.short}</p>
              <p className="mt-1 text-xs text-ink/45">{l.suitedFor}</p>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-xl font-bold">Parent / guardian</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Parent / guardian name" error={e.parentName}>
            <input name="parentName" autoComplete="name" className={inputCls} aria-invalid={!!e.parentName} />
          </Field>
          <Field label="Mobile number (WhatsApp preferred)" error={e.phone}>
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" className={inputCls} aria-invalid={!!e.phone} placeholder="98XXXXXXXX" />
          </Field>
          <Field label="Email (optional)" error={e.email}>
            <input name="email" type="email" autoComplete="email" className={inputCls} aria-invalid={!!e.email} />
          </Field>
          <Field label="City / town" error={e.city}>
            <input name="city" autoComplete="address-level2" className={inputCls} aria-invalid={!!e.city} />
          </Field>
          <Field label="State" error={e.state}>
            <select name="state" value={stateName} onChange={(ev) => setStateName(ev.target.value)} className={inputCls} aria-invalid={!!e.state}>
              <option value="" disabled>
                Select state
              </option>
              {INDIAN_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          {stateName === "Outside India" && (
            <Field label="Country">
              <input name="country" className={inputCls} />
            </Field>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="flex items-center gap-2 font-display text-xl font-bold">
          <Lock className="h-5 w-5 text-indigo-600" /> Create a login PIN
        </legend>
        <p className="mt-1 text-sm text-ink/60">
          You&apos;ll log in with your Registration Number + this PIN to take the exam and download the certificate.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="6-digit PIN" error={e.pin}>
            <input name="pin" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" className={inputCls} aria-invalid={!!e.pin} />
          </Field>
          <Field label="Confirm PIN" error={e.pinConfirm}>
            <input name="pinConfirm" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" className={inputCls} aria-invalid={!!e.pinConfirm} />
          </Field>
        </div>
      </fieldset>

      <div className="rounded-2xl bg-indigo-50/70 p-5 ring-1 ring-indigo-100">
        <label className="flex gap-3 text-sm leading-relaxed text-ink/80">
          <input type="checkbox" name="consent" className="mt-1 h-4 w-4 shrink-0 accent-indigo-600" />
          <span>
            I am the parent / legal guardian of this child. I consent to the collection of the details above to run the competition and
            publish the child&apos;s first name, last initial, city and result if they win. I agree to the{" "}
            <Link href="/rules" target="_blank" className="font-semibold text-indigo-700 underline">
              rules
            </Link>
            ,{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-indigo-700 underline">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-indigo-700 underline">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {e.consent && <p className="mt-2 text-sm font-medium text-rose-600">{e.consent}</p>}
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={pending} className={btn("primary", "lg")}>
          {pending ? "Creating registration…" : "Continue to payment · ₹10"}
        </button>
        <p className="flex items-center gap-1.5 text-sm text-ink/50">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Your details are never shared or sold.
        </p>
      </div>
    </form>
  );
}
