import re

with open("src/features/landing/pages/LandingPage.tsx", "r") as f:
    content = f.read()

if "import { LandingNav } from '../components/LandingNav';" not in content:
    content = content.replace("import { HeroSection }", "import { LandingNav } from '../components/LandingNav';\nimport { HeroSection }")

if "<LandingNav />" not in content:
    content = content.replace("<HeroSection />", "<LandingNav />\n      <div id=\"home\">\n        <HeroSection />\n      </div>")

content = content.replace("<AICoachSection />", "<div id=\"features\">\n        <AICoachSection />\n      </div>")
content = content.replace("<WhyWorksSection />", "<div id=\"method\">\n        <WhyWorksSection />\n      </div>")
content = content.replace("<PricingSection />", "<div id=\"pricing\">\n        <PricingSection />\n      </div>")

with open("src/features/landing/pages/LandingPage.tsx", "w") as f:
    f.write(content)
