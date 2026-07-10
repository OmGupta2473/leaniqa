/**
 * LandingPage.tsx — LeanIQA
 *
 * FILE LOCATION IN YOUR PROJECT:
 *   features/landing/pages/LandingPage.tsx
 *
 * IMPORTS THIS FILE NEEDS:
 *   import './landing.css'  ← create landing.css in same folder
 *
 * DEPENDS ON (already in your project):
 *   framer motion  → "motion/react" or "framer-motion"
 *   lenis          → npm install lenis
 *
 * WIRED INTO APP:
 *   features/landing/index.ts  → export { LandingPage } from './pages/LandingPage'
 *   src/App.tsx                → if (!session) return <LandingPage onGetStarted={...} />
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  AnimatePresence,
  useInView,
} from 'framer-motion';
import './landing.css';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  onGetStarted: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS — defined once, reused everywhere
// ─────────────────────────────────────────────────────────────────────────────

const EASE_OUT  = [0.22, 1, 0.36, 1] as const;
const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE_OUT } },
};

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};

const stagger = (delay = 0.10) => ({
  visible: { transition: { staggerChildren: delay } },
});

const scaleUp = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE_SPRING } },
};

// ─────────────────────────────────────────────────────────────────────────────
// LENIS SMOOTH SCROLL
// ─────────────────────────────────────────────────────────────────────────────

function useSmoothScroll() {
  useEffect(() => {
    let lenis: any;
    let rafId: number;
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({
        lerp: 0.075,
        smoothWheel: true,
        wheelMultiplier: 0.9,
      });
      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }).catch(() => {/* lenis not installed — page still works, just no smooth scroll */});
    return () => {
      cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────

function useCounter(target: number, duration = 1800, trigger = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration, trigger]);
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLIT HEADLINE — animates each word in separately
// ─────────────────────────────────────────────────────────────────────────────

