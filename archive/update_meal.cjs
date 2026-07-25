const fs = require('fs');

const path = 'src/features/nutrition/pages/MealLoggerPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace mutationFn
const startStr = '    mutationFn: async (text: string) => {';
const endStr = '    onMutate: async (text: string) => {';
const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find mutationFn block");
  process.exit(1);
}

const replacement = `    mutationFn: async (text: string) => {
      // ── COMPOUND MEAL DETECTION ───────────────────────────────────────────────
      // If the text describes multiple foods, skip the cache entirely and let the
      // AI handle it. Cache is only for single-food entries like "2 eggs" or "100g chicken".
      const COMPOUND_PATTERN = /\\b(with|and|aur|&|\\+|along with|plus|sabzi|sabji|curry|masala)\\b/i;
      const COMMA_SPLIT = text.split(',').filter(s => s.trim().length > 2);
      const isCompoundMeal = COMPOUND_PATTERN.test(text) || COMMA_SPLIT.length > 1;
      
      // ── STEP 1: Cache lookup — only for simple single-food entries ────────────
      if (!isCompoundMeal) {
        const cachedResult = lookupCachedMeal(text);
        if (cachedResult && cachedResult.confidence >= 90) {
          await mealService.addMeal({ meal_text: text, calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, meal_time: new Date().toISOString(), tip: text, meal_slot: selectedMealSlot || undefined });
          return { calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, confidence: cachedResult.confidence, foods_detected: [text], coaching_tip: \`Logged from nutritional database. \${Math.round(cachedResult.scaledCalories)} kcal · \${cachedResult.scaledProtein}g protein\`, _fromCache: true };
        }
      }

      // STEP 2: AI with retry
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session?.access_token) {
            if (attempt === 0) { await supabase.auth.refreshSession(); } else { throw new Error('Session expired'); }
          }
          const { data: { session: freshSession } } = await supabase.auth.getSession();
          if (!freshSession?.access_token) throw new Error('No valid session');
          const { data, error } = await supabase.functions.invoke('parse-meal', { body: { text, remainingCalories, remainingProtein, mealType: selectedMealSlot }, headers: { Authorization: \`Bearer \${freshSession.access_token}\` } });
          if (error) {
            const status = (error as any)?.context?.status ?? 0;
            const msg = String(error.message ?? '');
            console.error(\`[parse-meal] attempt \${attempt + 1}: status=\${status} msg=\${msg}\`);
            if (status === 401 || status === 403) { if (attempt < 2) { await supabase.auth.refreshSession(); lastError = new Error('Auth — retrying'); continue; } throw new Error('Auth failed'); }
            if (status === 429) throw new Error('Daily AI limit reached');
            if (status >= 500 || msg.includes('fetch') || msg.includes('Network')) { lastError = new Error('Server unavailable'); if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; } throw new Error('AI unavailable'); }
            throw new Error(msg || 'AI failed');
          }
          if (!data || typeof data.calories !== 'number') { lastError = new Error('Invalid response'); if (attempt < 2) continue; throw new Error('Invalid AI data'); }
          await mealService.addMeal({ meal_text: text, calories: Math.round(data.calories), protein: Math.round(data.protein), fat: Math.round(data.fat), carbs: Math.round(data.carbs), meal_time: new Date().toISOString(), tip: data.foods_detected?.join(', ') || text, meal_slot: selectedMealSlot || undefined });
          return data;
        } catch (err: any) {
          console.error(\`[parse-meal] attempt \${attempt + 1} error:\`, err.message);
          lastError = err as Error;
          if (attempt < 2 && (err.message.includes('retrying') || err.message.includes('unavailable') || err.message.includes('Auth —'))) continue;
          break;
        }
      }

      // ── STEP 3: Guaranteed fallback — this block NEVER throws ─────────────────
      // If we reach here, all AI retry attempts have failed.
      // We ALWAYS return data so onSuccess fires, never onError.
      
      const errorContext = (() => {
        const msg = lastError?.message ?? '';
        if (msg.includes('limit')) return 'Daily AI limit reached';
        if (msg.includes('log out') || msg.includes('session')) return 'Session expired';
        if (msg.includes('Network') || msg.includes('fetch')) return 'No internet connection';
        return 'AI temporarily unavailable';
      })();

      const lowConfCache = (() => {
        try { return lookupCachedMeal(text); } catch { return null; }
      })();
      
      const fallback = lowConfCache
        ? {
            calories: lowConfCache.scaledCalories,
            protein: lowConfCache.scaledProtein,
            fat: lowConfCache.scaledFat,
            carbs: lowConfCache.scaledCarbs,
            confidence: lowConfCache.confidence,
          }
        : getDeterministicFallback(text);

      // Attempt to save — but NEVER let a save failure crash the function
      try {
        await mealService.addMeal({
          meal_text: text,
          calories: fallback.calories,
          protein: fallback.protein,
          fat: fallback.fat,
          carbs: fallback.carbs,
          meal_time: new Date().toISOString(),
          tip: \`Estimated: \${text}\`,
          meal_slot: selectedMealSlot || undefined,
        });
      } catch (saveErr) {
        // Save failed — log it but still return the estimate so onSuccess fires
        console.error('[meal-fallback] save to DB failed:', saveErr);
        // Do NOT rethrow. The user gets their estimate displayed even if save failed.
      }

      return {
        ...fallback,
        foods_detected: [text],
        coaching_tip: lowConfCache
          ? \`Database estimate — \${errorContext}.\`
          : \`Rough estimate — \${errorContext}.\`,
        _errorMessage: errorContext,
      };
      // ── END STEP 3 ─────────────────────────────────────────────────────────────
    },
`;

content = content.substring(0, startIndex) + replacement + content.substring(endIndex);

// Replace onError
const errStart = '    onError: (err, text, context) => {';
const errEnd = '    onSettled: () => {';
const eIdx = content.indexOf(errStart);
const eEndIdx = content.indexOf(errEnd);

if (eIdx === -1 || eEndIdx === -1) {
  console.log("Could not find onError block");
  process.exit(1);
}

const errReplacement = `    onError: (err) => {
      // This should be UNREACHABLE after the STEP 3 fix.
      // If you see this in production, it means mutationFn is still throwing somewhere.
      console.error('[addMealMutation] onError fired — mutationFn threw unexpectedly:', err);
      addChatMessage({ role: 'ai', text: '⚠️ Something unexpected happened. Please try again.' });
      setLoading(false);
    },
`;
content = content.substring(0, eIdx) + errReplacement + content.substring(eEndIdx);

fs.writeFileSync(path, content, 'utf8');
console.log('Success');
