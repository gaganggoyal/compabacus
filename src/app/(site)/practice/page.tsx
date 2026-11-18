import type { Metadata } from "next";
import { PracticeClient } from "@/components/exam/practice-client";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Free Abacus Mock Tests",
  description: "Unlimited free abacus mock tests for all 7 competition levels, with instant scores and answer review.",
};

export default function PracticePage() {
  return (
    <div className="container-x py-12 sm:py-16">
      <div className="max-w-2xl">
        <Eyebrow>Free mock tests</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Practise exactly like the real exam</h1>
        <p className="mt-4 text-lg text-ink/60">
          Same question types, same timer, same Flash Round — with a fresh paper every time. Unlimited and free, no login needed.
        </p>
      </div>
      <div className="mt-10">
        <PracticeClient />
      </div>
    </div>
  );
}
