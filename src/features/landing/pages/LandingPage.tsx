import "./landing.css";

import { LandingNav } from "../components/LandingNav";
import { Hero } from "../components/Hero";
import { Experience } from "../components/Experience";
import { Transformation } from "../components/Transformation";
import { Conversion } from "../components/Conversion";
import { StickyCTA } from "../components/StickyCTA";
import { LandingFooter } from "../components/LandingFooter";

import { BackgroundGrid } from "@/shared/components/ui/BackgroundGrid";
import { NoiseOverlay } from "@/shared/components/ui/NoiseOverlay";
import { AmbientGlow } from "@/shared/components/ui/AmbientGlow";

export default function LandingPage() {
  return (
    <main
      className="
      relative
      min-h-screen
      overflow-x-hidden
      bg-[#08080A]
      text-white
      antialiased
      selection:bg-lime-300
      selection:text-black
      "
    >
      {/* Permanent Background */}
      <BackgroundGrid />
      <NoiseOverlay />
      <AmbientGlow />

      {/* Navigation */}
      <LandingNav />

      {/* Main Story */}
      <Hero />

      <Experience />

      <Transformation />

      <Conversion />

      {/* Footer */}
      <LandingFooter />

      {/* Floating CTA */}
      <StickyCTA />
    </main>
  );
}