#!/bin/bash
sed -i '/const cardRef = useRef<HTMLDivElement>(null);/,/const handleMouseLeave = () => { x.set(0); y.set(0); };/d' src/LandingPage.tsx
sed -i 's/ref={cardRef}//g' src/LandingPage.tsx
sed -i 's/onMouseMove={handleMouseMove}//g' src/LandingPage.tsx
sed -i 's/onMouseLeave={handleMouseLeave}//g' src/LandingPage.tsx
sed -i '/style={{/,/}}/d' src/LandingPage.tsx
sed -i 's/style={{ transform: "translateZ(20px)" }}//g' src/LandingPage.tsx
sed -i 's/style={{ transform: "translateZ(40px)" }}//g' src/LandingPage.tsx
sed -i 's/style={{ transform: "translateZ(30px)" }}//g' src/LandingPage.tsx
sed -i 's/style={{ transform: "translateZ(10px)" }}//g' src/LandingPage.tsx
