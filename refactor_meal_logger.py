import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

# Add states
state_code = """  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [pendingMeal, setPendingMeal] = useState<{ text: string; data: any } | null>(null);
  const [failedMealText, setFailedMealText] = useState<string | null>(null);"""

content = content.replace("  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());", state_code)

start_idx = content.find("  const addMealMutation = useMutation({")
end_idx = content.find("  const handleSend = React.useCallback(() => {")

new_mutations = """  const parseMealMutation = useMutation({
    mutationFn: async (text: string) => {
      // ── COMPOUND MEAL DETECTION ───────────────────────────────────────────────
      const COMPOUND_PATTERN = /\\b(with|and|aur|&|\\+|along with|plus|sabzi|sabji|curry|masala)\\b/i;
      const COMMA_SPLIT = text.split(',').filter(s => s.trim().length > 2);
      const isCompoundMeal = COMPOUND_PATTERN.test(text) || COMMA_SPLIT.length > 1;
      
      devLog("=== MEAL LOGGING PIPELINE START ===");
      devLog("User Input:", text);
      
      if (!isCompoundMeal) {
        const cachedResult = lookupCachedMeal(text);
        if (cachedResult && cachedResult.confidence >= 90) {
          devLog("Nutrition Source Used: Cache");
          return { calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, confidence: cachedResult.confidence, foods_detected: [text], coaching_tip: `Logged from nutritional database. ${Math.round(cachedResult.scaledCalories)} kcal · ${cachedResult.scaledProtein}g protein`, _fromCache: true };
        }
      }
      
      devLog("Nutrition Source Used: AI / Function");
      let lastError: Error | null = null;
      let aiResponseDuration = 0;
      
      const reqStart = Date.now();
      if (typeof window !== 'undefined' && !navigator.onLine) {
        lastError = new Error('Network failure');
      } else {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.access_token) {
              if (attempt === 0) { 
                await supabase.auth.refreshSession(); 
              } else { 
                throw new Error('Authentication failure'); 
              }
            }

            const { data: { session: freshSession } } = await supabase.auth.getSession();
            if (!freshSession?.access_token) throw new Error('Authentication failure');

            const edgeStart = Date.now();
            const { data, error } = await supabase.functions.invoke('parse-meal', { body: { text, remainingCalories, remainingProtein, mealType: selectedMealSlot }, headers: { Authorization: `Bearer ${freshSession.access_token}` } });
            aiResponseDuration = Date.now() - edgeStart;

            if (error) {
              const status = (error as any)?.context?.status ?? 0;
              const msg = String(error.message ?? '');
              if (status === 401 || status === 403) { 
                if (attempt < 2) { await supabase.auth.refreshSession(); lastError = new Error('Auth — retrying'); continue; } 
                throw new Error('Authentication failure'); 
              }
              if (status === 429) throw new Error('Rate limiting');
              if (status === 504 || msg.includes('timeout')) {
                lastError = new Error('AI timeout');
                if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; }
                throw new Error('AI timeout');
              }
              if (msg.includes('fetch') || msg.includes('Network') || msg.includes('Failed to fetch')) { 
                lastError = new Error('Network failure'); 
                if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; } 
                throw new Error('Network failure'); 
              }
              if (status >= 500) { 
                lastError = new Error('Server error'); 
                if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; } 
                throw new Error('Server error'); 
              }
              throw new Error(msg || 'AI unavailable');
            }

            if (!data || typeof data.calories !== 'number') { 
              lastError = new Error('Parsing error'); 
              if (attempt < 2) continue; 
              throw new Error('Invalid AI response'); 
            }
            
            return data;
          } catch (err: any) {
            lastError = err as Error;
            if (attempt < 2 && (err.message.includes('retrying') || err.message.includes('unavailable') || err.message.includes('Auth —') || err.message.includes('Server error') || err.message.includes('timeout') || err.message.includes('Network failure') || err.message.includes('Parsing error'))) continue;
            break;
          }
        }
      }

      const errorContext = (() => {
        const msg = lastError?.message ?? '';
        if (msg.includes('limit') || msg.includes('Rate limiting')) return 'Daily AI limit reached';
        if (msg.includes('log out') || msg.includes('session') || msg.includes('Authentication failure')) return 'Session expired';
        if (msg.includes('Network') || msg.includes('fetch') || msg.includes('Network failure')) return 'No internet connection';
        if (msg.includes('AI timeout')) return 'AI took too long to respond';
        if (msg.includes('Server error')) return 'Server error';
        if (msg.includes('Invalid AI response') || msg.includes('Parsing error')) return 'AI returned invalid data';
        return msg || 'AI temporarily unavailable';
      })();
      
      return { _errorMessage: errorContext, text };
    },
    onSuccess: (data, text) => {
      setLoading(false);
      
      if (data._errorMessage || (data.confidence && data.confidence < 80)) {
        analytics.trackEvent('AI Parse Failure', { error: data._errorMessage || 'Low confidence', input: text });
        setFailedMealText(text);
      } else {
        analytics.trackEvent('AI Parse Success', { confidence: data.confidence, calories: data.calories });
        setPendingMeal({ text, data });
      }
    },
    onError: (err: any, variables) => {
      console.error('[parseMealMutation] onError fired:', err);
      const errorMessage = typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err);
      analytics.trackEvent('AI Parse Failure', { error: errorMessage, type: 'mutation_error' });
      setFailedMealText(variables);
      setLoading(false);
    }
  });

  const confirmMealMutation = useMutation({
    mutationFn: async ({ text, data }: { text: string, data: any }) => {
      await mealService.addMeal({ 
        meal_text: text, 
        calories: Math.round(data.calories), 
        protein: Math.round(data.protein), 
        fat: Math.round(data.fat), 
        carbs: Math.round(data.carbs), 
        meal_time: getMealTime().toISOString(), 
        tip: data.foods_detected?.join(', ') || text, 
        meal_slot: selectedMealSlot || undefined 
      });
      return { text, data };
    },
    onSuccess: ({ text, data }) => {
      setPendingMeal(null);
      haptics.success();
      haptics.success();
      const foodsDetected = Array.isArray(data?.foods_detected) && data?.foods_detected.length > 0 ? data.foods_detected.join(', ') : text;
      
      let responseText = `✓ Logged: ${foodsDetected}`;
      if (data?._fromCache) {
        responseText = `✓ Logged: ${foodsDetected}`;
      }
      
      addChatMessage({ role: 'ai', text: responseText, data });
    },
    onError: (err: any) => {
      console.error('[confirmMealMutation] onError:', err);
      addChatMessage({ role: 'ai', text: `⚠️ Failed to save meal. Please try again.` });
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals"] }),
        queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] }),
        complianceService.recalculateDayScore(selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0')).then(() => 
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
            queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] })
          ])
        ).catch(console.error)
      ]);
    },
  });

"""

content = content[:start_idx] + new_mutations + content[end_idx:]

content = content.replace("addMealMutation.mutate(text);", "parseMealMutation.mutate(text);")
content = content.replace("addMealMutation]);", "parseMealMutation]);")

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.write(content)

