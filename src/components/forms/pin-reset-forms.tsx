"use client";

import { KeyRound, MailCheck } from "lucide-react";
import { useActionState } from "react";
import { type FormState, requestPinResetAction, resetPinWithTokenAction } from "@/app/actions/student";
import { Field, btn, cn, inputCls } from "@/components/ui";
import { site } from "@/lib/config";

export function ForgotPinForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPinResetAction, {});
  const e = state.errors ?? {};
  if (state.ok) {
    return (
      <div className="flex gap-3 rounded-2xl bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-900 ring-1 ring-emerald-200" role="status">
        <MailCheck className="h-5 w-5 shrink-0 text-emerald-600" />
        <p>{state.message}</p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {state.message}
        </p>
      )}
      <Field label="Registration number" error={e.regNo} hint={`Looks like ${site.regPrefix}-123456`}>
        <input name="regNo" autoCapitalize="characters" autoComplete="username" className={cn(inputCls, "uppercase")} aria-invalid={!!e.regNo} required />
      </Field>
      <Field label="Parent email used at registration" error={e.email}>
        <input name="email" type="email" inputMode="email" autoComplete="email" className={inputCls} aria-invalid={!!e.email} required />
      </Field>
      <button type="submit" disabled={pending} className={cn(btn("primary", "lg"), "w-full")}>
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
    </form>
  );
}

export function ResetPinForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPinWithTokenAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
          {state.message}
        </p>
      )}
      <input type="hidden" name="token" value={token} />
      <Field label="New 6-digit PIN" error={e.pin}>
        <input name="pin" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" className={inputCls} aria-invalid={!!e.pin} required />
      </Field>
      <Field label="Confirm new PIN" error={e.pinConfirm}>
        <input name="pinConfirm" type="password" inputMode="numeric" maxLength={6} autoComplete="new-password" className={inputCls} aria-invalid={!!e.pinConfirm} required />
      </Field>
      <button type="submit" disabled={pending} className={cn(btn("primary", "lg"), "w-full")}>
        <KeyRound className="h-4 w-4" /> {pending ? "Saving…" : "Save PIN and log in"}
      </button>
    </form>
  );
}
