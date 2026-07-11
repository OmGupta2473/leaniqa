import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { useAppStore } from "@/app/store";
import { useChatStore } from "@/app/store";
import { useNutritionStore } from "../store/nutritionStore";
import {
  Send, Loader2, Dumbbell, Lightbulb, Sun, Sunrise, Moon, Plus, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { SmoothInput } from "@/shared/components/SmoothInput";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealService } from "../services/mealService";
import { profileService } from "@/features/profile/services/profileService";
import { complianceService } from "@/features/reports/services/complianceService";
import { supabase } from "@/shared/utils/supabase";
import { motion, AnimatePresence } from "motion/react";
import { useVisualViewport } from "@/shared/hooks/useVisualViewport";
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
function MealSlotRow({ slot, icon, label, timeRange, meals, onDelete }: { slot: string; icon: React.ReactNode; label: string; timeRange: string; meals: any[], onDelete: (id: string) => void }) {
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
            <div key={m.id || i} className="flex items-center justify-between group">
              <div className="flex-1 min-w-0 pr-2">
                <div className="text-[12px] text-[rgba(235,235,245,0.7)] capitalize truncate">{m.meal_text}</div>
              </div>
              <div className="flex items-center gap-[4px] shrink-0">
                <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-[6px] py-[2px] rounded-full font-semibold">{m.calories} kcal</span>
                <span className="text-[10px] bg-[rgba(55,138,221,0.12)] text-[#378ADD] px-[6px] py-[2px] rounded-full font-semibold">{m.protein}g</span>
                {m.id && !m.id.toString().startsWith('opt-') && (
                   <button onClick={() => {
                      if (window.confirm("Delete Meal? This action cannot be undone.")) {
                         onDelete(m.id);
                      }
                   }} className="w-[20px] h-[20px] rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(235,235,245,0.6)] hover:bg-[rgba(255,77,28,0.2)] hover:text-[#FF4D1C] transition-colors ml-1">
                     <X size={10} />
                   </button>
                )}
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
  const initializeSession = useChatStore(s => s.initializeSession);
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
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });
  const keyboardOffset = useVisualViewport();

  useEffect(() => {
    if (profile?.id) {
      initializeSession(profile.id);
    }
  }, [profile?.id, initializeSession]);

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const isYesterday = (d: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.getDate() === yesterday.getDate() &&
           d.getMonth() === yesterday.getMonth() &&
           d.getFullYear() === yesterday.getFullYear();
  };

  const isAtOrBeforeCreatedAt = (d: Date) => {
    if (!profile?.created_at) return false;
    const createdAt = new Date(profile.created_at);
    // compare only year, month, day
    const dTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const cTime = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate()).getTime();
    return dTime <= cTime;
  };


  const formatDateLabel = (d: Date) => {
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const dateKeyStr = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  const getMealTime = () => {
    const d = new Date(selectedDate);
    const now = new Date();
    d.setHours(now.getHours());
    d.setMinutes(now.getMinutes());
    d.setSeconds(now.getSeconds());
    return d;
  };

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


  const { data: goal } = useQuery({ queryKey: ["goal"], queryFn: () => profileService.getGoal() });
  const { data: meals = [] } = useQuery({ queryKey: ["meals", "date", dateKeyStr], queryFn: () => mealService.getMealsForDate(selectedDate) });

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

  const deleteMealMutation = useMutation({
    mutationFn: async (id: string) => {
      console.group('Delete Meal Audit: ' + id);
      console.log('Meal Selected:', id);
      console.log('Delete Request sent to Database');
      await mealService.deleteMeal(id);
      console.log('Database Delete Response: Success');
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });
      const previousMeals = queryClient.getQueryData<any[]>(["meals", "date", dateKeyStr]);
      
      const newMeals = previousMeals ? previousMeals.filter((m: any) => m.id !== id) : [];
      
      queryClient.setQueryData(["meals", "date", dateKeyStr], newMeals);
      
      console.log('Remaining Meals:', newMeals.length);
      const newKcal = newMeals.reduce((s, m) => s + m.calories, 0);
      const newPro = newMeals.reduce((s, m) => s + m.protein, 0);
      console.log('Recalculated Daily Totals:', { calories: newKcal, protein: newPro });
      
      return { previousMeals };
    },
    onError: (err, id, context) => {
      console.error('Delete failed, rolling back:', err);
      console.groupEnd();
      if (context?.previousMeals) {
        queryClient.setQueryData(["meals", "date", dateKeyStr], context.previousMeals);
      }
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals", "date", dateKeyStr] }),
        ...(isToday(selectedDate) ? [queryClient.invalidateQueries({ queryKey: ["meals", "today"] })] : []),
        queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] }),
        complianceService.recalculateDayScore(selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0')).then(() => {
          console.log('Updated Dashboard & Progress Rings');
          return Promise.all([
            queryClient.invalidateQueries({ queryKey: ["complianceScore"] }),
            queryClient.invalidateQueries({ queryKey: ["dailyMetrics"] })
          ])
        }).catch(console.error)
      ]).then(() => {
        console.log('Updated History & Reports');
        console.groupEnd();
      });
    }
  });

  const handleDeleteMeal = (id: string) => {
    deleteMealMutation.mutate(id);
  };

  const addMealMutation = useMutation({
    mutationFn: async (text: string) => {
      // ── COMPOUND MEAL DETECTION ───────────────────────────────────────────────
      // If the text describes multiple foods, skip the cache entirely and let the
      // AI handle it. Cache is only for single-food entries like "2 eggs" or "100g chicken".
      const COMPOUND_PATTERN = /\b(with|and|aur|&|\+|along with|plus|sabzi|sabji|curry|masala)\b/i;
      const COMMA_SPLIT = text.split(',').filter(s => s.trim().length > 2);
      const isCompoundMeal = COMPOUND_PATTERN.test(text) || COMMA_SPLIT.length > 1;
      
      // ── STEP 1: Cache lookup — only for simple single-food entries ────────────
      console.log("=== MEAL LOGGING PIPELINE START ===");
      console.log("User Input:", text);
      
      if (!isCompoundMeal) {
        const cachedResult = lookupCachedMeal(text);
        if (cachedResult && cachedResult.confidence >= 90) {
          console.log("Nutrition Source Used: Cache");
          console.log("Parsed Food Name:", text);
          
          
          console.log("Nutrition Values Returned:", cachedResult);
          try {
             await mealService.addMeal({ meal_text: text, calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, meal_time: getMealTime().toISOString(), tip: text, meal_slot: selectedMealSlot || undefined });
          } catch (e) {
             console.error("Complete Error Stack:", e);
             throw e;
          }
          return { calories: cachedResult.scaledCalories, protein: cachedResult.scaledProtein, fat: cachedResult.scaledFat, carbs: cachedResult.scaledCarbs, confidence: cachedResult.confidence, foods_detected: [text], coaching_tip: `Logged from nutritional database. ${Math.round(cachedResult.scaledCalories)} kcal · ${cachedResult.scaledProtein}g protein`, _fromCache: true };
        }
      }
      console.log("Nutrition Source Used: AI / Function");

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
          await mealService.addMeal({ meal_text: text, calories: Math.round(data.calories), protein: Math.round(data.protein), fat: Math.round(data.fat), carbs: Math.round(data.carbs), meal_time: getMealTime().toISOString(), tip: data.foods_detected?.join(', ') || text, meal_slot: selectedMealSlot || undefined });
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
          meal_time: getMealTime().toISOString(),
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
      await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });
      const previousMeals = queryClient.getQueryData(["meals", "date", dateKeyStr]);
      
      const estimate = getDeterministicFallback(text);
      const optimisticMeal = {
        id: 'opt-' + Date.now(),
        meal_text: text,
        calories: estimate.calories,
        protein: estimate.protein,
        fat: estimate.fat,
        carbs: estimate.carbs,
        meal_slot: selectedMealSlot || "lunch",
        meal_time: getMealTime().toISOString()
      };
      
      queryClient.setQueryData(["meals", "date", dateKeyStr], (old: any) => {
        if (!old) return [optimisticMeal];
        return [...old, optimisticMeal];
      });

      return { previousMeals };
    },
    onSuccess: (data, text) => {
      const foodsDetected = Array.isArray(data?.foods_detected) && data?.foods_detected.length > 0 ? data.foods_detected.join(', ') : text;
      
      const newEatenKcal = eatenKcal + Math.round(data.calories);
      const newEatenProtein = eatenProtein + Math.round(data.protein);
      
      const newRemainingKcal = Math.max(0, dailyTargetKcal - newEatenKcal);
      const newRemainingProtein = Math.max(0, proteinTarget - newEatenProtein);

      console.group('Meal Parsing Audit: ' + text);
      console.log('User Input:', text);
      console.log('Parsed Food:', foodsDetected);
      console.log('Final Nutrition:', {
        calories: data.calories,
        protein: data.protein,
        fat: data.fat,
        carbs: data.carbs
      });
      console.log('Updated Daily Totals:', {
        calories: newEatenKcal,
        protein: newEatenProtein
      });
      console.log('Remaining Targets:', {
        calories: newRemainingKcal,
        protein: newRemainingProtein
      });
      console.groupEnd();

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
    onError: (err: any) => {
      console.error('[addMealMutation] onError fired — mutationFn threw unexpectedly:', err);
      console.error('Complete Error Stack:', err.stack || err);
      const errorMessage = typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err);
      addChatMessage({ role: 'ai', text: `⚠️ Error occurred: ${errorMessage}` });
      setLoading(false);
    },
    onSettled: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["meals", "date", dateKeyStr] }),
        ...(isToday(selectedDate) ? [queryClient.invalidateQueries({ queryKey: ["meals", "today"] })] : []),
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

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || loading || !selectedMealSlot) return;
    setInput("");
    addChatMessage({ role: "user", text });
    setLoading(true);
    addMealMutation.mutate(text);
  }, [input, loading, selectedMealSlot, addChatMessage, addMealMutation]);

  return (
    <>
      <div className="screen-container screen-enter" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── PAGE HEADER ── */}
      <div className="mb-[20px] flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-[22px] font-bold text-white tracking-[-0.3px]">Meal Log</h2>
          <div className="text-[13px] text-[rgba(235,235,245,0.5)] mt-[2px]">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (isAtOrBeforeCreatedAt(selectedDate)) return;
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d);
            }}
            disabled={isAtOrBeforeCreatedAt(selectedDate)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              isAtOrBeforeCreatedAt(selectedDate) ? "opacity-30 cursor-not-allowed" : "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer"
            )}
            title={isAtOrBeforeCreatedAt(selectedDate) ? "This is your first day on LeanIQA. No meal history exists before this date." : "Previous Day"}
          >
            <ChevronLeft size={16} className="text-white" />
          </button>
          <span className="text-[14px] font-medium text-white min-w-[80px] text-center">
            {formatDateLabel(selectedDate)}
          </span>
          <button 
            onClick={() => {
              if (isToday(selectedDate)) return;
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d);
            }}
            disabled={isToday(selectedDate)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
              isToday(selectedDate) ? "opacity-30 cursor-not-allowed" : "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer"
            )}
          >
            <ChevronRight size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* ── CALORIE RING SUMMARY ── */}
      <div className="glass-card p-[16px_20px] mb-[16px]">
        <div className="flex justify-between items-center mb-[12px]">
          <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[rgba(235,235,245,0.5)]">Daily Summary</div>
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
            <div className="h-full w-full rounded-full origin-left transition-transform duration-700 will-change-transform" style={{ transform: `translateX(-${100 - caloriePercent}%)`, background: eatenKcal > dailyTargetKcal ? '#FF4D1C' : '#D4FF00' }}></div>
          </div>
        </div>
        {/* Protein bar */}
        <div>
          <div className="flex justify-between mb-[4px]">
            <span className="text-[11px] text-[rgba(235,235,245,0.5)]">Protein</span>
            <span className="text-[11px] font-semibold text-white">{eatenProtein}g / {proteinTarget}g</span>
          </div>
          <div className="h-[6px] bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <div className="h-full w-full rounded-full bg-[#378ADD] origin-left transition-transform duration-700 will-change-transform" style={{ transform: `translateX(-${100 - proteinPercent}%)` }}></div>
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
                {meals.length === 0 && (
          <div className="text-[14px] text-center text-[rgba(235,235,245,0.5)] mb-[16px] italic">No meals logged for this day.</div>
        )}
        <MealSlotRow slot="breakfast" icon={<Sunrise size={14} />} label="Breakfast" timeRange="6 am – 12 pm" meals={breakfastMeals} onDelete={handleDeleteMeal} />
        <MealSlotRow slot="lunch" icon={<Sun size={14} />} label="Lunch" timeRange="12 pm – 6 pm" meals={lunchMeals} onDelete={handleDeleteMeal} />
        <MealSlotRow slot="dinner" icon={<Moon size={14} />} label="Dinner" timeRange="6 pm – 10 pm" meals={dinnerMeals} onDelete={handleDeleteMeal} />
      </div>      {/* ── SPACER TO PREVENT FAB OVERLAP ── */}
      <div style={{ height: '120px', flexShrink: 0 }} aria-hidden="true" />

      </div>
      {/* ── FLOATING ADD BUTTON ── */}
      <div className="meal-fab-positioner screen-enter">
        <div className="meal-fab-container">
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
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '20px 20px 0 0',
                borderTop: '0.5px solid rgba(255,255,255,0.12)',
                paddingBottom: `calc(env(safe-area-inset-bottom) + 16px + ${keyboardOffset}px)`,
                maxHeight: '88dvh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div style={{ minWidth: 0, paddingRight: '12px' }}>
                  <h3 className="text-[18px] font-bold text-white tracking-[-0.3px]">Log a Meal</h3>
                  <p className="text-[13px] text-[rgba(235,235,245,0.5)] truncate mt-[2px]">
                    Describe your meal, AI will calculate macros
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-[32px] h-[32px] shrink-0 rounded-full bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(235,235,245,0.6)] hover:bg-[rgba(255,255,255,0.15)] hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Slot Selector */}
              <div className="flex gap-[8px] p-[16px_20px_8px] overflow-x-auto shrink-0 hide-scrollbar border-b border-[rgba(255,255,255,0.04)]">
                {['breakfast', 'lunch', 'dinner'].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedMealSlot(slot as any)}
                    className={cn(
                      "px-[16px] py-[8px] rounded-full text-[13px] font-semibold transition-colors capitalize whitespace-nowrap",
                      selectedMealSlot === slot
                        ? "bg-[#D4FF00] text-[#0A0A0A]"
                        : "bg-[rgba(255,255,255,0.05)] text-[rgba(235,235,245,0.6)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>

              {/* Chat Interface */}
              <div 
                ref={chatRef}
                className="flex-1 overflow-y-auto p-[16px_20px] space-y-[16px] scroll-smooth"
              >
                {chat.map((msg, idx) => (
                  <div key={idx} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] p-[12px_16px] rounded-[16px] text-[14px] leading-[1.4]",
                      msg.role === 'user'
                        ? "bg-[#D4FF00] text-[#0A0A0A] rounded-br-[4px]"
                        : "bg-[rgba(255,255,255,0.08)] text-[rgba(235,235,245,0.9)] rounded-bl-[4px]"
                    )}>
                      <div>{msg.text}</div>
                      {msg.data?.coaching_tip && (
                        <div className="mt-[8px] pt-[8px] border-t border-[rgba(0,0,0,0.1)] text-[12px] opacity-80 flex items-start gap-[6px]">
                          <Lightbulb size={14} className="mt-[2px] shrink-0" />
                          <span>{msg.data.coaching_tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex w-full justify-start">
                    <div className="max-w-[85%] p-[12px_16px] rounded-[16px] rounded-bl-[4px] bg-[rgba(255,255,255,0.08)] text-[rgba(235,235,245,0.9)] flex items-center gap-[8px]">
                      <Loader2 size={16} className="animate-spin text-[#D4FF00]" />
                      <span className="text-[13px] font-medium">Analyzing meal...</span>
                    </div>
                  </div>
                )}
              </div>

<<<<<<< HEAD
              {/* Input row */}
              <div style={{ display: 'flex', gap: '10px', padding: '12px 20px 0', alignItems: 'center' }}>
                <input
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '100px', padding: '12px 16px', color: 'white', fontSize: '16px', outline: 'none' }}
                  type="text"
                  placeholder={selectedMealSlot ? "e.g. 2 boiled eggs and chai" : "Select breakfast / lunch / dinner"}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  onFocus={(e) => {
                    const target = e.target;
                    setTimeout(() => {
                      target.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }, 300);
                  }}
                  disabled={loading || !selectedMealSlot}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !selectedMealSlot || !input.trim()}
                  style={{ width: '44px', height: '44px', borderRadius: '50%', background: loading || !selectedMealSlot || !input.trim() ? 'rgba(212,255,0,0.3)' : '#D4FF00', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }}
                >
                  <Send size={18} color="#0A0A0A" />
                </button>
