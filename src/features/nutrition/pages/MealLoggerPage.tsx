import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/app/store";
import { useChatStore } from "@/app/store";
import { useNutritionStore } from "../store/nutritionStore";
import {
  Send, Loader2, Dumbbell, Sun, Sunrise, Moon, Plus, X,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealService } from "../services/mealService";
import { profileService } from "@/features/profile";
import { complianceService } from "@/features/reports";
import { supabase } from "@/shared/utils/supabase";
import { motion, AnimatePresence } from "motion/react";
import { lookupCachedMeal } from '../constants/data';

const getDeterministicFallback = (text: string) => {
  const normalizedText = text.toLowerCase();
  let calories = 300, protein = 10, fat = 10, carbs = 40;
  let detected = [text];
  const foodDb: Record<string, { calories: number; protein: number; fat: number; carbs: number }> = {
    chicken: { calories: 250, protein: 30, fat: 10, carbs: 0 },
    dal: { calories: 200, protein: 12, fat: 4, carbs: 30 },
    chawal: { calories: 240, protein: 4, fat: 0, carbs: 53 },
    rice: { calories: 240, protein: 4, fat: 0, carbs: 53 },
    paneer: { calories: 350, protein: 20, fat: 28, carbs: 4 },
    fish: { calories: 200, protein: 25, fat: 10, carbs: 0 },
    idli: { calories: 150, protein: 4, fat: 0, carbs: 30 },
    roti: { calories: 120, protein: 4, fat: 1, carbs: 25 },
    egg: { calories: 140, protein: 12, fat: 10, carbs: 1 },
    salad: { calories: 50, protein: 2, fat: 0, carbs: 10 },
    chai: { calories: 100, protein: 2, fat: 3, carbs: 15 },
    biscuit: { calories: 150, protein: 2, fat: 5, carbs: 20 },
  };
  let foundMatch = false;
  for (const [key, macros] of Object.entries(foodDb)) {
    if (normalizedText.includes(key)) {
      if (!foundMatch) { calories = 0; protein = 0; fat = 0; carbs = 0; detected = []; foundMatch = true; }
      calories += macros.calories; protein += macros.protein; fat += macros.fat; carbs += macros.carbs;
      detected.push(key);
    }
  }
  return { calories, protein, fat, carbs, confidence: foundMatch ? 80 : 30, foods_detected: detected, coaching_tip: "Stay consistent with your portions to hit your goals." };
};

