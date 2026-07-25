import os

landing_dir = "src/features/landing"
components_dir = os.path.join(landing_dir, "components")
pages_dir = os.path.join(landing_dir, "pages")

os.makedirs(components_dir, exist_ok=True)
os.makedirs(pages_dir, exist_ok=True)

# Generate basic skeleton for all files
components = [
    "HeroSection",
    "ProblemSection",
    "AICoachSection",
    "TransformationTimelineSection",
    "MealIntelligenceSection",
    "ConsistencyEngineSection",
    "DashboardPreviewSection",
    "WhyWorksSection",
    "AwardsHallSection",
    "TestimonialsSection",
    "PricingSection",
    "FinalCTASection",
    "StickyCTA"
]

for component in components:
    with open(os.path.join(components_dir, f"{component}.tsx"), "w") as f:
        f.write(f"""import React from 'react';
import {{ motion }} from 'motion/react';

export function {component}() {{
  return (
    <section className="relative py-24 px-6 md:px-12 w-full flex flex-col items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl w-full flex flex-col items-center text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
          {component}
        </h2>
        <p className="text-lg text-[rgba(235,235,245,0.6)]">
          This is a placeholder for the {component}.
        </p>
      </motion.div>
    </section>
  );
}}
""")

with open(os.path.join(pages_dir, "LandingPage.tsx"), "w") as f:
    f.write("""import React from 'react';
import { motion, useScroll } from 'motion/react';
""")
    for component in components:
        f.write(f"import {{ {component} }} from '../components/{component}';\n")
    
    f.write("""
export function LandingPage() {
  const { scrollYProgress } = useScroll();

  return (
    <div className="bg-[#0A0A0A] min-h-screen w-full text-white overflow-x-hidden selection:bg-[#D4FF00] selection:text-black font-sans">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-[#D4FF00] transform origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />
""")
    for component in components:
        f.write(f"      <{component} />\n")
    
    f.write("""    </div>
  );
}
""")