=======
              {/* Input Area */}
              <div className="p-[12px_20px] bg-[rgba(22,22,24,0.95)] border-t border-[rgba(255,255,255,0.06)] shrink-0">
                <div className="relative flex items-center bg-[rgba(255,255,255,0.05)] rounded-[24px] border border-[rgba(255,255,255,0.1)] focus-within:border-[rgba(212,255,0,0.5)] transition-colors">
                  <SmoothInput
                    value={input}
                    onChange={(e: any) => setInput(typeof e === 'string' ? e : e.target.value)}
                    onKeyDown={(e: any) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="e.g. 2 boiled eggs and a banana"
                    disabled={loading}
                    className="w-full bg-transparent border-none text-[15px] text-white p-[14px_48px_14px_16px] placeholder-[rgba(235,235,245,0.4)] focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                    className={cn(
                      "absolute right-[6px] w-[36px] h-[36px] rounded-full flex items-center justify-center transition-colors",
                      input.trim() && !loading
                        ? "bg-[#D4FF00] text-[#0A0A0A] hover:bg-[#bce600]"
                        : "bg-[rgba(255,255,255,0.05)] text-[rgba(235,235,245,0.3)]"
                    )}
                  >
                    <Send size={16} className={input.trim() && !loading ? "translate-x-[-1px] translate-y-[1px]" : ""} />
                  </button>
                </div>
                
                {aiStatus === 'offline' && (
                  <div className="text-center mt-[8px] flex items-center justify-center gap-1 text-[11px] font-medium text-[rgba(255,77,28,0.8)]">
                    <div className="w-[6px] h-[6px] rounded-full bg-[#FF4D1C] animate-pulse" />
                    Offline Mode — Local estimation active
                  </div>
                )}
>>>>>>> 4d430fa (MEAL LOGGER)
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

