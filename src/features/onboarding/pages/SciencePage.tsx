import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/features/profile/services/profileService';

export function SciencePage() {
  const navigate = useNavigate();
    const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getProfile(),
  });
  const { data: goal } = useQuery({
    queryKey: ['goal'],
    queryFn: () => profileService.getGoal(),
  });

  const hasPlan =
    !!profile?.target_kcal &&
    !!profile?.protein_target &&
    !!profile?.fat_target &&
    !!profile?.carbs_target &&
    !!goal?.goal_type;

  const goalType = goal?.goal_type;
  const cutPace = goal?.cut_pace ?? null;
  const gainPace = goal?.gain_pace ?? null;
  const weight = profile?.weight ?? 0;
  const maintenance = Math.round(profile?.maintenance_kcal ?? 0);
  const targetKcal = profile?.target_kcal ?? 0;
  const proteinTarget = profile?.protein_target ?? 0;
  const fatTarget = profile?.fat_target ?? 0;
  const carbsTarget = profile?.carbs_target ?? 0;

  const goalLabel =
    goalType === 'cut' && cutPace
      ? `Lose fat at a ${cutPace}% deficit`
      : goalType === 'bulk' && gainPace
      ? `Build muscle at a ${gainPace}% surplus`
      : goalType === 'recomp'
      ? 'Recomposition (eat at maintenance)'
      : '';

  const goalMathLine =
    goalType === 'cut' && cutPace
      ? `${maintenance} kcal * (1 - ${(cutPace / 100).toFixed(2)}) = ${targetKcal} kcal`
      : goalType === 'bulk' && gainPace
      ? `${maintenance} kcal * (1 + ${(gainPace / 100).toFixed(2)}) = ${targetKcal} kcal`
      : goalType === 'recomp'
      ? `${maintenance} kcal * 1.00 = ${targetKcal} kcal`
      : '';

  const proteinFactor =
    goalType === 'cut'
      ? cutPace === 22 || cutPace === 26
        ? 1.8
        : 1.6
      : goalType === 'bulk'
      ? gainPace === 10
        ? 1.7
        : gainPace === 12
        ? 1.8
        : 1.6
      : goalType === 'recomp'
      ? 1.8
      : 1.4;

  const proteinLine =
    `${proteinFactor} g per kg * ${weight} kg. ` +
    (goalType === 'cut' && (cutPace === 22 || cutPace === 26)
      ? 'At aggressive deficits we use 1.8 g/kg to protect muscle.'
      : goalType === 'cut'
      ? 'At moderate deficits we use 1.6 g/kg.'
      : goalType === 'bulk'
      ? 'Higher surpluses get slightly more protein to support training.'
      : goalType === 'recomp'
      ? 'Recomp uses 1.8 g/kg to build muscle while staying lean.'
      : 'Maintenance uses 1.4 g/kg.');

  const fatFactor =
    goalType === 'cut'
      ? 0.7
      : goalType === 'recomp'
      ? 0.85
      : goalType === 'bulk'
      ? 0.9
      : 0.8;

  const weightFat = Math.round(weight * fatFactor);
  const calorieFat = Math.round((targetKcal * 0.25) / 9);

  const fatLine =
    `max(${weight} * ${fatFactor} = ${weightFat} g, ` +
    `${targetKcal} * 0.25 / 9 = ${calorieFat} g) = ${fatTarget} g. ` +
    'Fats below this floor can affect hormone health.';

  return (
    <div className="flex flex-col h-[100dvh] min-h-0 bg-[#0A0A0B] text-zinc-50 font-sans">
      {/* Fixed header */}
      <header className="flex-shrink-0 px-[clamp(1rem,4vw,1.5rem)] pt-[calc(env(safe-area-inset-top)+16px)] pb-[clamp(0.75rem,2dvh,1.25rem)] border-b border-zinc-900/60">
        <div className="w-full max-w-md mx-auto flex items-center gap-[clamp(0.5rem,1.4dvh,0.75rem)]">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="p-2 -ml-2 bg-zinc-900/60 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[clamp(1.15rem,3.2dvh,1.5rem)] font-semibold tracking-tight text-white">
              Why you can trust these numbers
            </h1>
            <p className="text-[clamp(0.7rem,1.8dvh,0.82rem)] text-zinc-500 mt-0.5">
              Every target backed by peer-reviewed research
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable content — a content page, scroll is expected */}
      <main className="flex-1 min-h-0 overflow-y-auto px-[clamp(1rem,4vw,1.5rem)]">
        <div className="w-full max-w-md mx-auto py-[clamp(1rem,2.6dvh,1.5rem)] space-y-[clamp(1rem,2.6dvh,1.4rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))]">

          {/* Intro */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 text-[clamp(0.72rem,1.9dvh,0.85rem)] text-zinc-400 leading-relaxed">
            Every target in your plan comes from peer-reviewed sports nutrition
            research. Each section below explains the "why" in plain English and
            links to the actual study.
          </div>
                    {hasPlan && (
            <section className="rounded-2xl border border-[#D4FF00]/25 bg-[#D4FF00]/[0.04] p-4">
              <div className="text-[11px] uppercase tracking-wider text-[#D4FF00] mb-3 font-semibold">
                Your plan, step by step
              </div>
              <div className="space-y-4 text-[13px] leading-relaxed">
                <div>
                  <div className="text-white font-medium mb-1">
                    1. Your maintenance: {maintenance} kcal
                  </div>
                  <div className="text-[rgba(255,255,255,0.6)]">
                    From Mifflin-St Jeor using your age, sex, height, weight, and
                    activity level.
                  </div>
                </div>
                <div>
                  <div className="text-white font-medium mb-1">
                    2. Your goal: {goalLabel}
                  </div>
                  <div className="text-[rgba(255,255,255,0.6)]">{goalMathLine}</div>
                </div>
                <div>
                  <div className="text-white font-medium mb-1">
                    3. Your protein: {proteinTarget} g
                  </div>
                  <div className="text-[rgba(255,255,255,0.6)]">{proteinLine}</div>
                </div>
                <div>
                  <div className="text-white font-medium mb-1">
                    4. Your fat: {fatTarget} g
                  </div>
                  <div className="text-[rgba(255,255,255,0.6)]">{fatLine}</div>
                </div>
                <div>
                  <div className="text-white font-medium mb-1">
                    5. Your carbs: {carbsTarget} g
                  </div>
                  <div className="text-[rgba(255,255,255,0.6)]">
                    Carbs fill the rest after protein and fat. ({targetKcal} -{" "}
                    {proteinTarget}*4 - {fatTarget}*9) / 4 = {carbsTarget} g.
                  </div>
                </div>
                <div className="pt-3 border-t border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.55)] text-[12px]">
                  Every macro reconciles to your calorie target within a few kcal.
                </div>
              </div>
            </section>
          )}

          <ScienceSection
            title="How we calculate your daily calories"
            body={
              <>
                We start with your <span className="text-white font-medium">resting metabolism</span> —
                the energy your body burns just staying alive. We use the
                <span className="text-white font-medium"> Mifflin–St Jeor formula</span>,
                the most accurate predictor for most adults.
                <br /><br />
                Then we multiply by an activity factor (1.2 if you sit all day,
                up to 1.9 if you train twice daily). The result is your
                <span className="text-white font-medium"> maintenance calories</span> —
                the number you'd eat to stay the same weight.
              </>
            }
            sources={[
              { label: 'Mifflin & St Jeor 1990 · Am J Clin Nutr', url: 'https://pubmed.ncbi.nlm.nih.gov/2305711/' },
            ]}
          />

          <ScienceSection
            title="Why protein is your #1 priority"
            body={
              <>
                Protein is what builds and protects muscle. Two numbers matter:
                <ul className="mt-2 space-y-1.5 list-disc list-inside text-zinc-400">
                  <li>
                    <span className="text-white font-medium">1.6 g per kg body weight</span> is
                    where muscle gains max out for most lifters. More than this
                    doesn't add extra muscle.
                  </li>
                  <li>
                    <span className="text-white font-medium">2.0–2.2 g per kg</span> while
                    cutting. When you eat fewer calories, higher protein protects
                    muscle from being burned for energy.
                  </li>
                </ul>
              </>
            }
            sources={[
              { label: 'Morton 2018 · Br J Sports Med', url: 'https://pubmed.ncbi.nlm.nih.gov/28698222/' },
              { label: 'Helms 2014 · JISSN', url: 'https://pubmed.ncbi.nlm.nih.gov/24864135/' },
            ]}
          />

          <ScienceSection
            title="Why fat has a minimum — never below 0.8 g/kg"
            body={
              <>
                Fat is not the enemy. Below ~0.5 g per kg of body weight,
                testosterone and other hormones drop, and your body can't absorb
                vitamins A, D, E, and K properly. So we keep you at
                <span className="text-white font-medium"> 0.8–0.9 g per kg</span> —
                enough for hormone health without wasting calories.
              </>
            }
            sources={[
              { label: 'Iraki 2019 · Sports', url: 'https://pubmed.ncbi.nlm.nih.gov/31234309/' },
            ]}
          />

          <ScienceSection
            title="Why carbs fill the rest of your calories"
            body={
              <>
                Carbs are your training fuel. They refill the glycogen in your
                muscles, which is what powers heavy sets and fast recovery.
                When glycogen is low, your strength drops and workouts feel
                harder. That's why carbs take whatever calories are left after
                protein and fat are set.
              </>
            }
            sources={[
              { label: 'Henselmans 2022 · Nutrients', url: 'https://pubmed.ncbi.nlm.nih.gov/35409220/' },
            ]}
          />

          <ScienceSection
            title="Why your calorie target depends on your goal"
            body={
              <>
                <ul className="space-y-2 list-disc list-inside text-zinc-400">
                  <li>
                    <span className="text-white font-medium">Cut (−22%):</span> a
                    moderate deficit strips fat while protecting muscle. Aim for
                    ~0.5 kg/week — faster costs muscle.
                  </li>
                  <li>
                    <span className="text-white font-medium">Recomp (0%):</span> eat
                    at maintenance. Studies show beginners and returning lifters
                    can lose fat and build muscle at the same time.
                  </li>
                  <li>
                    <span className="text-white font-medium">Bulk (+8%):</span> a small
                    surplus (~200–400 kcal/day) grows muscle without adding fat.
                    Going above this only adds fat, not muscle.
                  </li>
                </ul>
              </>
            }
            sources={[
              { label: 'Slater & Phillips 2011 · J Sports Sci', url: 'https://pubmed.ncbi.nlm.nih.gov/21660839/' },
              { label: 'Barakat 2020 · Strength Cond J', url: 'https://journals.lww.com/nsca-scj/abstract/2020/10000/body_recomposition__can_trained_individuals_build.2.aspx' },
            ]}
          />

          {/* Bottom disclaimer */}
          <div className="pt-3 border-t border-zinc-800/60 text-[clamp(0.68rem,1.7dvh,0.78rem)] text-zinc-500 leading-relaxed">
            <span className="text-zinc-400 font-medium">A note on individual differences.</span>{' '}
            These recommendations are drawn from research on healthy, resistance-trained
            adults. Your genetics, medical history, medications, and lifestyle all
            matter. Use this as a starting point — not medical advice. Talk to a
            doctor or registered dietitian before making major dietary changes.
          </div>

        </div>
      </main>
    </div>
  );
}

function ScienceSection({
  title,
  body,
  sources,
}: {
  title: string;
  body: React.ReactNode;
  sources: { label: string; url: string }[];
}) {
  return (
    <section>
      <h3 className="text-[clamp(0.85rem,2.2dvh,1rem)] font-semibold text-white tracking-tight mb-[clamp(0.35rem,1dvh,0.55rem)]">
        {title}
      </h3>
      <div className="text-[clamp(0.72rem,1.9dvh,0.85rem)] text-zinc-400 leading-relaxed">
        {body}
      </div>
      <div className="mt-[clamp(0.4rem,1.2dvh,0.6rem)] flex flex-wrap gap-x-3 gap-y-1">
        {sources.map((s, i) => (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[clamp(0.65rem,1.65dvh,0.75rem)] text-[#D4FF00]/80 hover:text-[#D4FF00] underline underline-offset-2 transition-colors"
          >
            {s.label} ↗
          </a>
        ))}
      </div>
    </section>
  );
}
