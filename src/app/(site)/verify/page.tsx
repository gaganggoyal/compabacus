import { BadgeCheck, Search, ShieldX } from "lucide-react";
import type { Metadata } from "next";
import { requestNow } from "@/lib/now";
import { Suspense } from "react";
import { Card, Eyebrow, btn, cn, inputCls } from "@/components/ui";
import { site } from "@/lib/config";
import { gradeLabel } from "@/lib/exam/papers";
import { AWARD_META } from "@/lib/format";
import { certificateByNo, resultsLive } from "@/lib/results";

export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Check that a Kudos Cup certificate is genuine by its certificate number or QR code.",
  alternates: { canonical: "/verify" },
};

export default function VerifyPage({ searchParams }: PageProps<"/verify">) {
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <Eyebrow>Certificate verification</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Is this certificate genuine?</h1>
          <p className="mt-2 text-ink/60">Enter the certificate number printed at the bottom, or scan the QR code on the certificate.</p>
        </div>
        <Suspense fallback={<VerifyForm />}>
          <VerifyResult searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

function VerifyForm({ value }: { value?: string }) {
  return (
    <form action="/verify" className="mt-8 flex gap-2">
      <input name="cert" defaultValue={value} placeholder={`e.g. ${site.certPrefix}-7KQ2M9P`} className={cn(inputCls, "font-mono uppercase")} required />
      <button type="submit" className={btn("primary")}>
        <Search className="h-4 w-4" /> Verify
      </button>
    </form>
  );
}

async function VerifyResult({ searchParams }: { searchParams: PageProps<"/verify">["searchParams"] }) {
  const now = await requestNow();
  const { cert } = await searchParams;
  const certNo = typeof cert === "string" ? cert.trim().toUpperCase() : "";
  if (!certNo) return <VerifyForm />;
  const live = await resultsLive(now);
  const c = live ? await certificateByNo(certNo) : null;

  return (
    <>
      <VerifyForm value={certNo} />
      <Card className="mt-6 p-8 text-center">
        {c && c.award ? (
          <>
            <BadgeCheck className="mx-auto h-12 w-12 text-emerald-600" />
            <p className="mt-3 text-sm font-bold uppercase tracking-wider text-emerald-700">Valid certificate</p>
            <p className="mt-3 font-display text-3xl font-bold">{c.studentName}</p>
            <p className="mt-1 text-ink/60">
              {c.city}, {c.state}
            </p>
            <p className="mt-5 inline-flex rounded-full bg-ink px-4 py-1.5 font-semibold text-white">
              {AWARD_META[c.award].emoji} {AWARD_META[c.award].label}
            </p>
            <p className="mt-4 text-sm text-ink/60">
              {gradeLabel(c.grade)} · Score {c.score}/{c.maxScore}
              {c.rank ? ` · Rank ${c.rank}` : ""}
            </p>
            <p className="mt-2 font-mono text-xs text-ink/40">{c.certNo}</p>
          </>
        ) : (
          <>
            <ShieldX className="mx-auto h-12 w-12 text-rose-500" />
            <p className="mt-3 font-display text-xl font-bold">No certificate found</p>
            <p className="mt-1 text-sm text-ink/60">
              {live ? "Check the number and try again." : "Certificates are issued when results are announced."}
            </p>
          </>
        )}
      </Card>
    </>
  );
}
