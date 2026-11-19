"use client";

import { Check, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, startTransition } from "react";
import { type FormState, registerAction } from "@/app/actions/student";
import { Field, btn, cn, inputCls } from "@/components/ui";
import { INDIAN_STATES, MAX_AGE, MIN_AGE, ageOn } from "@/lib/config";
import { GRADES, STAGES, gradeById, totalQuestions } from "@/lib/exam/papers";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});
  const [dob, setDob] = useState("");
  const [grade, setGrade] = useState("");
  const [stateName, setStateName] = useState("");
  const e = state.errors ?? {};

  const age = /^\d{4}-\d{2}-\d{2}$/.test(dob) ? ageOn(dob) : null;
  const ageOk = age !== null && age >= MIN_AGE && age <= MAX_AGE;
  const chosen = gradeById(grade);
  const classMismatch = chosen && ageOk && (age < chosen.ages[0] || age > chosen.ages[1]);

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
          <Field label="Date of birth" error={e.dob} hint={ageOk ? undefined : "Age is counted as on 1 Dec 2026"}>
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
            {ageOk && !e.dob && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" /> Age {age} on 1 Dec 2026
              </span>
            )}
            {!ageOk && age !== null && !e.dob && (
              <span className="mt-1.5 block text-xs font-semibold text-rose-600">
                Age {age} is outside {MIN_AGE}–{MAX_AGE}
              </span>
            )}
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
        <legend className="font-display text-xl font-bold">Class</legend>
        <p className="mt-1 text-sm text-ink/60">
          Your child&apos;s school class in the current session. Every class gets its own paper and its own ranking.{" "}
          <Link href="/practice" target="_blank" className="font-semibold text-indigo-600 underline-offset-2 hover:underline">
            See a free mock test
          </Link>
          .
        </p>
        {e.grade && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{e.grade}</p>}
        <input type="hidden" name="grade" value={grade} />
        <div className="mt-4 space-y-4">
          {STAGES.map((st) => (
            <div key={st.id}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink/40">{st.label}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {GRADES.filter((g) => g.stage === st.id).map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => setGrade(g.id)}
                    aria-pressed={grade === g.id}
                    className={cn(
                      "rounded-xl px-2 py-2.5 text-center text-sm font-bold ring-1 transition",
                      grade === g.id ? "bg-indigo-600 text-white ring-indigo-600 shadow-md shadow-indigo-600/20" : "bg-white text-ink ring-ink/12 hover:ring-ink/30",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {chosen && (
          <div className={cn("mt-4 rounded-2xl px-4 py-3 text-sm", classMismatch ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200" : "bg-indigo-50/70 text-ink/75")}>
            {classMismatch ? (
              <>
                <b>{chosen.label}</b> is for children aged {chosen.ages[0]}–{chosen.ages[1]} on 1 Dec 2026, but the date of birth gives age {age}.
                Please check both.
              </>
            ) : (
              <>
                <b className="text-ink">{chosen.label} paper:</b> {chosen.summary} · {totalQuestions(chosen.paper)} multiple-choice questions ·{" "}
                {chosen.paper.durationSec / 60} minutes
              </>
            )}
          </div>
        )}
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
          <Field label="Parent email" error={e.email} hint="We email the registration number, payment confirmation and results">
            <input name="email" type="email" inputMode="email" autoComplete="email" className={inputCls} aria-invalid={!!e.email} placeholder="name@gmail.com" />
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
