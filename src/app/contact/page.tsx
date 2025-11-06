import Link from "next/link";

const contactOptions = [
  {
    title: "Network expansions",
    subtitle: "Multi-hospital deployments & integrations",
    body: "Coordinate go-lives across health systems, align data feeds, and configure activation pathways tailored to your ECMO network.",
    actionLabel: "connect@ecmobridge.org",
    href: "mailto:connect@ecmobridge.org",
  },
  {
    title: "Clinical partnerships",
    subtitle: "Workflow design & rapid pilots",
    body: "Work directly with our clinical success team to map referral intake, transport activation, and bedside protocols.",
    actionLabel: "clinical@ecmobridge.org",
    href: "mailto:clinical@ecmobridge.org",
  },
  {
    title: "Product support",
    subtitle: "Questions from active sites",
    body: "Current partners receive 24/7 pager coverage plus in-app chat—reach out anytime something feels off.",
    actionLabel: "+1 (555) 320-ECMO",
    href: "tel:+15553203266",
  },
];

export default function Contact() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-140px] top-[-140px] h-[340px] w-[340px] rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute right-[-180px] top-1/3 h-[420px] w-[420px] rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute left-1/2 bottom-[-200px] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-purple-700/25 blur-3xl" />
      </div>

      <main className="relative mx-auto max-w-5xl px-6 pb-24 pt-32 sm:px-10 sm:pt-40">
        <header className="text-center">
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            Let's coordinate care together
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl">
            Our team is on call to help your network deliver ECMO without hesitation.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg">
            Reach out for implementation planning, best practices, or questions about how ECMO Bridge 2.0 integrates with your existing workflows. We tailor every rollout to the clinicians, equipment, and transport realities you manage.
          </p>
        </header>

        <section className="mt-16 grid gap-6">
          {contactOptions.map((option) => (
            <div
              key={option.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-purple-900/25 backdrop-blur transition hover:border-purple-400/40 hover:bg-white/10"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                    {option.subtitle}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {option.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">
                    {option.body}
                  </p>
                </div>
                <Link
                  href={option.href}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white/40"
                >
                  {option.actionLabel}
                </Link>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-purple-400/40 bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-8 py-10 shadow-2xl shadow-purple-900/35 sm:px-12 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">
                Prefer a working session?
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-snug sm:text-4xl">
                Schedule a readiness workshop with our implementation specialists.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/85">
                We'll map your current ECMO activation flow, identify blockers, and show how ECMO Bridge adapts to your teams in less than an hour.
              </p>
            </div>
            <div className="space-y-4 text-sm text-white/85">
              <div className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4">
                <span className="font-semibold uppercase tracking-[0.3em] text-white/70">
                  What's included
                </span>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/85">
                  <li>• Activation timeline aligned with your governance model</li>
                  <li>• Data integrations scoped for staffing, equipment, and labs</li>
                  <li>• Change management plan tailored to clinical & transfer leads</li>
                </ul>
              </div>
              <Link
                href="mailto:workshops@ecmobridge.org"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-purple-900/30 transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 hover:shadow-purple-900/40"
              >
                Request a workshop
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl shadow-purple-900/25 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Response windows</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            We know ECMO coordination is mission critical. You'll always hear from a human—not a bot—within the timeframes below.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Urgent activations", "< 15 minutes", "Pager coverage for active ECMO programs"],
              ["New inquiries", "Same business day", "We align calendars quickly to keep momentum."],
              ["Product questions", "Within 2 hours", "EMR integrations, user management, analytics."],
            ].map(([title, time, detail]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                  {title}
                </p>
                <p className="mt-2 text-xl font-semibold text-white">{time}</p>
                <p className="mt-2 text-xs leading-relaxed text-white/70">{detail}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
