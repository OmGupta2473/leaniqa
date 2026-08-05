import re

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "r") as f:
    content = f.read()

loading_component = """
const LOADING_MESSAGES = [
  "Analyzing meal...",
  "Estimating portions...",
  "Calculating nutrition...",
  "Checking confidence...",
  "Preparing recommendations..."
];

function LoadingStatusMessage() {
  const [index, setIndex] = React.useState(0);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500); // cycle every 1.5s
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[85%] self-start p-[10px_14px] flex items-center gap-[8px] text-[13px]"
    >
      <Loader2 size={16} className="animate-spin text-[#D4FF00]" />
      <motion.span 
        key={index}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        className="inline-block"
      >
        {LOADING_MESSAGES[index]}
      </motion.span>
    </motion.div>
  );
}
"""

if "LoadingStatusMessage" not in content:
    content = content.replace("export function MealLoggerPage() {", loading_component + "\nexport function MealLoggerPage() {")


old_loading_usage = """                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[85%] self-start p-[10px_14px] flex items-center gap-[8px] text-[13px]"
                    >
                      <Loader2 size={16} className="animate-spin text-[#D4FF00]" /> Analyzing meal...
                    </motion.div>
                  )}"""

new_loading_usage = """                  {loading && <LoadingStatusMessage />}"""

content = content.replace(old_loading_usage, new_loading_usage)

with open("src/features/nutrition/pages/MealLoggerPage.tsx", "w") as f:
    f.write(content)

