import Link from "next/link";
import { Logo } from "@/components/brand";
import { btn } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream p-6 text-center">
      <div>
        <Logo className="justify-center" />
        <p className="mt-10 font-display text-7xl font-extrabold text-indigo-600">404</p>
        <p className="mt-3 font-display text-2xl font-bold">This page slid off the abacus.</p>
        <Link href="/" className={`${btn("primary")} mt-8`}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
