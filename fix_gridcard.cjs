const fs = require('fs');
let code = fs.readFileSync('src/LandingPage.tsx', 'utf8');

const oldGridCard = `function GridCard({
  feature,
  delay,
}: {
  feature: any;
  delay: number;
  key?: React.Key;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 180, damping: 28 });
  const mouseYSpring = useSpring(y, { stiffness: 180, damping: 28 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ borderColor: "rgba(63,63,70,0.9)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
        willChange: "transform",
      }}
      className="bg-[#111112] border border-zinc-800/50 p-6 sm:p-8 flex flex-col min-h-[200px] cursor-default"
    >
      <div className="flex justify-between items-start mb-10 sm:mb-16">
        <span
          style={{ transform: "translateZ(20px)" }}
          className="text-zinc-500 font-mono text-xs uppercase tracking-wider"
        >
          {feature.subsystem}
        </span>
        <div style={{ transform: "translateZ(40px)" }} className="text-[#D4FF00]">
          <feature.icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h3
          style={{ transform: "translateZ(30px)" }}
          className="text-lg font-semibold text-zinc-50 mb-3 tracking-tight"
        >
          {feature.title}
        </h3>
        <p
          style={{ transform: "translateZ(10px)" }}
          className="text-zinc-400 text-sm leading-relaxed"
        >
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}`;

const newGridCard = `function GridCard({
  feature,
  delay,
}: {
  feature: any;
  delay: number;
  key?: React.Key;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ borderColor: "rgba(63,63,70,0.9)", y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#111112] border border-zinc-800/50 p-6 sm:p-8 flex flex-col min-h-[200px] cursor-default"
    >
      <div className="flex justify-between items-start mb-10 sm:mb-16">
        <span className="text-zinc-500 font-mono text-xs uppercase tracking-wider">
          {feature.subsystem}
        </span>
        <div className="text-[#D4FF00]">
          <feature.icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3 tracking-tight">
          {feature.title}
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}`;

if (code.includes(oldGridCard)) {
  fs.writeFileSync('src/LandingPage.tsx', code.replace(oldGridCard, newGridCard));
  console.log("Replaced GridCard successfully.");
} else {
  console.log("Could not find GridCard code to replace.");
}
