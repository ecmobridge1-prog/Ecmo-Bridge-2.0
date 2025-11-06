import Link from "next/link";
import type { CSSProperties } from "react";

const stats = [
  { value: "43%", label: "Faster patient matching across partner sites" },
  { value: "12", label: "Regional ECMO centers collaborating in sync" },
  { value: "24/7", label: "Continuous readiness monitoring & alerts" },
];

const bubbleConfigs: { className: string; style: CSSProperties }[] = [
  {
    className:
      "aurora-bubble absolute left-[8%] top-[-28%] h-[820px] w-[820px] rounded-full bg-[#6321d8]/60",
    style: {
      "--duration": "36s",
      "--x1": "-15%",
      "--y1": "-16%",
      "--x2": "12%",
      "--y2": "6%",
      "--x3": "-10%",
      "--y3": "10%",
      "--scale": "1.1",
      "--scale-bump": "1.22",
      "--o1": "0.35",
      "--o2": "0.9",
      "--o3": "0.45",
    },
  },
  {
    className:
      "aurora-bubble absolute right-[-140px] top-[12%] h-[600px] w-[600px] rounded-full bg-[#2a4dea]/45",
    style: {
      "--duration": "30s",
      "--x1": "4%",
      "--y1": "-18%",
      "--x2": "-6%",
      "--y2": "10%",
      "--x3": "12%",
      "--y3": "-6%",
      "--scale": "1",
      "--scale-bump": "1.18",
      "--o1": "0.3",
      "--o2": "0.75",
      "--o3": "0.5",
    },
  },
  {
    className:
      "aurora-bubble absolute bottom-[-260px] left-1/3 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#1a2d8f]/40",
    style: {
      "--duration": "40s",
      "--x1": "-12%",
      "--y1": "12%",
      "--x2": "14%",
      "--y2": "-8%",
      "--x3": "-8%",
      "--y3": "-2%",
      "--scale": "1.05",
      "--scale-bump": "1.25",
      "--o1": "0.25",
      "--o2": "0.7",
      "--o3": "0.4",
    },
  },
  {
    className:
      "aurora-bubble absolute left-[55%] top-[-18%] h-[500px] w-[500px] rounded-full bg-[#4319a8]/55",
    style: {
      "--duration": "34s",
      "--x1": "-10%",
      "--y1": "-20%",
      "--x2": "8%",
      "--y2": "14%",
      "--x3": "-6%",
      "--y3": "-12%",
      "--scale": "0.95",
      "--scale-bump": "1.28",
      "--o1": "0.3",
      "--o2": "0.8",
      "--o3": "0.5",
    },
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060019] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {bubbleConfigs.map(({ className, style }, index) => (
          <div key={index} className={className} style={style} />
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,#601ed326,transparent_55%),radial-gradient(circle_at_80%_20%,#1f3aca1c,transparent_60%),radial-gradient(circle_at_40%_85%,#1b2a841f,transparent_65%)]" />
      </div>

      <main className="relative mx-auto flex w-full min-h-screen max-w-7xl flex-col items-center justify-center px-6 pb-24 pt-32 text-center sm:px-10">
        <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
          Precision ECMO coordination
        </span>
        <h1 className="mt-8 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          Bridge critical care teams and equipment at the speed of need.
        </h1>
        <p className="mt-6 max-w-3xl text-base text-white/75 sm:text-lg">
          ECMO Bridge 2.0 gives transfer centers, bedside clinicians, and transport teams a single shared source of truth—so every second of the journey from referral to cannulation is orchestrated.
        </p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-purple-400/40 bg-gradient-to-r from-purple-500 via-purple-500/80 to-indigo-500 px-10 py-3.5 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-purple-900/40 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-900/50"
          >
            Launch platform
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-10 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Talk with our team
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 shadow-lg shadow-purple-900/30 backdrop-blur"
            >
              <p className="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                {stat.value}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.32em] text-white/60">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
