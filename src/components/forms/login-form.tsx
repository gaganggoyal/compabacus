"use client";

import { KeyRound, Search } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useRef, useState } from "react";
import { type FormState, type LookupState, loginAction, lookupByPhoneAction } from "@/app/actions/student";
import { WhatsAppIcon, whatsappLink } from "@/components/brand";
import { Field, btn, cn, inputCls } from "@/components/ui";
import { site } from "@/lib/config";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  const [lookup, lookupAction, lookingUp] = useActionState<LookupState, FormData>(lookupByPhoneAction, {});
  const [showLookup, setShowLookup] = useState(false);
  const regRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <form
        action={action}
        onSubmit={(e) => {
          // Submit without React's automatic form reset so the registration number stays filled after a wrong PIN.
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("next", new URLSearchParams(window.location.search).get("next") ?? "");
          startTransition(() => action(fd));
        }}
        className="space-y-5"
      >
        {state.message && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">
            {state.message}
          </p>
        )}
        <Field label="Registration number" hint={`Looks like ${site.regPrefix}-123456`}>
          <input
            ref={regRef}
            name="regNo"
            autoCapitalize="characters"
            autoComplete="username"
            className={cn(inputCls, "uppercase")}
            placeholder={`${site.regPrefix}-______`}
            required
          />
        </Field>
        <Field label="6-digit PIN">
          <input name="pin" type="password" inputMode="numeric" maxLength={6} autoComplete="current-password" className={inputCls} required />
        </Field>
        <button type="submit" disabled={pending} className={cn(btn("primary", "lg"), "w-full")}>
          <KeyRound className="h-4 w-4" /> {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="mt-8 border-t border-ink/10 pt-6">
        <button type="button" onClick={() => setShowLookup((s) => !s)} className="text-sm font-semibold text-indigo-600 hover:underline">
          Forgot your registration number?
        </button>
        {showLookup && (
          <form action={lookupAction} className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input name="phone" type="tel" inputMode="tel" placeholder="Registered mobile number" className={inputCls} required />
              <button type="submit" disabled={lookingUp} className={btn("dark")}>
                <Search className="h-4 w-4" />
              </button>
            </div>
            {lookup.message && <p className="text-sm text-ink/60">{lookup.message}</p>}
            {lookup.results && (
              <ul className="divide-y divide-ink/8 rounded-2xl bg-ink/[0.03] ring-1 ring-ink/8">
                {lookup.results.map((r) => (
                  <li key={r.regNo}>
                    <button
                      type="button"
                      onClick={() => {
                        if (regRef.current) regRef.current.value = r.regNo;
                      }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-ink/5"
                    >
                      <span>
                        <b>{r.name}</b> · {r.grade}
                      </span>
                      <span className="font-mono font-semibold text-indigo-700">{r.regNo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        )}
        <p className="mt-5 text-sm text-ink/55">
          Forgot your PIN?{" "}
          <Link href="/forgot-pin" className="font-semibold text-indigo-600 hover:underline">
            Reset it by email
          </Link>
          , or{" "}
          <a
            href={whatsappLink("Hi, I forgot my PIN for the abacus championship. My registration number is: ")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline"
          >
            <WhatsAppIcon className="h-4 w-4" /> message us
          </a>
          .
        </p>
      </div>
    </div>
  );
}
