import type { Metadata } from "next";
import Link from "next/link";
import { WhatsAppIcon, whatsappLink } from "@/components/brand";
import { SchoolLoginForm } from "@/components/forms/school-forms";
import { Card, Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "School login", robots: { index: false, follow: true } };

export default function SchoolLoginPage() {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-14">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Eyebrow>School login</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Welcome back!</h1>
          <p className="mt-2 text-ink/60">Manage your students, slots and results.</p>
        </div>
        <Card className="mt-8 p-6 sm:p-8">
          <SchoolLoginForm />
          <a
            href={whatsappLink("Hi, I forgot our school account password.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-ink/60 hover:text-ink"
          >
            <WhatsAppIcon className="h-4 w-4 text-emerald-500" /> Forgot password? Message us
          </a>
        </Card>
        <p className="mt-6 text-center text-sm text-ink/60">
          New school?{" "}
          <Link href="/schools/register" className="font-semibold text-indigo-600 hover:underline">
            Register your school
          </Link>
          {" · "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
            Student login
          </Link>
        </p>
      </div>
    </div>
  );
}
