import type { ReactNode } from "react";
import { Eyebrow } from "./ui";

export function ProsePage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="container-x py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        {updated && <p className="mt-3 text-sm text-ink/50">Last updated {updated}</p>}
        <div className="mt-10 space-y-5 text-[15px] leading-relaxed text-ink/75 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </div>
  );
}
