import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPinForm } from "@/components/forms/pin-reset-forms";
import { Card, Eyebrow, PageLoading, btn } from "@/components/ui";

export const metadata: Metadata = { title: "Set a new PIN", robots: { index: false } };

export default function ResetPinPage({ searchParams }: PageProps<"/reset-pin">) {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-14">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Eyebrow>Student login</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Set a new PIN</h1>
          <p className="mt-2 text-ink/60">Choose a 6-digit PIN you&apos;ll remember. You&apos;ll be logged in straight after.</p>
        </div>
        <Card className="mt-8 p-6 sm:p-8">
          <Suspense fallback={<PageLoading />}>
            <WithToken searchParams={searchParams} />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}

async function WithToken({ searchParams }: { searchParams: PageProps<"/reset-pin">["searchParams"] }) {
  const { token } = await searchParams;
  if (typeof token === "string" && token) return <ResetPinForm token={token} />;
  return (
    <div className="text-center">
      <p className="text-ink/70">This link is incomplete. Please open the link from the email again, or ask for a new one.</p>
      <Link href="/forgot-pin" className={btn("primary", "sm") + " mt-5"}>
        Get a new link
      </Link>
    </div>
  );
}
