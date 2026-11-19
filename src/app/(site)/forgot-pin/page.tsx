import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPinForm } from "@/components/forms/pin-reset-forms";
import { Card, Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Forgot PIN" };

export default function ForgotPinPage() {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-14">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Eyebrow>Student login</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Forgot your PIN?</h1>
          <p className="mt-2 text-ink/60">Enter the registration number and the parent email used at registration. We&apos;ll email a link to set a new PIN.</p>
        </div>
        <Card className="mt-8 p-6 sm:p-8">
          <ForgotPinForm />
        </Card>
        <p className="mt-6 text-center text-sm text-ink/60">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
