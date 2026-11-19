import type { Metadata } from "next";
import { Suspense } from "react";
import { PracticeClient } from "@/components/exam/practice-client";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Free Abacus Mock Tests",
  description: "Unlimited free class-wise abacus mock tests from Nursery to Class 12, multiple choice, with instant scores and answer review.",
  alternates: { canonical: "/practice" },
};

/** Lets links like /practice?class=C3 open with that class already selected. */
async function WithClass({ searchParams }: { searchParams: PageProps<"/practice">["searchParams"] }) {
  const { class: grade } = await searchParams;
  return <PracticeClient initialGrade={typeof grade === "string" ? grade : undefined} />;
}

export default function PracticePage({ searchParams }: PageProps<"/practice">) {
  return (
    <div className="container-x py-12 sm:py-16">
      <div className="max-w-2xl">
        <Eyebrow>Free mock tests</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Practise exactly like the real exam</h1>
        <p className="mt-4 text-lg text-ink/60">
          Pick your child&apos;s class and get the same kind of paper as the championship: same question types, same timer, same Flash Round, four
          options for every question. A fresh paper every time, unlimited and free — no login needed.
        </p>
      </div>
      <div className="mt-10">
        <Suspense fallback={<PracticeClient />}>
          <WithClass searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
