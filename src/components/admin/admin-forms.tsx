"use client";

import { Ban, Check, KeyRound, RotateCcw, Undo2, X } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import {
  type BulkState,
  adminLoginAction,
  bulkVerifyAction,
  computeResultsAction,
  disqualifyAttemptAction,
  markPaidManuallyAction,
  rejectPaymentAction,
  resetAttemptAction,
  resetPinAction,
  restoreAttemptAction,
  setResultsModeAction,
  verifyPaymentAction,
} from "@/app/actions/admin";
import { btn, cn, inputCls } from "@/components/ui";
import type { ResultsMode } from "@/lib/settings";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, {});
  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="password" name="password" placeholder="Admin password" className={inputCls} autoComplete="current-password" required />
      {state.message && <p className="text-sm font-medium text-rose-600">{state.message}</p>}
      <button type="submit" disabled={pending} className={cn(btn("primary"), "w-full")}>
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}

const small = "inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition disabled:opacity-50";

export function PaymentActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {status === "submitted" && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => verifyPaymentAction(id))}
            className={cn(small, "bg-emerald-600 text-white hover:bg-emerald-500")}
          >
            <Check className="h-3.5 w-3.5" /> Verify
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const note = window.prompt("Reason shown to the parent (optional):", "We could not find this UPI reference in our account. Please check and re-submit.");
              if (note !== null) start(() => rejectPaymentAction(id, note));
            }}
            className={cn(small, "bg-rose-50 text-rose-700 hover:bg-rose-100")}
          >
            <X className="h-3.5 w-3.5" /> Reject
          </button>
        </>
      )}
      {(status === "unpaid" || status === "rejected") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Mark this registration as paid (e.g. cash received)?")) start(() => markPaidManuallyAction(id));
          }}
          className={cn(small, "bg-ink/5 text-ink hover:bg-ink/10")}
        >
          Mark paid
        </button>
      )}
    </div>
  );
}

export function ResetPinButton({ id, regNo }: { id: string; regNo: string }) {
  const [pending, start] = useTransition();
  const [pin, setPin] = useState<string | null>(null);
  return pin ? (
    <span className="rounded-full bg-amber-100 px-3 py-1 font-mono text-xs font-bold text-amber-900" title="Share this with the parent">
      New PIN {pin}
    </span>
  ) : (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Reset the PIN for ${regNo}?`)) return;
        start(async () => {
          const r = await resetPinAction(id);
          setPin(r.pin);
        });
      }}
      className={cn(small, "bg-ink/5 text-ink hover:bg-ink/10")}
    >
      <KeyRound className="h-3.5 w-3.5" /> Reset PIN
    </button>
  );
}

export function BulkVerifyForm() {
  const [state, action, pending] = useActionState<BulkState, FormData>(bulkVerifyAction, {});
  return (
    <form action={action} className="space-y-3">
      <textarea
        name="utrs"
        rows={6}
        className={cn(inputCls, "font-mono text-sm")}
        placeholder={"Paste UTR numbers or copy-paste rows from your bank / UPI statement.\nEvery matching pending payment will be verified."}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={btn("primary", "sm")}>
          {pending ? "Matching…" : "Verify matching payments"}
        </button>
        {state.message && <span className="text-sm text-ink/60">{state.message}</span>}
        {state.matched != null && (
          <span className="text-sm font-semibold text-emerald-700">
            ✓ {state.matched} verified
            {state.unmatched?.length ? <span className="font-normal text-ink/50"> · {state.unmatched.length} 12-digit numbers had no pending match</span> : null}
          </span>
        )}
      </div>
    </form>
  );
}

export function AttemptActions({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {status === "submitted" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const reason = window.prompt("Disqualification reason (shown to the parent):", "Unfair means detected during review");
            if (reason !== null) start(() => disqualifyAttemptAction(id, reason));
          }}
          className={cn(small, "bg-rose-50 text-rose-700 hover:bg-rose-100")}
        >
          <Ban className="h-3.5 w-3.5" /> Disqualify
        </button>
      )}
      {status === "disqualified" && (
        <button type="button" disabled={pending} onClick={() => start(() => restoreAttemptAction(id))} className={cn(small, "bg-ink/5 hover:bg-ink/10")}>
          <Undo2 className="h-3.5 w-3.5" /> Restore
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Delete this attempt and allow a fresh exam? This cannot be undone.")) start(() => resetAttemptAction(id));
        }}
        className={cn(small, "bg-ink/5 hover:bg-ink/10")}
      >
        <RotateCcw className="h-3.5 w-3.5" /> Allow retake
      </button>
    </div>
  );
}

export function ResultsControls({ mode }: { mode: ResultsMode }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { m: "auto", l: "Auto — reveal at the scheduled time" },
            { m: "published", l: "Publish now" },
            { m: "hidden", l: "Hide results" },
          ] as const
        ).map((o) => (
          <button
            key={o.m}
            type="button"
            disabled={pending}
            onClick={() => {
              if (o.m === "published" && !window.confirm("Publish results to everyone right now?")) return;
              start(() => setResultsModeAction(o.m));
            }}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
              mode === o.m ? "bg-ink text-white ring-ink" : "bg-white text-ink/70 ring-ink/15 hover:ring-ink/30",
            )}
          >
            {o.l}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await computeResultsAction();
              setMsg(`Ranked ${r.ranked} students across ${r.categories} categories.`);
            })
          }
          className={btn("primary", "sm")}
        >
          {pending ? "Working…" : "Compute / refresh rankings"}
        </button>
        {msg && <span className="text-sm text-emerald-700">{msg}</span>}
      </div>
    </div>
  );
}