function SplitHeadline({ text, accent, className }: {
  text: string;
  accent?: string;
  className?: string;
}) {
  const words = text.split(' ');
  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const word = {
    hidden:  { opacity: 0, y: '110%' },
    visible: { opacity: 1, y: '0%', transition: { duration: 0.55, ease: EASE_OUT } },
  };

  return (
    <motion.h1
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
      style={{
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.25em',
        alignItems: 'baseline',
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ overflow: 'hidden', display: 'inline-block' }}>
          <motion.span
            variants={word}
            style={{
              display: 'inline-block',
              color: accent && w.toLowerCase() === accent.toLowerCase()
                ? 'var(--lime)'
                : 'inherit',
            }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </motion.h1>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS RING — SVG, used in mock dashboard card
// ─────────────────────────────────────────────────────────────────────────────

function Ring({
  pct, size = 80, stroke = 8, color = '#D4FF00', children,
}: {
  pct: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)',
            filter: `drop-shadow(0 0 6px ${color}80)`,
          }}
        />
      </svg>
      {children && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '1px',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AWARD BADGE SVG
// ─────────────────────────────────────────────────────────────────────────────

function HexBadge({
  symbol, color, size = 64, earned = true, label,
}: {
  symbol: string; color: string; size?: number; earned?: boolean; label?: string;
}) {
  const cx = size / 2, cy = size / 2, r = size * 0.43;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * Math.PI / 180;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
  const innerR = r * 0.80;
  const innerPts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * 60 - 30) * Math.PI / 180;
    return `${cx + innerR * Math.cos(a)},${cy + innerR * Math.sin(a)}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: earned ? 1 : 0.28 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
        {earned && (
          <polygon
            points={pts}
            fill={color}
            opacity={0.18}
            transform={`scale(1.18) translate(${-cx * 0.18},${-cy * 0.18})`}
            filter="url(#badge-glow)"
          />
        )}
        <defs>
          <filter id="badge-glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <polygon points={pts} fill={`${color}30`} stroke={`${color}70`} strokeWidth="0.75" />
        <polygon points={innerPts} fill={`${color}18`} />
        <text
          x={cx} y={cy + 2}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.31}
          style={{ userSelect: 'none' }}
        >
          {symbol}
        </text>
      </svg>
      {label && (
        <span style={{ fontSize: 10, fontWeight: 700, color: earned ? color : 'rgba(242,242,247,0.3)', textAlign: 'center', maxWidth: size, lineHeight: 1.2 }}>
          {label}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STICKY SCROLL — THE CORE FEATURE
// Three chapters scroll inside a pinned product window.
// ─────────────────────────────────────────────────────────────────────────────

function StickyProductShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  // Smooth spring applied to raw scroll progress — removes jank
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.5 });

  // Chapter visibility — 3 equal chapters over the scroll range
  const chapterA = useTransform(smoothProgress, [0, 0.28, 0.38], [1, 1, 0]);
  const chapterB = useTransform(smoothProgress, [0.28, 0.38, 0.62, 0.72], [0, 1, 1, 0]);
  const chapterC = useTransform(smoothProgress, [0.62, 0.72, 1], [0, 1, 1]);

  // Progress indicator width
  const progressWidth = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  // Chapter text content
  const chapters = [
    {
      step: '01',
      eyebrow: 'Natural language logging',
      headline: 'Just describe what you ate.',
      sub: 'No barcode scanning. No searching a database. Type "aloo paratha with dahi and chai" — exactly how you\'d say it to a friend.',
      accent: 'describe',
    },
    {
      step: '02',
      eyebrow: 'Gemini AI parses it',
      headline: 'Macros in under 3 seconds.',
      sub: 'Gemini 2.0 Flash reads your description, identifies every ingredient and quantity, and returns precise calories, protein, fat, and carbs.',
      accent: 'seconds.',
    },
    {
      step: '03',
      eyebrow: 'Consistency becomes a game',
      headline: 'Your streak. Your awards.',
      sub: 'Hit your calorie and protein targets every day. Unlock 12 achievement badges. Watch your body fat percentage drop on a real visual tracker.',
      accent: 'game',
    },
  ];

  return (
    // Outer: 300vh tall, scroll container
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        height: '300vh',
        background: 'var(--bg)',
      }}
    >
      {/* Inner: sticky viewport-height panel */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,255,0,0.06) 0%, transparent 70%)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            width: '100%',
            maxWidth: 1120,
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 64,
            alignItems: 'center',
          }}
          className="sticky-inner-grid"
        >
          {/* LEFT: Chapter text — crossfades */}
          <div style={{ position: 'relative', minHeight: 320 }}>
            {chapters.map((ch, i) => {
              const opacity = i === 0 ? chapterA : i === 1 ? chapterB : chapterC;
              return (
                <motion.div
                  key={i}
                  style={{
                    opacity,
                    position: i === 0 ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 12px',
                    borderRadius: 100,
                    background: 'rgba(212,255,0,0.1)',
                    border: '0.5px solid rgba(212,255,0,0.2)',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#D4FF00',
                    marginBottom: 20,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4FF00', display: 'inline-block' }} />
                    {ch.eyebrow}
                  </div>
                  <h2 style={{
                    fontSize: 'clamp(32px, 4.5vw, 52px)',
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.06,
                    color: '#F2F2F7',
                    marginBottom: 20,
                  }}>
                    {ch.headline}
                  </h2>
                  <p style={{
                    fontSize: 'clamp(15px, 1.8vw, 18px)',
                    color: 'rgba(242,242,247,0.55)',
                    lineHeight: 1.72,
                    maxWidth: 420,
                  }}>
                    {ch.sub}
                  </p>
                </motion.div>
              );
            })}

            {/* Chapter step indicators */}
            <div style={{
              display: 'flex',
              gap: 8,
              marginTop: 280,
              position: 'absolute',
              bottom: -40,
            }}>
              {[chapterA, chapterB, chapterC].map((op, i) => (
                <motion.div
                  key={i}
                  style={{
                    height: 3,
                    borderRadius: 2,
                    background: '#D4FF00',
                    opacity: op,
                    width: 32,
                  }}
                />
              ))}
              {[chapterA, chapterB, chapterC].map((op, i) => (
                <motion.div
                  key={`inactive-${i}`}
                  style={{
                    height: 3,
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.15)',
                    opacity: useTransform(op, [0, 1], [1, 0]),
                    width: 12,
                    position: 'absolute',
                    left: i * 48,
                  }}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Morphing product window */}
          <div style={{ position: 'relative' }}>
            <ProductWindow
              chapterA={chapterA}
              chapterB={chapterB}
              chapterC={chapterC}
            />
          </div>
        </div>

        {/* Scroll progress bar — bottom of viewport */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'rgba(255,255,255,0.05)',
        }}>
          <motion.div
            style={{
              height: '100%',
              background: '#D4FF00',
              width: progressWidth,
              boxShadow: '0 0 12px rgba(212,255,0,0.5)',
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT WINDOW — morphs between 3 app states
// ─────────────────────────────────────────────────────────────────────────────

function ProductWindow({ chapterA, chapterB, chapterC }: {
  chapterA: any; chapterB: any; chapterC: any;
}) {
  const [typedText, setTypedText] = useState('');
  const [showMacros, setShowMacros] = useState(false);
  const fullText = '2 roti with soya sabji';

  useEffect(() => {
    const unsubA = chapterA.onChange((v: number) => {
      if (v > 0.5) {
        let i = 0;
        setTypedText('');
        setShowMacros(false);
        const interval = setInterval(() => {
          i++;
          setTypedText(fullText.slice(0, i));
          if (i >= fullText.length) clearInterval(interval);
        }, 60);
        return () => clearInterval(interval);
      }
    });
    return () => unsubA();
  }, []);

  useEffect(() => {
    const unsubB = chapterB.onChange((v: number) => {
      if (v > 0.5) {
        setTypedText(fullText);
        setTimeout(() => setShowMacros(true), 400);
      }
    });
    return () => unsubB();
  }, []);

  return (
    <div style={{
      background: 'rgba(13,13,16,0.97)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: '0.5px solid rgba(255,255,255,0.10)',
      borderRadius: 24,
      overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.04)',
      maxWidth: 320,
      margin: '0 auto',
    }}>

      {/* Window chrome */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '0.5px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF5F57','#FFBD2E','#28C840'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(242,242,247,0.4)', letterSpacing: 0.5 }}>
          LeanIQA
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Chapter A: Empty state → user typing */}
      <motion.div style={{ opacity: chapterA }}>
        <ChapterAContent typedText={typedText} />
      </motion.div>

      {/* Chapter B: AI parsing → macros appear */}
      <motion.div style={{ opacity: chapterB, position: 'absolute', top: 45, left: 0, right: 0 }}>
        <ChapterBContent showMacros={showMacros} />
      </motion.div>

      {/* Chapter C: Streak + award unlock */}
      <motion.div style={{ opacity: chapterC, position: 'absolute', top: 45, left: 0, right: 0 }}>
        <ChapterCContent />
      </motion.div>
    </div>
  );
}

function ChapterAContent({ typedText }: { typedText: string }) {
  return (
    <div style={{ padding: '16px' }}>
      {/* Compact calorie ring */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
        <Ring pct={0} size={60} stroke={6} color="#D4FF00">
          <span style={{ fontSize: 11, fontWeight: 800, color: '#D4FF00', lineHeight: 1 }}>0%</span>
        </Ring>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(242,242,247,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Today</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#F2F2F7', letterSpacing: '-0.04em', lineHeight: 1 }}>0 <span style={{ fontSize: 11, fontWeight: 400, color: 'rgba(242,242,247,0.35)' }}>/ 1,980 kcal</span></div>
          <div style={{ fontSize: 11, color: 'rgba(55,138,221,0.8)', fontWeight: 600, marginTop: 2 }}>0g / 150g protein</div>
        </div>
      </div>

      {/* Meal slots */}
      {[
        { label: 'Breakfast', icon: '🌅', time: '6am – 12pm' },
        { label: 'Lunch', icon: '☀️', time: '12pm – 6pm' },
        { label: 'Dinner', icon: '🌙', time: '6pm – 10pm' },
      ].map((slot, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 10px', borderRadius: 10, marginBottom: 6,
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>{slot.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#F2F2F7' }}>{slot.label}</div>
              <div style={{ fontSize: 9, color: 'rgba(242,242,247,0.35)' }}>{slot.time}</div>
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(242,242,247,0.25)', fontStyle: 'italic' }}>Nothing yet</div>
        </div>
      ))}

      {/* Typing input */}
      <div style={{
        marginTop: 12,
        background: 'rgba(255,255,255,0.05)',
        border: '0.5px solid rgba(212,255,0,0.3)',
        borderRadius: 100,
        padding: '10px 14px',
        fontSize: 12,
        color: '#F2F2F7',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 0 16px rgba(212,255,0,0.08)',
      }}>
        <span style={{ flex: 1 }}>
          {typedText}
          {typedText.length < 22 && <span style={{ animation: 'cursor-blink 1s step-end infinite' }}>|</span>}
        </span>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: typedText.length > 0 ? '#D4FF00' : 'rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.3s ease',
          flexShrink: 0,
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={typedText.length > 0 ? '#06060A' : '#888'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ChapterBContent({ showMacros }: { showMacros: boolean }) {
  const macros = [
    { label: 'Calories', value: 390, unit: 'kcal', color: '#FF4D1C', delay: 0 },
    { label: 'Protein', value: 28, unit: 'g', color: '#378ADD', delay: 0.08 },
    { label: 'Fat', value: 9, unit: 'g', color: '#F2F2F7', delay: 0.16 },
    { label: 'Carbs', value: 52, unit: 'g', color: '#F2F2F7', delay: 0.24 },
  ];

  return (
    <div style={{ padding: 16 }}>
      {/* User bubble */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', marginBottom: 10,
      }}>
        <div style={{
          background: '#D4FF00',
          color: '#06060A',
          borderRadius: '14px 14px 3px 14px',
          padding: '9px 13px',
          fontSize: 12,
          fontWeight: 600,
          maxWidth: '80%',
          boxShadow: '0 4px 16px rgba(212,255,0,0.25)',
        }}>
          2 roti with soya sabji
        </div>
      </div>

      {/* AI response bubble */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '3px 14px 14px 14px',
        padding: '12px 14px',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 11, color: 'rgba(242,242,247,0.6)', lineHeight: 1.6, marginBottom: 10 }}>
          ✓ Logged: 2 roti with soya sabji
        </div>

        {/* Macro pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {macros.map((m, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.7, y: 6 }}
              animate={showMacros ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ delay: m.delay, duration: 0.4, ease: EASE_SPRING }}
              style={{
                padding: '3px 9px',
                borderRadius: 100,
                fontSize: 10,
                fontWeight: 700,
                background: `${m.color}15`,
                border: `0.5px solid ${m.color}30`,
                color: m.color,
              }}
            >
              {m.value}{m.unit}
            </motion.span>
          ))}
        </div>

        {/* Coaching tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showMacros ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{
            marginTop: 10, paddingTop: 10,
            borderTop: '0.5px solid rgba(255,255,255,0.07)',
            display: 'flex', gap: 6, alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: 11 }}>💡</span>
          <span style={{ fontSize: 10, color: 'rgba(212,255,0,0.75)', lineHeight: 1.5, fontStyle: 'italic' }}>
            28g protein logged. You need 122g more today to hit target.
          </span>
        </motion.div>
      </div>

      {/* Updated calorie bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={showMacros ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.45, ease: EASE_OUT }}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '0.5px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: '10px 12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(242,242,247,0.4)', fontWeight: 600 }}>DAILY CALORIES</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#D4FF00' }}>390 / 1,980</span>
        </div>
        <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={showMacros ? { width: '20%' } : {}}
            transition={{ delay: 0.7, duration: 1, ease: EASE_OUT }}
            style={{ height: '100%', background: '#D4FF00', borderRadius: 3 }}
          />
        </div>
      </motion.div>
    </div>
  );
}

function ChapterCContent() {
  return (
    <div style={{ padding: 16 }}>
      {/* Streak unlock notification */}
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE_SPRING }}
        style={{
          background: 'linear-gradient(135deg, rgba(212,255,0,0.12) 0%, rgba(212,255,0,0.04) 100%)',
          border: '1px solid rgba(212,255,0,0.3)',
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 0 24px rgba(212,255,0,0.08)',
        }}
      >
        <div style={{ fontSize: 22 }}>🔥</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#D4FF00' }}>7-Day Streak!</div>
          <div style={{ fontSize: 10, color: 'rgba(242,242,247,0.55)', marginTop: 1 }}>You hit your calorie goal 7 days in a row</div>
        </div>
      </motion.div>

      {/* Award unlock */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6, ease: EASE_SPRING }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '14px 0',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(242,242,247,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          New award unlocked
        </div>
        <div style={{ animation: 'badge-float 3s ease-in-out infinite' }}>
          <HexBadge symbol="⚔️" color="#C0C0C0" size={80} earned label="7-Day Warrior" />
        </div>
      </motion.div>

      {/* Compact progress summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ display: 'flex', gap: 8, marginTop: 10 }}
      >
        {[
          { icon: '🔥', label: '7 day streak', color: '#D4FF00' },
          { icon: '💪', label: '5 protein days', color: '#378ADD' },
        ].map(c => (
          <div key={c.label} style={{
            flex: 1,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 10px', borderRadius: 100,
            background: `${c.color}10`,
            border: `0.5px solid ${c.color}25`,
          }}>
            <span style={{ fontSize: 11 }}>{c.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: c.color }}>{c.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS SECTION
// ─────────────────────────────────────────────────────────────────────────────

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const users  = useCounter(12400, 1600, inView);
  const meals  = useCounter(284000, 2000, inView);
  const loss   = useCounter(62, 1400, inView); // 6.2kg × 10

  const stats = [
    { value: `${(users / 1000).toFixed(1)}K+`, label: 'Indians tracking today', color: '#D4FF00' },
    { value: `${(meals / 1000).toFixed(0)}K+`, label: 'Meals parsed by AI', color: '#D4FF00' },
    { value: `${(loss / 10).toFixed(1)}kg`,    label: 'Avg fat lost per user', color: '#D4FF00' },
    { value: '4.9★',                           label: 'User satisfaction',     color: '#D4FF00' },
  ];

  return (
    <section ref={ref} style={{ background: 'var(--surface)', borderTop: '0.5px solid var(--c-border)', borderBottom: '0.5px solid var(--c-border)' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.6, ease: EASE_OUT }}
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                borderRight: i < stats.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
              <div style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 900,
                letterSpacing: '-0.05em',
                color: s.color,
                lineHeight: 1,
                marginBottom: 8,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(242,242,247,0.45)', fontWeight: 500 }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICING SECTION
// ─────────────────────────────────────────────────────────────────────────────

function PricingSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section style={{ padding: '120px 24px', background: 'var(--bg)' }} id="pricing">
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 100,
              background: 'rgba(212,255,0,0.08)',
              border: '0.5px solid rgba(212,255,0,0.18)',
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#D4FF00', marginBottom: 16,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4FF00', display: 'inline-block' }} />
              Pricing
            </span>
            <h2 style={{
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 900, letterSpacing: '-0.04em',
              lineHeight: 1.08, color: '#F2F2F7',
            }}>
              Start free.<br />
              <span style={{
                background: 'linear-gradient(135deg, #D4FF00, #A8CC00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Upgrade when you're ready.
              </span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Free */}
            <motion.div variants={scaleUp} style={{
              background: 'var(--surface)',
              border: '0.5px solid rgba(255,255,255,0.09)',
              borderRadius: 20,
              padding: 32,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(242,242,247,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Free
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: '#F2F2F7', letterSpacing: '-0.05em' }}>₹0</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(242,242,247,0.35)', marginBottom: 28 }}>Forever free, no card needed</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  'Calorie + macro tracking',
                  'Daily streaks & awards',
                  '5 AI meal parses / day',
                  '7-day activity report',
                  'Indian food database',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: 'rgba(242,242,247,0.65)' }}>
                    <span style={{ color: '#D4FF00', fontSize: 12 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={onGetStarted}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 100,
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.14)',
                  color: '#F2F2F7', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                Start for free
              </button>
            </motion.div>

            {/* Pro */}
            <motion.div variants={scaleUp} style={{
              background: 'rgba(13,13,16,0.98)',
              border: '1px solid rgba(212,255,0,0.35)',
              borderRadius: 20,
              padding: 32,
              position: 'relative',
              boxShadow: '0 0 60px rgba(212,255,0,0.08), 0 32px 64px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                position: 'absolute', top: -13, left: 24,
                padding: '4px 14px', borderRadius: 100,
                background: '#D4FF00', color: '#06060A',
                fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em',
              }}>
                Most popular
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#D4FF00', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Pro
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: '#D4FF00', letterSpacing: '-0.05em' }}>₹299</span>
                <span style={{ fontSize: 14, color: 'rgba(242,242,247,0.4)' }}>/month</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(242,242,247,0.35)', marginBottom: 28 }}>₹2,499/year · save 30%</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {[
                  'Everything in Free',
                  'Unlimited AI meal parsing',
                  'Gemini 2.0 Flash real-time',
                  'Weekly AI coaching report',
                  'Body fat % visual tracker',
                  'All 12 awards unlockable',
                  'Priority support',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, color: '#F2F2F7' }}>
                    <span style={{ color: '#D4FF00', fontSize: 12 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button
                onClick={onGetStarted}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 100,
                  background: '#D4FF00', color: '#06060A',
                  fontSize: 14, fontWeight: 700,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 20px rgba(212,255,0,0.3)',
                  transition: 'transform 0.14s ease, box-shadow 0.14s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(212,255,0,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,255,0,0.3)'; }}
              >
                Start 14-day free trial
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────

function Testimonials() {
  const testimonials = [
    { quote: 'Finally an app that knows what dal makhani is. Logged my entire dinner in one sentence. Got exact macros in 2 seconds.', name: 'Priya S.', city: 'Bangalore', streak: '23d streak' },
    { quote: 'Lost 5kg in 8 weeks just by staying consistent. The streak badges actually make you not want to break the chain.', name: 'Arjun K.', city: 'Mumbai', streak: '54d streak' },
    { quote: 'I tried every app. Nothing stuck until LeanIQA. Logging chawal roti takes 5 seconds. I\'ve not missed a day in 2 months.', name: 'Neha R.', city: 'Delhi', streak: '61d streak' },
  ];

  return (
    <section style={{ padding: '120px 24px', background: 'var(--surface)' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={fadeUp} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#F2F2F7' }}>
              Real people.<br />
              <span style={{
                background: 'linear-gradient(135deg, #D4FF00, #A8CC00)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Real results.
              </span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp} style={{
                background: 'rgba(8,8,10,0.8)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 24,
              }}>
                <div style={{ fontSize: 36, color: 'rgba(212,255,0,0.2)', lineHeight: 1, marginBottom: 12, fontFamily: 'Georgia, serif' }}>"</div>
                <p style={{ fontSize: 14, color: 'rgba(242,242,247,0.7)', lineHeight: 1.72, marginBottom: 20 }}>{t.quote}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F2F2F7' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(242,242,247,0.35)', marginTop: 1 }}>{t.city}</div>
                  </div>
                  <div style={{
                    padding: '4px 10px', borderRadius: 100,
                    background: 'rgba(212,255,0,0.1)',
                    border: '0.5px solid rgba(212,255,0,0.2)',
                    fontSize: 10, fontWeight: 700, color: '#D4FF00',
                  }}>
                    🔥 {t.streak}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function LandingPage({ onGetStarted }: Props) {
  useSmoothScroll();
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp-root">

      {/* ── NAVBAR ── */}
      <header
        className="lp-nav"
        style={{
          background: navScrolled ? 'rgba(8,8,10,0.90)' : 'transparent',
          backdropFilter: navScrolled ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: navScrolled ? 'blur(24px)' : 'none',
          borderBottom: `0.5px solid ${navScrolled ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
          boxShadow: navScrolled ? '0 1px 0 rgba(255,255,255,0.04)' : 'none',
        }}
      >
        <div className="lp-nav-inner">
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #D4FF00, #8CB000)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: '#06060A',
              boxShadow: '0 2px 12px rgba(212,255,0,0.3)',
            }}>🔥</div>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#F2F2F7', letterSpacing: '-0.4px' }}>LeanIQA</span>
          </div>

          {/* Links */}
          <nav className="lp-nav-links">
            {[['Features', '#features'], ['Pricing', '#pricing'], ['How it works', '#how']].map(([label, href]) => (
              <a
                key={label}
                href={href}
                style={{ fontSize: 14, fontWeight: 500, color: 'rgba(242,242,247,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#F2F2F7'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(242,242,247,0.6)'; }}
              >
                {label}
              </a>
            ))}
          </nav>

          <button
            onClick={onGetStarted}
            style={{
              padding: '9px 20px', borderRadius: 100,
              background: '#D4FF00', color: '#06060A',
              fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 2px 12px rgba(212,255,0,0.28)',
              transition: 'transform 0.12s ease, box-shadow 0.12s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Start free →
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Radial lime glow */}
        <div aria-hidden style={{
          position: 'absolute',
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,255,0,0.06) 0%, transparent 65%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />
        {/* Grid bg */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(212,255,0,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(212,255,0,0.028) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            style={{ marginBottom: 28 }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 100,
              background: 'rgba(212,255,0,0.09)',
              border: '0.5px solid rgba(212,255,0,0.22)',
              fontSize: 12, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: '#D4FF00',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4FF00', animation: 'lp-pulse 2s ease-in-out infinite', display: 'inline-block' }} />
              AI-powered · Built for India
            </span>
          </motion.div>

          <SplitHeadline
            text="Stop counting. Start transforming."
            accent="transforming."
            className="lp-hero-h1"
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE_OUT }}
            style={{
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              color: 'rgba(242,242,247,0.55)',
              lineHeight: 1.7,
              maxWidth: 520,
              margin: '20px auto 40px',
            }}
          >
            Type <strong style={{ color: '#F2F2F7', fontWeight: 600 }}>"dal chawal with achar"</strong> and LeanIQA calculates your macros in under 3 seconds — no barcode scanning, no guessing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.65, ease: EASE_OUT }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <button
              onClick={onGetStarted}
              style={{
                padding: '15px 36px', borderRadius: 100,
                background: '#D4FF00', color: '#06060A',
                fontSize: 16, fontWeight: 700,
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 24px rgba(212,255,0,0.32)',
                transition: 'transform 0.14s ease, box-shadow 0.14s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(212,255,0,0.42)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,255,0,0.32)'; }}
            >
              Start for free
            </button>
            <button
              onClick={onGetStarted}
              style={{
                padding: '14px 28px', borderRadius: 100,
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.14)',
                color: 'rgba(242,242,247,0.85)', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              See how it works ↓
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 36, flexWrap: 'wrap' }}
          >
            {[
              { icon: '🔒', text: 'No credit card' },
              { icon: '⚡', text: 'Ready in 2 minutes' },
              { icon: '🇮🇳', text: '50K+ Indian foods' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(242,242,247,0.4)', fontWeight: 500 }}>
                <span>{item.icon}</span> {item.text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <StatsSection />

      {/* ── STICKY PRODUCT SHOWCASE ── */}
      <StickyProductShowcase />

      {/* ── PROBLEM / HOW IT WORKS ── */}
      <section id="how" style={{ padding: '120px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, color: '#F2F2F7' }}>
                Every other app was built for the West.<br />
                <span style={{ background: 'linear-gradient(135deg, #D4FF00, #A8CC00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  LeanIQA was built for you.
                </span>
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(242,242,247,0.5)', marginTop: 16, maxWidth: 480, margin: '16px auto 0', lineHeight: 1.7 }}>
                MyFitnessPal doesn't know dal. Cronometer doesn't understand chawal. You'd spend 20 minutes barcode-scanning a plate of rajma chawal. That ends today.
              </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2, background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
              {[
                { step: '01', icon: '💬', title: 'Tell us what you ate', desc: 'Say "aloo paratha with dahi and chai" — in Hindi, English, or both. We understand portions in grams, pieces, bowls, cups, or just a rough guess.', detail: 'Gemini 2.0 Flash NLP engine' },
                { step: '02', icon: '⚡', title: 'AI parses in 3 seconds', desc: 'Real nutritional data for every ingredient. Not averages from a random database. Calculated from actual macro profiles of Indian cooking methods.', detail: 'Fallback cache for offline use' },
                { step: '03', icon: '🔥', title: 'Build unstoppable momentum', desc: 'Daily streaks, 12 award badges, and a body fat visual tracker keep you locked in. Most users see consistency improve in week 1.', detail: '12 awards · calorie + protein streaks' },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  style={{ background: 'var(--surface)', padding: '36px 32px', position: 'relative' }}
                >
                  <div style={{
                    position: 'absolute', top: 24, right: 24,
                    fontSize: 52, fontWeight: 900, color: 'rgba(212,255,0,0.05)',
                    letterSpacing: '-0.05em', lineHeight: 1, userSelect: 'none',
                  }}>
                    {step.step}
                  </div>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>{step.icon}</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F2F2F7', letterSpacing: '-0.02em', marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(242,242,247,0.5)', lineHeight: 1.7, marginBottom: 16 }}>{step.desc}</p>
                  <div style={{
                    padding: '6px 12px', borderRadius: 8, display: 'inline-block',
                    background: 'rgba(212,255,0,0.06)',
                    border: '0.5px solid rgba(212,255,0,0.14)',
                    fontSize: 11, color: 'rgba(212,255,0,0.65)', fontWeight: 600,
                  }}>
                    {step.detail}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── AWARDS SHOWCASE ── */}
      <section id="features" style={{ padding: '120px 24px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.div variants={fadeUp} style={{ marginBottom: 56 }}>
              <h2 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, color: '#F2F2F7', maxWidth: 560 }}>
                Consistency is a<br />
                <span style={{ background: 'linear-gradient(135deg, #D4FF00, #A8CC00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  skill you can earn.
                </span>
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(242,242,247,0.5)', marginTop: 16, maxWidth: 420, lineHeight: 1.7 }}>
                12 achievement badges across calorie and protein streaks. Each one earned, not bought. Your Hall of Awards is proof of your discipline.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 40 }}>
              {[
                { symbol: '⚡', color: '#D4FF00', label: '1 Day', earned: true },
                { symbol: '🔥', color: '#FF4D1C', label: '3 Days', earned: true },
                { symbol: '🏗️', color: '#D4FF00', label: '5 Days', earned: true },
                { symbol: '⚔️', color: '#C0C0C0', label: '10 Days', earned: true },
                { symbol: '🔱', color: '#FFD700', label: '21 Days', earned: false },
                { symbol: '👑', color: '#FFD700', label: '30 Days', earned: false },
                { symbol: '💪', color: '#FF4D1C', label: 'Protein 3d', earned: true },
                { symbol: '🛡️', color: '#C0C0C0', label: 'Protein 7d', earned: false },
              ].map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.85 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: EASE_SPRING }}
                  whileHover={{ scale: 1.1, y: -4, transition: { duration: 0.2, ease: EASE_SPRING } }}
                  style={{ cursor: 'default' }}
                >
                  <HexBadge {...b} size={72} />
                </motion.div>
              ))}
            </motion.div>

            {/* Live streak chips */}
            <motion.div variants={fadeIn} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 100,
                background: 'rgba(212,255,0,0.10)',
                border: '0.5px solid rgba(212,255,0,0.28)',
                fontSize: 13, fontWeight: 700, color: '#D4FF00',
                boxShadow: '0 0 20px rgba(212,255,0,0.08)',
              }}>
                🔥 12-day calorie streak
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 100,
                background: 'rgba(55,138,221,0.10)',
                border: '0.5px solid rgba(55,138,221,0.25)',
                fontSize: 13, fontWeight: 700, color: '#378ADD',
              }}>
                💪 8-day protein streak
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <Testimonials />

      {/* ── PRICING ── */}
      <PricingSection onGetStarted={onGetStarted} />

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'var(--surface)' }}>
        <div aria-hidden style={{
          position: 'absolute', width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,255,0,0.07) 0%, transparent 70%)',
          left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.h2 variants={fadeUp} style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 900, letterSpacing: '-0.04em',
              lineHeight: 1.05, color: '#F2F2F7', marginBottom: 20,
            }}>
              Your transformation<br />
              <span style={{ background: 'linear-gradient(135deg, #D4FF00, #A8CC00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                starts with one meal.
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} style={{
              fontSize: 17, color: 'rgba(242,242,247,0.5)',
              lineHeight: 1.7, maxWidth: 380, margin: '0 auto 40px',
            }}>
              Join 12,000+ Indians who log their roti, dal, and sabji in seconds — and hit their body goals.
            </motion.p>
            <motion.div variants={fadeUp}>
              <button
                onClick={onGetStarted}
                style={{
                  padding: '16px 48px', borderRadius: 100,
                  background: '#D4FF00', color: '#06060A',
                  fontSize: 17, fontWeight: 700,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 24px rgba(212,255,0,0.32)',
                  transition: 'transform 0.14s ease, box-shadow 0.14s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px rgba(212,255,0,0.42)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(212,255,0,0.32)'; }}
              >
                Start free — no card needed
              </button>
              <div style={{ fontSize: 12, color: 'rgba(242,242,247,0.28)', marginTop: 14 }}>
                Free forever · 14-day Pro trial · Cancel anytime
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '0.5px solid rgba(255,255,255,0.07)',
        padding: '28px 24px',
        background: '#08080A',
      }}>
        <div style={{
          maxWidth: 1120, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #D4FF00, #8CB000)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🔥</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F2F2F7', letterSpacing: '-0.3px' }}>LeanIQA</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map(link => (
              <a key={link} href="#" style={{ fontSize: 13, color: 'rgba(242,242,247,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'rgba(242,242,247,0.7)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'rgba(242,242,247,0.35)'; }}>
                {link}
              </a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(242,242,247,0.2)' }}>© 2026 LeanIQA · Made in India 🇮🇳</div>
        </div>
      </footer>

    </div>
  );
}