// ── SLOT ROW — used in the persistent summary ─────────────────────────────
function MealSlotRow({ slot, icon, label, timeRange, meals }: { slot: string; icon: React.ReactNode; label: string; timeRange: string; meals: any[] }) {
  const kcal = meals.reduce((s, m) => s + m.calories, 0);
  const pro = meals.reduce((s, m) => s + m.protein, 0);
  return (
    <div className="glass-card p-[14px_16px] mb-[8px]">
      <div className="flex items-center justify-between mb-[10px]">
        <div className="flex items-center gap-[10px]">
          <div className="w-[28px] h-[28px] rounded-full bg-[rgba(212,255,0,0.12)] flex items-center justify-center text-[#D4FF00]">
            {icon}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white">{label}</div>
            <div className="text-[11px] text-[rgba(235,235,245,0.45)]">{timeRange}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[14px] font-bold text-white">{kcal} <span className="text-[10px] font-normal text-[rgba(235,235,245,0.45)]">kcal</span></div>
          <div className="text-[11px] text-[rgba(55,138,221,0.9)] font-semibold">{pro}g protein</div>
        </div>
      </div>
      {meals.length > 0 && (
        <div className="space-y-[6px] pt-[8px] border-t border-[rgba(255,255,255,0.06)]">
          {meals.map((m, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="text-[12px] text-[rgba(235,235,245,0.7)] capitalize truncate max-w-[60%]">{m.meal_text}</div>
              <div className="flex gap-[6px]">
                <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-[6px] py-[2px] rounded-full font-semibold">{m.calories} kcal</span>
                <span className="text-[10px] bg-[rgba(55,138,221,0.12)] text-[#378ADD] px-[6px] py-[2px] rounded-full font-semibold">{m.protein}g</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {meals.length === 0 && (
        <div className="text-[11px] text-[rgba(235,235,245,0.3)] italic pt-[4px]">Nothing logged yet</div>
      )}
    </div>
  );
}

// ── MAIN SCREEN ────────────────────────────────────────────────────────────
export function MealLoggerPage() {
  const chatHistory = useChatStore(s => s.chatHistory);
  const addChatMessage = useChatStore(s => s.addChatMessage);
  const clearOldChats = useChatStore(s => s.clearOldChats);
  const activeModal = useAppStore(s => s.activeModal);
  const setActiveModal = useAppStore(s => s.setActiveModal);
  const modalOpen = activeModal === 'meal_logger';
  const setModalOpen = (isOpen: boolean) => setActiveModal(isOpen ? 'meal_logger' : null);
  const input = useNutritionStore(s => s.searchText);
  const setInput = useNutritionStore(s => s.setSearchText);
  const loading = useNutritionStore(s => s.aiParsingLoading);
  const setLoading = useNutritionStore(s => s.setAiParsingLoading);
  const aiStatus = useNutritionStore(s => s.aiStatus);
  const setAiStatus = useNutritionStore(s => s.setAiStatus);
  const selectedMealSlot = useNutritionStore(s => s.selectedMealSlot);
  const setSelectedMealSlot = useNutritionStore(s => s.setSelectedMealSlot);

  useEffect(() => {
    clearOldChats();
    const hour = new Date().getHours();
    if (hour < 12) setSelectedMealSlot("breakfast");
    else if (hour < 18) setSelectedMealSlot("lunch");
    else setSelectedMealSlot("dinner");
  }, [clearOldChats]);

  useEffect(() => {
    const checkAI = async () => {
      const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const online = navigator.onLine;
      setAiStatus(hasUrl && online ? 'online' : 'offline');
    };
    checkAI();
  }, []);

  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ["goal"], queryFn: () => profileService.getGoal() });
  const { data: meals = [] } = useQuery({ queryKey: ["meals", "today"], queryFn: () => mealService.getTodaysMeals() });

  const eatenKcal = meals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const eatenFat = meals.reduce((acc, m) => acc + m.fat, 0);
  const eatenCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const breakfastMeals = meals.filter(m => m.meal_slot === "breakfast");
  const lunchMeals = meals.filter(m => m.meal_slot === "lunch");
  const dinnerMeals = meals.filter(m => m.meal_slot === "dinner");

  const maintKcal = profile?.maintenance_kcal || 2200;
  const dailyTargetKcal = maintKcal - (goal?.deficit_kcal ?? 400);
  const proteinTarget = profile?.protein_target || 150;
  const remainingCalories = dailyTargetKcal - eatenKcal;
  const remainingProtein = proteinTarget - eatenProtein;
  const caloriePercent = Math.min(100, (eatenKcal / dailyTargetKcal) * 100);
  const proteinPercent = Math.min(100, (eatenProtein / proteinTarget) * 100);

  const chatRef = useRef<HTMLDivElement>(null);
  const chat = chatHistory.length > 0 ? chatHistory : [{ role: "ai" as const, text: "What did you eat? I'll calculate the macros and give you coaching advice." }];

  useEffect(() => {
    if (chatRef.current && modalOpen) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat, modalOpen]);

  const addMealMutation = useMutation({
    mutationFn: async (text: string) => {
      // ── COMPOUND MEAL DETECTION ───────────────────────────────────────────────
      // If the text describes multiple foods, skip the cache entirely and let the
      // AI handle it. Cache is only for single-food entries like "2 eggs" or "100g chicken".
      const COMPOUND_PATTERN = /\b(with|and|aur|&|\+|along with|plus|sabzi|sabji|curry|masala)\b/i;
      const COMMA_SPLIT = text.split(',').filter(s => s.trim().length > 2);
      const isCompoundMeal = COMPOUND_PATTERN.test(text) || COMMA_SPLIT.length > 1;
      
      // ── STEP 1: Cache lookup — only for simple single-food entries ────────────
      if (!isCompoundMeal) {
        const cachedResult = lookupCachedMeal(text);
        if (cachedResult && cachedResult.confidence >= 90) {
          await mealService.addMeal({ meal_text: text, calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, meal_time: new Date().toISOString(), tip: text, meal_slot: selectedMealSlot || undefined });
          return { calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, confidence: cachedResult.confidence, foods_detected: [text], coaching_tip: `Logged from nutritional database. ${Math.round(cachedResult.scaledCalories)} kcal · ${cachedResult.scaledProtein}g protein`, _fromCache: true };
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
          const { data, error } = await supabase.functions.invoke('parse-meal', { body: { text, remainingCalories, remainingProtein, mealType: selectedMealSlot }, headers: { Authorization: `Bearer ${freshSession.access_token}` } });
          if (error) {
            const status = (error as any)?.context?.status ?? 0;
            const msg = String(error.message ?? '');
            console.error(`[parse-meal] attempt ${attempt + 1}: status=${status} msg=${msg}`);
            if (status === 401 || status === 403) { if (attempt < 2) { await supabase.auth.refreshSession(); lastError = new Error('Auth — retrying'); continue; } throw new Error('Auth failed'); }
            if (status === 429) throw new Error('Daily AI limit reached');
            if (status >= 500 || msg.includes('fetch') || msg.includes('Network')) { lastError = new Error('Server unavailable'); if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; } throw new Error('AI unavailable'); }
            throw new Error(msg || 'AI failed');
          }
          if (!data || typeof data.calories !== 'number') { lastError = new Error('Invalid response'); if (attempt < 2) continue; throw new Error('Invalid AI data'); }
          await mealService.addMeal({ meal_text: text, calories: Math.round(data.calories), protein: Math.round(data.protein), fat: Math.round(data.fat), carbs: Math.round(data.carbs), meal_time: new Date().toISOString(), tip: data.foods_detected?.join(', ') || text, meal_slot: selectedMealSlot || undefined });
          return data;
        } catch (err: any) {
          console.error(`[parse-meal] attempt ${attempt + 1} error:`, err.message);
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
          tip: `Estimated: ${text}`,
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
          ? `Database estimate — ${errorContext}.`
          : `Rough estimate — ${errorContext}.`,
        _errorMessage: errorContext,
      };
      // ── END STEP 3 ─────────────────────────────────────────────────────────────
    },
    onMutate: async (text: string) => {
      await queryClient.cancelQueries({ queryKey: ["meals", "today"] });
      const previousMeals = queryClient.getQueryData(["meals", "today"]);
      
      const estimate = getDeterministicFallback(text);
      const optimisticMeal = {
        id: 'opt-' + Date.now(),
        meal_text: text,
        calories: estimate.calories,
        protein: estimate.protein,
        fat: estimate.fat,
        carbs: estimate.carbs,
        meal_slot: selectedMealSlot || "lunch",
        meal_time: new Date().toISOString()
      };
      
      queryClient.setQueryData(["meals", "today"], (old: any) => {
        if (!old) return [optimisticMeal];
        return [...old, optimisticMeal];
      });

      return { previousMeals };
    },
    onSuccess: (data, text) => {
      const foodsDetected = Array.isArray(data?.foods_detected) && data?.foods_detected.length > 0 ? data.foods_detected.join(', ') : text;
      
      let responseText = `✓ Logged: ${foodsDetected}`;
      if (data?._localOnly) {
        responseText = `Saved locally — will sync when connection is restored.`;
      } else if (data?._fromCache) {
        responseText = `✓ Logged: ${foodsDetected}`;
      } else if (data?._errorMessage) {
        responseText = `📊 Estimated: ${foodsDetected}`;
      }
      
      const confidence = data?.confidence ?? 0;
      const confidenceTag = (confidence >= 90 || data?._localOnly) ? '' : ` · ${confidence}% confidence`;
      addChatMessage({ role: 'ai', text: responseText + confidenceTag, data });
      setLoading(false);
    },
    onError: (err) => {
      // This should be UNREACHABLE after the STEP 3 fix.
      // If you see this in production, it means mutationFn is still throwing somewhere.
      console.error('[addMealMutation] onError fired — mutationFn threw unexpectedly:', err);
      addChatMessage({ role: 'ai', text: '⚠️ Something unexpected happened. Please try again.' });
      setLoading(false);
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals", "today"] }),
        queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] }),
        complianceService.updateTodayScore().then(() => 
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
            queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] })
          ])
        ).catch(console.error)
      ]);
    },
  });

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading || !selectedMealSlot) return;
    setInput("");
    addChatMessage({ role: "user", text });
    setLoading(true);
    addMealMutation.mutate(text);
  }, [input, loading, selectedMealSlot, addChatMessage, addMealMutation]);

  return (
    <div className="screen-container screen-enter" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── PAGE HEADER ── */}
      <div className="mb-[20px]">
        <h2 className="text-[22px] font-bold text-white tracking-[-0.3px]">Today's Meals</h2>
        <div className="text-[13px] text-[rgba(235,235,245,0.5)] mt-[2px]">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
      </div>

      {/* ── CALORIE RING SUMMARY ── */}
      <div className="glass-card p-[16px_20px] mb-[16px]">
        <div className="flex justify-between items-center mb-[12px]">
          <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[rgba(235,235,245,0.5)]">Today's Progress</div>
          <div className="text-[12px] font-semibold" style={{ color: eatenKcal > dailyTargetKcal ? '#FF4D1C' : '#D4FF00' }}>
            {eatenKcal > dailyTargetKcal ? `${eatenKcal - dailyTargetKcal} over` : `${dailyTargetKcal - eatenKcal} left`}
          </div>
        </div>
        {/* Calorie bar */}
        <div className="mb-[10px]">
          <div className="flex justify-between mb-[4px]">
            <span className="text-[11px] text-[rgba(235,235,245,0.5)]">Calories</span>
            <span className="text-[11px] font-semibold text-white">{eatenKcal} / {dailyTargetKcal} kcal</span>
          </div>
          <div className="h-[6px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${caloriePercent}%`, background: eatenKcal > dailyTargetKcal ? '#FF4D1C' : '#D4FF00' }}></div>
          </div>
        </div>
        {/* Protein bar */}
        <div>
          <div className="flex justify-between mb-[4px]">
            <span className="text-[11px] text-[rgba(235,235,245,0.5)]">Protein</span>
            <span className="text-[11px] font-semibold text-white">{eatenProtein}g / {proteinTarget}g</span>
          </div>
          <div className="h-[6px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#378ADD] transition-all duration-700" style={{ width: `${proteinPercent}%` }}></div>
          </div>
        </div>
        {/* Macros row */}
        <div className="grid grid-cols-4 gap-[8px] mt-[14px] pt-[12px] border-t border-[rgba(255,255,255,0.06)]">
          {[{ label: 'Kcal', val: eatenKcal, color: '#FF4D1C' }, { label: 'Protein', val: `${eatenProtein}g`, color: '#378ADD' }, { label: 'Fat', val: `${eatenFat}g`, color: 'white' }, { label: 'Carbs', val: `${eatenCarbs}g`, color: 'white' }].map(item => (
            <div key={item.label} className="text-center">
              <div className="text-[14px] font-bold" style={{ color: item.color }}>{item.val}</div>
              <div className="text-[10px] text-[rgba(235,235,245,0.4)] mt-[1px]">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MEAL SLOT ROWS ── */}
      <div>
        <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[rgba(235,235,245,0.5)] mb-[10px]">Meal Log</div>
        <MealSlotRow slot="breakfast" icon={<Sunrise size={14} />} label="Breakfast" timeRange="6 am – 12 pm" meals={breakfastMeals} />
        <MealSlotRow slot="lunch" icon={<Sun size={14} />} label="Lunch" timeRange="12 pm – 6 pm" meals={lunchMeals} />
        <MealSlotRow slot="dinner" icon={<Moon size={14} />} label="Dinner" timeRange="6 pm – 10 pm" meals={dinnerMeals} />
      </div>

      {/* ── FLOATING ADD BUTTON ── */}
      {/* Sticky add button — stays inside the app container, not the viewport */}
      <div style={{
        position: 'sticky',
        bottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        display: 'flex',
        justifyContent: 'flex-end',
        paddingRight: '4px',
        pointerEvents: 'none',
        // Margin-top auto pushes it to bottom of scrollable content
        marginTop: 'auto',
      }}>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#D4FF00',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(212,255,0,0.35), 0 2px 8px rgba(0,0,0,0.4)',
            pointerEvents: 'auto',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            flexShrink: 0,
          }}
          onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
          onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          aria-label="Log a meal"
        >
          <Plus size={24} color="#0A0A0A" strokeWidth={2.5} />
        </button>
      </div>

      {/* ── LOG MEAL MODAL ── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '480px',
                margin: '0 auto',
                background: 'rgba(22,22,24,0.99)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                borderRadius: '20px 20px 0 0',
                borderTop: '0.5px solid rgba(255,255,255,0.12)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
                maxHeight: '88dvh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div style={{ minWidth: 0, paddingRight: '12px' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Log a meal</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'rgba(235,235,245,0.45)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Type naturally, I handle the rest</div>
                </div>
                <button onClick={() => setModalOpen(false)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
                  <X size={16} />
                </button>
              </div>

              {/* Meal slot selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px 20px 0' }}>
                {([['breakfast', Sunrise, 'Breakfast'], ['lunch', Sun, 'Lunch'], ['dinner', Moon, 'Dinner']] as const).map(([slot, Icon, label]) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedMealSlot(slot as any)}
                    style={{
                      minWidth: 0,
                      padding: '8px 4px',
                      borderRadius: '10px',
                      border: `1px solid ${selectedMealSlot === slot ? '#D4FF00' : 'rgba(255,255,255,0.1)'}`,
                      background: selectedMealSlot === slot ? 'rgba(212,255,0,0.1)' : 'rgba(255,255,255,0.04)',
                      color: selectedMealSlot === slot ? '#D4FF00' : 'rgba(235,235,245,0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>

              {/* AI status indicator */}
              <div style={{ padding: '8px 20px 0' }}>
                {aiStatus === 'offline' && (
                  <div style={{ background: 'rgba(255,77,28,0.08)', border: '0.5px solid rgba(255,77,28,0.2)', borderRadius: '8px', padding: '6px 10px', fontSize: 'var(--font-xs)', color: 'rgba(255,77,28,0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚡</span> Using database estimates · AI offline
                  </div>
                )}
                {aiStatus === 'online' && (
                  <div style={{ background: 'rgba(212,255,0,0.06)', border: '0.5px solid rgba(212,255,0,0.2)', borderRadius: '8px', padding: '6px 10px', fontSize: 'var(--font-xs)', color: 'rgba(212,255,0,0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4FF00', display: 'inline-block' }}></span> Gemini AI active
                  </div>
                )}
              </div>

              {/* Chat messages */}
              <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
                {chat.map((msg, i) => (
                  <div key={i} className={cn("max-w-[88%] p-[10px_14px] text-[14px] leading-relaxed", msg.role === "user" ? "bg-[#D4FF00] text-[#0A0A0A] rounded-[14px] rounded-br-[4px] self-end" : "glass-card text-white rounded-[14px] rounded-bl-[4px] self-start")}>
                    <div>{msg.text}</div>
                    {msg.data && (
                      <div className="flex gap-[6px] flex-wrap mt-[8px]">
                        <span className="text-[10px] px-[7px] py-[2px] rounded-full font-semibold bg-[rgba(255,77,28,0.15)] text-[#FF4D1C]">~{msg.data.calories} kcal</span>
                        <span className="text-[10px] px-[7px] py-[2px] rounded-full font-semibold bg-[rgba(55,138,221,0.15)] text-[#378ADD]">{msg.data.protein}g pro</span>
                        <span className="text-[10px] px-[7px] py-[2px] rounded-full font-semibold bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.7)]">{msg.data.fat}g fat</span>
                        <span className="text-[10px] px-[7px] py-[2px] rounded-full font-semibold bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.7)]">{msg.data.carbs}g carb</span>
                      </div>
                    )}
                    {msg.data?.coaching_tip && (
                      <div className="mt-[10px] pt-[8px] border-t border-[rgba(255,255,255,0.06)] flex gap-[6px]">
                        <Dumbbell size={13} className="text-[#D4FF00] mt-[2px] shrink-0" />
                        <div className="text-[12px] text-[rgba(235,235,245,0.65)] italic">{msg.data.coaching_tip}</div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="glass-card text-white rounded-[14px] rounded-bl-[4px] self-start p-[10px_14px] max-w-[88%] flex items-center gap-[6px] text-[13px]">
                    <Loader2 size={14} className="animate-spin text-[#D4FF00]" /> Analyzing meal...
                  </div>
                )}
              </div>

              {/* Input row */}
              <div style={{ display: 'flex', gap: '10px', padding: '12px 20px 0', alignItems: 'center' }}>
                <input
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '100px', padding: '12px 16px', color: 'white', fontSize: '15px', outline: 'none' }}
                  type="text"
                  placeholder={selectedMealSlot ? "e.g. 2 boiled eggs and chai" : "Select breakfast / lunch / dinner"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={loading || !selectedMealSlot}
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !selectedMealSlot || !input.trim()}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', background: loading || !selectedMealSlot || !input.trim() ? 'rgba(212,255,0,0.3)' : '#D4FF00', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
                >
                  <Send size={18} color="#0A0A0A" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
