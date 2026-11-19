import { ArrowLeft, BadgeCheck, PartyPopper, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { Suspense } from "react";
import { submitSchoolUtrAction } from "@/app/actions/school";
import { CopyButton } from "@/components/copy-button";
import { UtrForm } from "@/components/forms/utr-form";
import { Badge, Card, PageLoading, btn, cn } from "@/components/ui";
import { currentSchool } from "@/lib/auth";
import { site, upiDetails } from "@/lib/config";
import { rupees } from "@/lib/pricing";

export const metadata: Metadata = { title: "School payment", robots: { index: false } };

export default function SchoolPaymentPage({ searchParams }: PageProps<"/schools/dashboard/payment">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Payment searchParams={searchParams} />
    </Suspense>
  );
}

async function Payment({ searchParams }: { searchParams: PageProps<"/schools/dashboard/payment">["searchParams"] }) {
  const school = await currentSchool();
  if (!school) redirect("/schools/login");
  const { welcome } = await searchParams;
  const { vpa, payee, ready } = upiDetails();
  const amount = school.feeAmount;
  // Keep "@" unescaped in the UPI ID: some bank UPI apps reject "%40".
  const upiUrl = `upi://pay?pa=${encodeURIComponent(vpa).replace(/%40/g, "@")}&pn=${encodeURIComponent(payee)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `${site.shortName} ${school.code}`,
  )}`;
  const qrSvg = ready ? await QRCode.toString(upiUrl, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#15123b", light: "#ffffff" } }) : "";

  return (
    <div className="container-x py-10 sm:py-14">
      <Link href="/schools/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> School dashboard
      </Link>

      {welcome && (
        <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-emerald-50 p-6 ring-1 ring-emerald-200 sm:flex-row sm:items-center">
          <PartyPopper className="h-10 w-10 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="font-display text-xl font-bold text-emerald-900">School account created!</p>
            <p className="mt-1 text-emerald-900/80">
              Your school code is <b className="font-mono text-lg text-emerald-950">{school.code}</b>. Log in with {school.email} and your password. You can add
              students straight away.
            </p>
          </div>
          <CopyButton value={school.code} label="Copy code" className="self-start bg-white ring-1 ring-emerald-200 sm:self-center" />
        </div>
      )}

      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Step 2 of 2</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Pay {rupees(amount)} by UPI</h1>
        <p className="mt-2 text-ink/60">One payment for {school.name}. It covers every student you add.</p>
      </div>

      {school.paymentStatus === "verified" ? (
        <Card className="mt-8 max-w-xl p-8 text-center">
          <BadgeCheck className="mx-auto h-12 w-12 text-emerald-600" />
          <p className="mt-4 font-display text-2xl font-bold">Payment verified</p>
          <p className="mt-2 text-ink/60">Thank you! Every student of {school.name} is covered.</p>
          <Link href="/schools/dashboard" className={cn(btn("primary"), "mt-6")}>
            Go to dashboard
          </Link>
        </Card>
      ) : !ready ? (
        <Card className="mt-8 max-w-xl p-8">
          <p className="font-display text-2xl font-bold">Payments open soon</p>
          <p className="mt-2 text-ink/65">Your school account is saved. Please come back to this page shortly, or add your students meanwhile.</p>
          <Link href="/schools/dashboard" className={cn(btn("primary"), "mt-6")}>
            Add students
          </Link>
        </Card>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold">1. Scan & pay</p>
              <Badge tone="amber">Amount {rupees(amount)}.00</Badge>
            </div>
            <div className="mx-auto mt-6 w-full max-w-[16rem] rounded-3xl bg-white p-3 ring-1 ring-ink/10">
              <div className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            </div>
            <p className="mt-4 text-center text-sm text-ink/60">Scan with GPay, PhonePe, Paytm, BHIM or any UPI app</p>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink/[0.04] px-4 py-3 text-sm">
              <span>
                <span className="block text-xs text-ink/50">UPI ID</span>
                <span className="font-mono font-semibold">{vpa}</span>
              </span>
              <CopyButton value={vpa} />
            </div>
            <a href={upiUrl} className={cn(btn("dark", "lg"), "mt-4 w-full sm:hidden")}>
              <Smartphone className="h-4 w-4" /> Open UPI app to pay
            </a>
            <ul className="mt-5 space-y-1.5 text-xs text-ink/55">
              <li>• Pay exactly {rupees(amount)}, once for the whole school.</li>
              <li>• Payee name shown in your app: {payee}</li>
            </ul>
          </Card>
          <Card className="p-6 sm:p-8">
            <p className="font-display text-lg font-bold">2. Enter your UPI reference number</p>
            <p className="mt-1 text-sm text-ink/60">After paying, open the transaction in your UPI app and copy the 12-digit UTR / UPI Ref. No.</p>
            {school.paymentStatus === "submitted" && (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Submitted, we&apos;re verifying it. Your students can already book slots. Entered the wrong number? Update it below.
              </p>
            )}
            {school.paymentStatus === "rejected" && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{school.paymentNote}</p>}
            <div className="mt-6">
              <UtrForm existing={school.paymentStatus === "submitted" ? school.utr : null} submit={submitSchoolUtrAction} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
