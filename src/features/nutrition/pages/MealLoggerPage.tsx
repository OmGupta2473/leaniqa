import React, { Profiler } from 'react';
import { onRenderCallback, useRenderTracker } from '@/shared/utils/perfDebug';
import {  useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "@/app/store";
import { useChatStore } from "@/app/store";
import { useNutritionStore } from "../store/nutritionStore";
import {
  Send, Loader2, Dumbbell, Lightbulb, Sun, Sunrise, Moon,  Plus, X, ChevronLeft, ChevronRight, ArrowRight, ChevronDown, 
 } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { SmoothInput } from "@/shared/components/SmoothInput";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealService } from "../services/mealService";
import { profileService } from "@/features/profile/services/profileService";
import { complianceService } from "@/features/reports/services/complianceService";
import { supabase } from "@/shared/utils/supabase";
import { motion, AnimatePresence } from "motion/react";
import { useVisualViewport, useKeyboardOpen } from "@/shared/hooks/useVisualViewport";
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
  const [expanded, setExpanded] = useState(false);
  const kcal = meals.reduce((s, m) => s + m.calories, 0);
  const pro = meals.reduce((s, m) => s + m.protein, 0);
  return (
    <Profiler id="MealLoggerPage" onRender={onRenderCallback}>
      <div className="card-base mb-3 overflow-hidden">
      <div className="p-4 flex items-center justify-between select-none cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="text-[rgba(255,255,255,0.7)]">{icon}</div>
          <div>
            <div className="text-[14px] font-semibold text-white leading-none">{label}</div>
            <div className="text-[11px] text-[rgba(255,255,255,0.4)] mt-1">{timeRange}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-[14px] font-bold text-white leading-none">{kcal} kcal</div>
            <div className="text-[11px] font-semibold text-[#378ADD] mt-1">{pro}g protein</div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={16} className="text-[rgba(255,255,255,0.4)]" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-[rgba(255,255,255,0.06)] pt-3">
              {meals.length > 0 ? meals.map((m, i) => (
                <div key={m.id || i} className="flex items-center justify-between group">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="text-[13px] text-[rgba(255,255,255,0.8)] capitalize truncate">{m.meal_text}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-2 py-0.5 rounded-full font-bold">{m.calories} KCAL</span>
                    <span className="text-[10px] badge-lime px-2 py-0.5 font-bold rounded-full">{m.protein}G PRO</span>
                    {m.id && !m.id.toString().startsWith('opt-') && (
                      <button onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Delete Meal? This action cannot be undone.")) {
                            onDelete(m.id);
                          }
                      }} className="w-6 h-6 rounded-full flex items-center justify-center text-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,77,28,0.2)] hover:text-[#FF4D1C] transition-colors ml-1">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-[12px] text-[rgba(255,255,255,0.25)] italic">Nothing logged yet</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </Profiler>
  );
}

// ── MAIN SCREEN ────────────────────────────────────────────────────────────
export function MealLoggerPage() {
  useRenderTracker('MealLoggerPage');
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
  const isKeyboardOpen = useKeyboardOpen();

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
    if (import.meta.env.DEV) console.time('[PERF] MealLogger handleSend');
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
      {createPortal(
        <AnimatePresence>
          {modalOpen && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="meal-modal-content"
              style={{
                marginBottom: isKeyboardOpen ? `${keyboardOffset + 16}px` : undefined,
                paddingBottom: isKeyboardOpen ? '16px' : undefined
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
              <div className="px-5 pt-3">
                <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl p-1.5 flex gap-1 relative">
                  {([['breakfast', Sunrise, 'Breakfast', '6 AM - 12 PM'], ['lunch', Sun, 'Lunch', '12 PM - 6 PM'], ['dinner', Moon, 'Dinner', '6 PM - 10 PM']] as const).map(([slot, Icon, label, time]) => {
                    const isActive = selectedMealSlot === slot;
                    return (
                      <div
                        key={slot}
                        onClick={() => setSelectedMealSlot(slot as any)}
                        className={cn(
                          "flex-1 flex flex-col items-center py-2.5 rounded-xl cursor-pointer transition-colors duration-200 relative z-10",
                          isActive ? "text-white font-medium" : "text-[rgba(255,255,255,0.4)] bg-transparent"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="slotActive"
                            className="absolute inset-0 bg-[rgba(255,255,255,0.1)] rounded-xl -z-10"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <Icon size={14} className="mb-1" />
                        <div className="text-[13px]">{label}</div>
                        <div className="text-[9px] text-[rgba(255,255,255,0.32)] font-normal">{time}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI status indicator */}
              <div className="px-5 pt-3 flex items-center justify-center">
                {aiStatus === 'offline' && (
                  <div className="flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.4)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.25)]" />
                    <span>AI Offline — Using Database</span>
                  </div>
                )}
                {aiStatus === 'online' && (
                  <div className="flex items-center gap-2 text-[12px] text-[rgba(255,255,255,0.4)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_6px_#D4FF00] animate-pulse-glow" style={{ animation: 'pulseGlow 2s infinite ease-in-out' }} />
                    <style>{'@keyframes pulseGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }'}</style>
                    <span>Gemini AI Active</span>
                  </div>
                )}
              </div>

              {/* Chat messages */}
              <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '120px' }}>
                <AnimatePresence>
                  {chat.map((msg, i) => {
                    const isUser = msg.role === "user";
                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.16,1,0.3,1] }}
                        className={cn(
                          "p-[12px_16px] text-[14px] leading-relaxed relative",
                          isUser 
                            ? "bg-[rgba(212,255,0,0.12)] border-[0.5px] border-[rgba(212,255,0,0.2)] text-white rounded-2xl rounded-tr-sm max-w-[85%] self-end" 
                            : "bg-[rgba(255,255,255,0.04)] border-[0.5px] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.85)] rounded-2xl rounded-tl-sm max-w-[90%] self-start"
                        )}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        {msg.data && (
                          <div className="flex gap-[6px] flex-wrap mt-[8px]">
                            <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">~{msg.data.calories} kcal</span>
                            <span className="text-[10px] badge-lime px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{msg.data.protein}g pro</span>
                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.7)] px-2 py-0.5 rounded-full font-semibold">{msg.data.fat}g fat</span>
                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.7)] px-2 py-0.5 rounded-full font-semibold">{msg.data.carbs}g carb</span>
                          </div>
                        )}
                        {msg.data?.coaching_tip && (
                          <div className="mt-[12px] border-l-[3px] border-[#D4FF00]/40 bg-[rgba(212,255,0,0.05)] p-3 rounded-r-xl italic text-[13px] flex gap-[8px] items-start">
                            <Lightbulb size={16} className="text-[#D4FF00] mt-0.5 shrink-0" />
                            <div className="text-[rgba(235,235,245,0.75)]">{msg.data.coaching_tip}</div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                  {loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,255,255,0.04)] border-[0.5px] border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.85)] rounded-2xl rounded-tl-sm max-w-[85%] self-start p-[10px_14px] flex items-center gap-[8px] text-[13px]"
                    >
                      <Loader2 size={16} className="animate-spin text-[#D4FF00]" /> Analyzing meal...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input row */}
              <div className="glass-strong border-t border-[rgba(255,255,255,0.06)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex gap-3 items-center">
                <input
                  className="input-apple flex-1 text-[16px] placeholder:text-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.05)]"
                  style={{ borderRadius: '14px', border: '0.5px solid rgba(255,255,255,0.15)', padding: '12px 16px' }}
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
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  disabled={loading || !selectedMealSlot || !input.trim()}
                  className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0"
                  style={{ background: loading || !selectedMealSlot || !input.trim() ? 'rgba(212,255,0,0.3)' : '#D4FF00' }}
                >
                  <ArrowRight size={18} strokeWidth={2} color="#0A0A0A" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
