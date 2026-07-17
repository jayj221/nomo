import Link from "next/link";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

const STEPS = [
  {
    n: "01",
    title: "Write three prompts",
    body: "No photo. No name. No age. Just three honest answers. That's all anyone sees first.",
  },
  {
    n: "02",
    title: "A window opens",
    body: "A few times a day, for everyone at once, a 15-minute window opens. If you both liked each other's words, a live voice call fires. No profiles, no small talk about nothing.",
  },
  {
    n: "03",
    title: "Reveal on your terms",
    body: "The call starts anonymous — just two voices. Photos, names, socials unlock one step at a time, and only when you both choose to go further.",
  },
];

export default function Landing() {
  return (
    <main className="mx-auto w-full max-w-md px-6">
      {/* Hero */}
      <section className="flex min-h-[88vh] flex-col justify-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-faint">
          Nomo
        </p>
        <h1 className="mt-6 text-4xl font-semibold leading-tight text-fg">
          No more fake connections.
          <br />
          <span className="text-secondary">No more talk that goes nowhere.</span>
        </h1>
        <p className="mt-6 text-base leading-relaxed text-secondary">
          A voice-first way to meet people. Anonymous until it isn&apos;t.
          You talk first — faces and names come later, only if you both want
          them to.
        </p>

        <div className="mt-10">
          <WaitlistForm />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-line py-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-faint">
          How it works
        </p>
        <div className="mt-8 flex flex-col gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4">
              <span className="text-sm tabular-nums text-faint">{s.n}</span>
              <div>
                <h3 className="text-lg font-medium text-fg">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-secondary">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The idea */}
      <section className="border-t border-line py-16">
        <p className="text-[11px] uppercase tracking-[0.3em] text-faint">
          Why
        </p>
        <p className="answer-text mt-6 text-2xl leading-relaxed text-fg">
          &ldquo;You already know what a face tells you in a tenth of a second.
          You have no idea what a voice tells you in ten minutes. We think
          that&apos;s where the real thing lives.&rdquo;
        </p>
      </section>

      {/* Second CTA */}
      <section className="border-t border-line py-16">
        <h2 className="text-2xl font-semibold text-fg">
          Windows are limited.
        </h2>
        <p className="mt-2 text-sm text-secondary">
          We open access in small waves so every window stays worth showing up
          for. Get in line.
        </p>
        <div className="mt-8">
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-[0.3em] text-faint">
            Nomo
          </span>
          <Link
            href="/login"
            className="text-xs text-faint hover:text-secondary"
          >
            Have an invite? Sign in
          </Link>
        </div>
      </footer>
    </main>
  );
}
