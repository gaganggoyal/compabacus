import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import { Card, Eyebrow } from "@/components/ui";

export const metadata: Metadata = { title: "Student login" };

export default function LoginPage() {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-14">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Eyebrow>Student login</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Welcome back!</h1>
          <p className="mt-2 text-ink/60">Log in to pay, take the exam, and download your certificate.</p>
        </div>
        <Card className="mt-8 p-6 sm:p-8">
          <LoginForm />
        </Card>
        <p className="mt-6 text-center text-sm text-ink/60">
          New here?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
            Register for ₹10
          </Link>
        </p>
      </div>
    </div>
  );
}
