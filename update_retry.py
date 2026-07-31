import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

# Add retryCount state
state_code = """  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [pendingMeal, setPendingMeal] = useState<{ text: string; data: any } | null>(null);
  const [failedMealText, setFailedMealText] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);"""

content = content.replace("""  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [pendingMeal, setPendingMeal] = useState<{ text: string; data: any } | null>(null);
  const [failedMealText, setFailedMealText] = useState<string | null>(null);""", state_code)

# Clear retry count on success
on_success_code = """    onSuccess: (data, text) => {
      setLoading(false);
      
      if (data._errorMessage || (data.confidence && data.confidence < 80)) {
        analytics.trackEvent('AI Parse Failure', { error: data._errorMessage || 'Low confidence', input: text });
        setFailedMealText(text);
      } else {
        setRetryCount(0);
        analytics.trackEvent('AI Parse Success', { confidence: data.confidence, calories: data.calories });
        setPendingMeal({ text, data });
      }
    },"""

content = content.replace("""    onSuccess: (data, text) => {
      setLoading(false);
      
      if (data._errorMessage || (data.confidence && data.confidence < 80)) {
        analytics.trackEvent('AI Parse Failure', { error: data._errorMessage || 'Low confidence', input: text });
        setFailedMealText(text);
      } else {
        analytics.trackEvent('AI Parse Success', { confidence: data.confidence, calories: data.calories });
        setPendingMeal({ text, data });
      }
    },""", on_success_code)

# Handle UI for retry count
new_ui_code = """                  {failedMealText && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,77,28,0.05)] border-[0.5px] border-[rgba(255,77,28,0.2)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start p-[12px_16px] text-[14px] leading-relaxed"
                    >
                      {retryCount >= 2 ? (
                        <>
                          <div className="mb-3 text-[rgba(255,255,255,0.9)]">AI is currently unable to identify this meal confidently. Please try entering a more descriptive meal.</div>
                          <div className="mb-3 text-[13px] text-[rgba(255,255,255,0.6)] italic">Example: "2 chapati + 150g paneer" instead of "{failedMealText}"</div>
                          <button 
                            onClick={() => {
                              setFailedMealText(null);
                              setRetryCount(0);
                            }}
                            className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 px-4 rounded-[12px] text-[13px] transition-colors w-full"
                          >
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="mb-3 text-[rgba(255,255,255,0.9)]">We couldn't confidently identify this meal. Nothing has been logged. Please try again.</div>
                          <button 
                            onClick={() => {
                              const text = failedMealText;
                              setFailedMealText(null);
                              setRetryCount(prev => prev + 1);
                              setLoading(true);
                              parseMealMutation.mutate(text);
                            }}
                            className="bg-[#FF4D1C] hover:bg-[#FF4D1C]/80 text-white font-bold py-2 px-4 rounded-[12px] text-[13px] transition-colors w-full"
                          >
                            Retry
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}"""

content = content.replace("""                  {failedMealText && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,77,28,0.05)] border-[0.5px] border-[rgba(255,77,28,0.2)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start p-[12px_16px] text-[14px] leading-relaxed"
                    >
                      <div className="mb-3 text-[rgba(255,255,255,0.9)]">We couldn't confidently identify this meal. Nothing has been logged. Please try again.</div>
                      <button 
                        onClick={() => {
                          const text = failedMealText;
                          setFailedMealText(null);
                          setLoading(true);
                          parseMealMutation.mutate(text);
                        }}
                        className="bg-[#FF4D1C] hover:bg-[#FF4D1C]/80 text-white font-bold py-2 px-4 rounded-[12px] text-[13px] transition-colors w-full"
                      >
                        Retry
                      </button>
                    </motion.div>
                  )}""", new_ui_code)

# Clear states on fresh send
clear_on_send = """    const text = input.trim();
    if (!text || loading || !selectedMealSlot) return;
    setInput("");
    setPendingMeal(null);
    setFailedMealText(null);
    setRetryCount(0);
    addChatMessage({ role: "user", text });"""

content = content.replace("""    const text = input.trim();
    if (!text || loading || !selectedMealSlot) return;
    setInput("");
    addChatMessage({ role: "user", text });""", clear_on_send)


with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)

