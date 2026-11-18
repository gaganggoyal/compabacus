import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-forms";
import { Logo } from "@/components/brand";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <Logo />
        <h1 className="mt-6 font-display text-2xl font-bold">Organiser login</h1>
        <p className="mt-1 text-sm text-ink/55">Manage registrations, payments and results.</p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
