import re

with open('src/LandingPage.tsx', 'r') as f:
    content = f.read()

# Step 1: Add imports
imports_to_add = "  Shield,\n  Clock,\n  Calendar,\n  ChevronRight,\n  Star,\n  BarChart3,\n  Zap,\n  Award,\n  Users,\n  TrendingUp,\n"
# Find `User\n} from "lucide-react";` and replace
content = content.replace("  User\n} from \"lucide-react\";", f"  User,\n{imports_to_add}}} from \"lucide-react\";")

# Step 2-6: Add components
components_code = """
// Animated number counter for social proof stats
function useAnimatedCounter(target: number, duration = 1600, trigger = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out-quart
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, trigger]);
  return value;
}

function SocialProofBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const users   = useAnimatedCounter(10000, 1600, inView);
  const weeks   = useAnimatedCounter(12,    1200, inView);
  const score   = useAnimatedCounter(49,    1400, inView); // displayed as 4.9

  const stats = [
    { value: `${(users / 1000).toFixed(0)}K+`, label: "Active users",             color: "#D4FF00" },
    { value: `${weeks} weeks`,                  label: "Avg. transformation time", color: "#D4FF00" },
    { value: `${(score / 10).toFixed(1)}★`,     label: "User rating",              color: "#D4FF00" },
    { value: "80%+",                            label: "Report visible progress",  color: "#D4FF00" },
  ];

  return (
    <section
      ref={ref}
      className="border-t border-zinc-900 bg-[#0C0C0D]"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-zinc-900 divide-y lg:divide-y-0">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="py-8 px-6 text-center"
            >
              <div
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-1"
                style={{ color: s.color, fontVariantNumeric: "tabular-nums" }}
              >
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-zinc-500 font-medium uppercase tracking-wider">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DisciplineAdvantage() {
  const comparisons = [
    {
      other: "Passive diary — you log, it stores.",
      leaniqa: "Active partner — it scores, adjusts, and coaches.",
      icon: Shield,
      label: "Accountability",
    },
    {
      other: "Shows calories. No context on whether it's enough.",
      leaniqa: "Daily Score out of 100. Shifts focus to compliance over numbers.",
      icon: BarChart3,
      label: "Progress metric",
    },
    {
      other: "Vague goal of 'losing weight someday'.",
      leaniqa: "Exact calendar date for your goal, calculated from your real adherence.",
      icon: Calendar,
      label: "Goal clarity",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <Reveal>
          <div className="max-w-2xl mb-12 sm:mb-16">
            <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-3">
              Why LeanIQA
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight leading-[1.1] mb-4">
              Most apps are food diaries.
              <br />
              <span className="text-zinc-400">LeanIQA is a discipline engine.</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              People don't fail transformations because they lack information. They fail because
              rigid plans break when real life happens. LeanIQA is built around that reality.
            </p>
          </div>
        </Reveal>

        {/* Comparison cards */}
        <div className="grid sm:grid-cols-3 gap-1">
          {comparisons.map((c, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-[#111112] border border-zinc-800/50 p-6 sm:p-8 h-full flex flex-col min-h-[280px]">

                {/* Label row */}
                <div className="flex items-center gap-2 mb-8">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(212,255,0,0.08)" }}
                  >
                    <c.icon className="w-4 h-4" style={{ color: "#D4FF00" }} />
                  </div>
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    {c.label}
                  </span>
                </div>

                {/* Other apps */}
                <div className="flex-1 mb-6">
                  <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-2">
                    Other apps
                  </p>
                  <p className="text-zinc-500 text-sm leading-relaxed line-through decoration-zinc-700">
                    {c.other}
                  </p>
                </div>

                {/* Divider */}
                <div className="w-8 h-px bg-[#D4FF00]/30 mb-6" />

                {/* LeanIQA */}
                <div>
                  <p className="text-xs font-semibold text-[#D4FF00] uppercase tracking-widest mb-2">
                    LeanIQA
                  </p>
                  <p className="text-zinc-100 text-sm leading-relaxed font-medium">
                    {c.leaniqa}
                  </p>
                </div>

              </div>
            </Reveal>
          ))}
        </div>

        {/* Daily Score callout — standalone hero stat block */}
        <Reveal delay={0.2}>
          <div
            className="mt-1 border border-zinc-800/50 bg-[#111112] p-8 sm:p-12"
            style={{ background: "linear-gradient(135deg, rgba(212,255,0,0.03) 0%, rgba(212,255,0,0.01) 100%)" }}
          >
            <div className="max-w-4xl mx-auto flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-16">

              {/* Left: explanation */}
              <div className="flex-1">
                <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-3">
                  The Compliance Engine
                </p>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-[1.15] mb-4">
                  Your Daily Score tells you the truth.
                </h3>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-6">
                  Every day, LeanIQA calculates a score from 0–100 based on how closely you hit your
                  calorie and macro targets. Not a vague "good job" — a precise number that builds
                  your streak and fuels your timeline projection.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    "90–100 = Perfect execution",
                    "70–89 = Strong compliance",
                    "Below 70 = Adjust & recover",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: mock score card */}
              <div
                className="flex-shrink-0 w-full lg:w-64 border border-white/8 rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">
                    Today's Score
                  </span>
                  <span className="text-xs text-zinc-500">Thu, Oct 12</span>
                </div>

                {/* Big score */}
                <div className="flex items-end gap-1 mb-1">
                  <motion.span
                    className="text-6xl font-bold tracking-tight leading-none"
                    style={{ color: "#D4FF00" }}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    94
                  </motion.span>
                  <span className="text-zinc-500 text-lg mb-1">/100</span>
                </div>
                <p className="text-xs text-zinc-500 mb-5">
                  🔥 Streak Day 12 — Keep going
                </p>

                {/* Mini breakdown */}
                {[
                  { label: "Calories",  val: "98%", color: "#D4FF00" },
                  { label: "Protein",   val: "91%", color: "#378ADD" },
                  { label: "Adherence", val: "94%", color: "#D4FF00" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between mb-2.5">
                    <span className="text-xs text-zinc-500">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: row.color }}
                          initial={{ width: "0%" }}
                          whileInView={{ width: row.val }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: row.color }}>
                        {row.val}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </Reveal>

      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Target,
      title: "Set your strategy",
      desc: "Input your weight, body fat %, and goal. LeanIQA calculates your deficit, macro targets, and a precise completion date.",
    },
    {
      number: "02",
      icon: MessageSquare,
      title: "Log meals in plain English",
      desc: "Type '2 roti + dal + 100g paneer'. AI parses it instantly — no barcode scanning, no database hunting.",
    },
    {
      number: "03",
      icon: BarChart3,
      title: "Score your day",
      desc: "Receive a Daily Score (0–100) based on compliance. The app recalibrates your remaining meals in real time.",
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "Watch the transformation",
      desc: "Your physique timeline updates based on your actual adherence. Stay consistent, and your goal date moves closer.",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0C0C0D]">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-12 sm:mb-16 max-w-2xl">
            <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
              Four steps. One system. Real results.
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Everything is designed to reduce friction and increase accountability from day one.
            </p>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-1">
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-[#111112] border border-zinc-800/50 p-6 sm:p-8 h-full min-h-[220px] flex flex-col relative overflow-hidden group">

                {/* Step number watermark */}
                <span
                  className="absolute top-4 right-5 text-7xl font-black text-white/[0.03] select-none pointer-events-none leading-none transition-all duration-500 group-hover:text-white/[0.06]"
                  aria-hidden
                >
                  {s.number}
                </span>

                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-6"
                  style={{ background: "rgba(212,255,0,0.08)", border: "1px solid rgba(212,255,0,0.15)" }}
                >
                  <s.icon className="w-4 h-4" style={{ color: "#D4FF00" }} />
                </div>

                <h3 className="text-base font-semibold text-zinc-100 mb-3 tracking-tight">
                  {s.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {s.desc}
                </p>

                {/* Connector arrow — hidden on last item */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-[1px] z-10">
                    <ChevronRight className="w-4 h-4 text-zinc-700" />
                  </div>
                )}

              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialStrip() {
  const testimonials = [
    {
      quote: "I've tried every app. LeanIQA is the first one that made me feel accountable instead of guilty. The Daily Score changed how I think about food.",
      name: "Rahul M.",
      detail: "Lost 9kg in 14 weeks · 🔥 Day 68 streak",
      initials: "RM",
    },
    {
      quote: "The timeline feature is what got me. Seeing an actual date — not 'a few months' — made the goal feel real for the first time.",
      name: "Priya S.",
      detail: "Lost 6kg in 10 weeks · 🔥 Day 41 streak",
      initials: "PS",
    },
    {
      quote: "Logging 'aloo paratha with curd' and getting precise macros back in two seconds is genuinely magical. No other app handles Indian food this well.",
      name: "Arjun K.",
      detail: "Lost 12kg in 18 weeks · 🔥 Day 112 streak",
      initials: "AK",
    },
  ];

  return (
    <section className="py-16 sm:py-24 px-6 border-t border-zinc-900 bg-[#0A0A0B]">
      <div className="max-w-7xl mx-auto">
        <Reveal>
          <div className="mb-12 sm:mb-16 max-w-2xl">
            <p className="text-xs font-mono text-[#D4FF00] uppercase tracking-widest mb-3">
              Real results
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              People who finished their transformation.
            </h2>
          </div>
        </Reveal>

        <div className="grid sm:grid-cols-3 gap-1">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <div className="bg-[#111112] border border-zinc-800/50 p-6 sm:p-8 h-full flex flex-col min-h-[220px]">

                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-[#D4FF00] text-[#D4FF00]" />
                  ))}
                </div>

                <blockquote className="text-zinc-300 text-sm leading-relaxed flex-1 mb-6">
                  "{t.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/50">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                    style={{ background: "#D4FF00" }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">{t.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{t.detail}</p>
                  </div>
                </div>

              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
"""

content = content.replace('const LIME = "#D4FF00";\n\n/* ─────────────────────────────────────────────', 'const LIME = "#D4FF00";\n\n' + components_code + '\n\n/* ─────────────────────────────────────────────')

# Step 7: Wire up
# Insertion 1: Add <SocialProofBar /> before {/* ── Storytelling ── */}
content = content.replace('{/* ── Storytelling ── */}', '<SocialProofBar />\n\n      {/* ── Storytelling ── */}')

# Insertion 2: Add <DisciplineAdvantage /> before {/* ── Features grid ── */}
content = content.replace('{/* ── Features grid ── */}', '<DisciplineAdvantage />\n\n      {/* ── Features grid ── */}')

# Insertion 3: Add <HowItWorks /> and <TestimonialStrip /> before {/* ── Pricing ── */}
content = content.replace('{/* ── Pricing ── */}', '<HowItWorks />\n      <TestimonialStrip />\n\n      {/* ── Pricing ── */}')

with open('src/LandingPage.tsx', 'w') as f:
    f.write(content)
