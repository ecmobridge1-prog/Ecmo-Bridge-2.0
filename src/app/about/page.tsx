import Link from "next/link";

const pillars = [
  {
    title: "Interdisciplinary alignment",
    description:
      "We orchestrate shared playbooks for intensivists, perfusionists, transport, and transfer centers so everyone reads from the same status board.",
  },
  {
    title: "Operational resilience",
    description:
      "Redundant communication paths, automated checklists, and analytics ensure ECMO capacity keeps pace with unpredictable demand.",
  },
  {
    title: "Clinical partnership",
    description:
      "Every rollout pairs your clinical experts with our implementation guides to co-design triage flows and escalation logic that reflect your reality.",
  },
];

const milestones = [
  {
    year: "2019",
    detail: "Concepted during a statewide ECMO surge task force to surface real-time equipment availability.",
  },
  {
    year: "2021",
    detail: "First collaborative network deployed across eight tertiary centers with shared NPI credentialing.",
  },
  {
    year: "2023",
    detail: "Launched ECMO Bridge 2.0 with automated patient intake, Clerk authentication, and analytics dashboards.",
  },
  {
    year: "Today",
    detail: "Supporting growing networks that need to activate ECMO within minutes—while keeping every handoff compliant.",
  },
];

export default function About() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-160px] top-[-120px] h-[360px] w-[360px] rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute right-[-200px] bottom-[-120px] h-[420px] w-[420px] rounded-full bg-indigo-500/25 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-6xl px-6 pb-24 pt-32 sm:px-10 sm:pt-40">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            Why we built ECMO Bridge
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
            Coordinating ECMO is high stakes. We give teams shared clarity when it matters most.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg">
            ECMO Bridge 2.0 emerged from clinicians asking for a better way to translate referrals into bedside action. Our platform blends thoughtful workflow design with secure technology so hospitals can deliver advanced cardiac and respiratory support without hesitation.
          </p>
        </header>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-purple-900/25 backdrop-blur transition hover:border-purple-400/40 hover:bg-white/10"
            >
              <h2 className="text-xl font-semibold text-white">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                {pillar.description}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-20 grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-purple-900/25 backdrop-blur">
            <h2 className="text-2xl font-semibold text-white">
              Grounded in frontline collaboration
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              We partner with critical care teams to analyze every step from referral intake, imaging review, and transport coordination to cannulation and weaning. ECMO Bridge 2.0 translates those shared workflows into a live command center where responsibilities, equipment readiness, and clinical milestones are visible in one place.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Security and compliance stay front and center. Clerk authentication, audit logs, and role-specific data views mean PHI stays protected while multi-disciplinary teams operate at full speed.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-purple-900/25 backdrop-blur">
            <h2 className="text-2xl font-semibold text-white">Milestones</h2>
            <div className="mt-6 space-y-5">
              {milestones.map((milestone) => (
                <div key={milestone.year} className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                    {milestone.year}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-white/75">
                    {milestone.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-20 rounded-3xl border border-purple-400/40 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-8 py-10 shadow-2xl shadow-purple-900/40 sm:px-12 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">
                Our promise
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-snug sm:text-4xl">
                Every clinician gets the context they need to deliver advanced life support without delay.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/85">
                From planning to continuous improvement, we walk alongside your teams to continuously refine protocols, measure activation time, and surface insights that keep patients safer.
              </p>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-sm leading-relaxed text-white/85">
                Joint design sprints with bedside clinicians and transfer coordinators to map signals that matter most.
              </div>
              <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-sm leading-relaxed text-white/85">
                Built-in change management playbooks to help your network adopt new activation patterns with confidence.
              </div>
              <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-sm leading-relaxed text-white/85">
                Analytics that highlight resource bottlenecks and celebrate faster time-to-support wins.
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-7 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white/40"
            >
              Meet the team
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-purple-900/30 transition hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-purple-900/40"
            >
              Explore the platform
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
