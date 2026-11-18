"use client";

import { useActionState } from "react";
import { type FormState, submitUtrAction } from "@/app/actions/student";
import { Field, btn, cn, inputCls } from "@/components/ui";

export function UtrForm({ existing }: { existing?: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitUtrAction, {});
  return (
    <form action={action} className="space-y-4">
      <Field
        label="UPI reference / UTR number"
        error={state.errors?.utr}
        hint="12 digits — find it in your UPI app under the payment details (called UTR, UPI Ref. No. or Transaction ID)"
      >
        <input
          name="utr"
          defaultValue={existing ?? ""}
          inputMode="text"
          autoComplete="off"
          placeholder="e.g. 434512345678"
          className={cn(inputCls, "font-mono text-lg tracking-wider")}
          aria-invalid={!!state.errors?.utr}
          required
        />
      </Field>
      {state.message && !state.errors && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{state.message}</p>}
      <button type="submit" disabled={pending} className={cn(btn("primary", "lg"), "w-full")}>
        {pending ? "Submitting…" : existing ? "Update transaction ID" : "I've paid — submit"}
      </button>
    </form>
  );
}
