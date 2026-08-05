import React from 'react';
import { PerfProfiler } from '@/shared/utils/perfDebug';
import {  useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "@/app/store";
import { useChatStore } from "@/app/store";
import { useNutritionStore } from "../store/nutritionStore";
import {
  Send, Loader2, Dumbbell, Lightbulb, Sun, Sunrise, Moon, Coffee, Plus, X, ChevronLeft, ChevronRight, ArrowRight, ChevronDown, 
 AlertTriangle } from "lucide-react";
import { EmptyState } from '@/shared/components/EmptyState';
import { CustomMealModal } from '../components/CustomMealModal';
import { cn } from "@/shared/utils/utils";
import { SmoothInput } from "@/shared/components/SmoothInput";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDailyNutrition } from "@/features/nutrition/hooks/useDailyNutrition";
import { onMealSaved } from "@/features/nutrition/utils/mealSync";
import { mealService } from "../services/mealService";
import { profileService } from "@/features/profile/services/profileService";
import { complianceService } from "@/features/reports/services/complianceService";
import { supabase } from "@/shared/utils/supabase";
import { motion, AnimatePresence } from "motion/react";
import { useVisualViewport, useKeyboardOpen } from "@/shared/hooks/useVisualViewport";
import { lookupCachedMeal } from '../constants/data';
import { haptics } from '@/shared/utils/haptics';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { analytics } from '@/shared/utils/analytics';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { MealLoggerSkeleton } from '@/shared/components/Skeletons';
import { useToast } from '@/shared/components/Toast';
import { devLog } from '@/shared/utils/logger';

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
  const { toast } = useToast();
  const kcal = meals.reduce((s, m) => s + m.calories, 0);
  const pro = meals.reduce((s, m) => s + m.protein, 0);
  return (
    <PerfProfiler id="MealLoggerPage">
      <motion.div 
        layout
        className="mb-4 overflow-hidden rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] shadow-sm backdrop-blur-xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)]"
      >
      <div className="p-5 flex items-center justify-between select-none cursor-pointer" onClick={() => { haptics.tap(); setExpanded(!expanded); }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[rgba(255,255,255,0.8)] shadow-inner">
            {icon}
          </div>
          <div>
            <div className="text-[17px] font-semibold text-white tracking-tight">{label}</div>
            <div className="text-[13px] font-medium text-[rgba(255,255,255,0.4)] mt-0.5">{timeRange}</div>
          </div>
        </div>
        <div className="flex items-center gap-5 text-right">
          <div>
            <div className="text-[16px] font-bold text-white tracking-tight">{kcal} <span className="text-[12px] font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">kcal</span></div>
            <div className="text-[13px] font-semibold text-[#378ADD] mt-0.5">{pro}<span className="text-[10px] font-medium opacity-70 uppercase tracking-wider">g pro</span></div>
          </div>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}>
            <ChevronDown size={20} className="text-[rgba(255,255,255,0.4)]" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-[rgba(255,255,255,0.06)] pt-4">
              {meals.length > 0 ? meals.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={m.id || i} 
                  className="flex items-center justify-between group p-2.5 sm:p-3 rounded-[16px] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] transition-colors gap-2"
                >
                  <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center items-start gap-1">
                    <div className="text-[13px] leading-tight font-medium text-[rgba(255,255,255,0.9)] capitalize break-words whitespace-normal break-all sm:break-normal">{m.meal_text}</div>
                    <div className="flex gap-1.5 mt-0.5">
                      {m._localOnly && (
                        <span className="text-[9px] bg-[rgba(255,255,255,0.1)] text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shrink-0">
                          Offline
                        </span>
                      )}
                      {(m.meal_source === 'manual' || m.tip === 'Manually logged meal.') && (
                        <span className="text-[9px] bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.5)] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1 shrink-0">
                          Manual
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[8.5px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-1.5 py-0.5 rounded-full font-bold tracking-wide whitespace-nowrap">{m.calories} KCAL</span>
                    <span className="text-[8.5px] badge-lime px-1.5 py-0.5 font-bold rounded-full tracking-wide whitespace-nowrap">{m.protein}G PRO</span>
                    {m.id && !m.id.toString().startsWith('opt-') && (
                      <button aria-label="Delete meal" className="ml-0.5 w-6 h-6 shrink-0 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,77,28,0.2)] flex items-center justify-center text-[rgba(255,255,255,0.5)] hover:text-[#FF4D1C] transition-colors" onClick={(e) => {
                          e.stopPropagation();
                          toast({
                            type: 'warning',
                            message: 'Delete meal?',
                            duration: 5000,
                            action: {
                              label: 'Delete',
                              onClick: () => onDelete(m.id)
                            }
                          });
                      }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )) : (
                <div className="text-[14px] text-[rgba(255,255,255,0.4)] text-center py-4 font-medium">Nothing logged yet</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </PerfProfiler>
  );
}

// ── MAIN SCREEN ────────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Analyzing meal…",
  "Estimating portions…",
  "Calculating nutrition…",
  "Checking confidence…",
  "Preparing recommendations…"
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
  const isKeyboardOpen = useKeyboardOpen();
  const isSubmittingRef = React.useRef(false);

  useEffect(() => {
    if (profile?.id) {
      initializeSession(profile.id);
    }
  }, [profile?.id, initializeSession]);

  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [pendingMeal, setPendingMeal] = useState<{ text: string; data: any } | null>(null);
  const [failedMealText, setFailedMealText] = useState<string | null>(null);
  const [failedMealError, setFailedMealError] = useState<string | null>(null);
  const [isCustomMealModalOpen, setIsCustomMealModalOpen] = useState(false);
  const [retryCount, setRetryCount] = useState<number>(0);

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
  
  const {
    meals,
    isMealsLoading: isLoading,
    profileData: onboardingData,
    proteinTarget,
    dailyTargetKcal,
    fatTarget,
    carbsTarget,
    eatenKcal,
    eatenProtein,
    eatenFat,
    eatenCarbs,
    remainingKcal: remainingCalories,
    remainingProtein,
    calPct,
    proPct,
    isOnline
  } = useDailyNutrition(selectedDate);

  const breakfastMeals = meals.filter(m => m.meal_slot?.toLowerCase() === "breakfast");
  const lunchMeals = meals.filter(m => m.meal_slot?.toLowerCase() === "lunch");
  const dinnerMeals = meals.filter(m => m.meal_slot?.toLowerCase() === "dinner");
  const snackMeals = meals.filter(m => m.meal_slot?.toLowerCase() === "snack" || m.meal_slot?.toLowerCase() === "snacks");

  const caloriePercent = Math.min(100, calPct * 100);
  const proteinPercent = Math.min(100, proPct * 100);

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
      devLog('Meal Selected:', id);
      if (typeof window !== 'undefined' && !navigator.onLine) {
        devLog('Offline: queueing delete meal');
        const { offlineSyncService } = await import('@/shared/services/offlineSyncService');
        offlineSyncService.enqueue({ type: 'DELETE_MEAL', payload: id });
        return id;
      }
      devLog('Delete Request sent to Database');
      await mealService.deleteMeal(id);
      devLog('Database Delete Response: Success');
      return id;
    },
    onMutate: async (id) => {
      const now = new Date();
      const isToday = selectedDate.getFullYear() === now.getFullYear() && 
                      selectedDate.getMonth() === now.getMonth() && 
                      selectedDate.getDate() === now.getDate();

      await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });
      if (isToday) {
        await queryClient.cancelQueries({ queryKey: ["meals"] });
      }
      
      const previousMeals = queryClient.getQueryData<any[]>(["meals", "date", dateKeyStr]);
      const previousTodayMeals = queryClient.getQueryData<any[]>(["meals"]);
      
      const newMeals = previousMeals ? previousMeals.filter((m: any) => m.id !== id) : [];
      queryClient.setQueryData(["meals", "date", dateKeyStr], newMeals);

      if (isToday && previousTodayMeals) {
        queryClient.setQueryData(["meals"], previousTodayMeals.filter((m: any) => m.id !== id));
      }
      
      devLog('Remaining Meals:', newMeals.length);
      const newKcal = newMeals.reduce((s, m) => s + m.calories, 0);
      const newPro = newMeals.reduce((s, m) => s + m.protein, 0);
      devLog('Recalculated Daily Totals:', { calories: newKcal, protein: newPro });
      
      return { previousMeals, previousTodayMeals, isToday };
    },
    onError: (err, id, context) => {
      console.error('Delete failed, rolling back:', err);
      console.groupEnd();
      if (context?.previousMeals) {
        queryClient.setQueryData(["meals", "date", dateKeyStr], context.previousMeals);
      }
      if (context?.isToday && context?.previousTodayMeals) {
        queryClient.setQueryData(["meals"], context.previousTodayMeals);
      }
    },
    onSettled: () => {
      onMealSaved(dateKeyStr).then(() => {
        devLog('Updated Dashboard & Progress Rings');
        devLog('Updated History & Reports');
        console.groupEnd();
      });
    }
  });

  
  const handleCustomMealSave = (mealData: any) => {
    confirmMealMutation.mutate({
      text: mealData.meal_text,
      data: {
        calories: mealData.calories,
        protein: mealData.protein,
        fat: mealData.fat,
        carbs: mealData.carbs,
        fiber: mealData.fiber,
        meal_slot: mealData.meal_slot,
        tip: mealData.tip
      },
      source: 'manual'
    });
  };

  const handleDeleteMeal = (id: string) => {
    deleteMealMutation.mutate(id);
  };

  const parseMealMutation = useMutation({
    mutationFn: async (text: string) => {
      devLog("=== MEAL LOGGING PIPELINE START ===");
      devLog("User Input:", text);
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
            let currentSession = session;
            if (sessionError || !session?.access_token) {
              if (attempt === 0) { 
                const { data: refreshData } = await supabase.auth.refreshSession(); 
                currentSession = refreshData.session;
              } else { 
                throw new Error('Authentication failure'); 
              }
            }

            if (!currentSession?.access_token) throw new Error('Authentication failure');

            const edgeStart = Date.now();
            const { data: responseBody, error: functionError } = await supabase.functions.invoke('parse-meal', {
              body: { 
                text, 
                remainingCalories, 
                remainingProtein, 
                mealType: selectedMealSlot, 
                userGoal: onboardingData?.goal 
              }
            });

            aiResponseDuration = Date.now() - edgeStart;

            if (functionError) {
              let msg = functionError.message || 'Server error';
              
              if (functionError.context && typeof functionError.context.json === 'function') {
                try {
                  const errorBody = await functionError.context.json();
                  if (errorBody && errorBody.error) {
                    msg = errorBody.error;
                  }
                } catch(e) {}
              }

              if (msg.includes('Auth') || msg.includes('Authentication') || msg.includes('JWT') || functionError.message?.includes('Auth')) { 
                if (attempt < 2) { await supabase.auth.refreshSession(); lastError = new Error('Auth — retrying'); continue; }
                throw new Error('Authentication failure');
              }
              if (msg.includes('429') || msg.includes('limit reached')) throw new Error('Daily AI limit reached');
              if (msg.includes('504') || msg.includes('timeout')) {
                lastError = new Error('AI took too long to respond');
                if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; }
                throw new Error('AI took too long to respond');
              }
              
              throw new Error(msg.includes('Friendly Retry') ? msg : `AI Service Error: ${msg}`);
            }

            if (responseBody) {
              responseBody._latency = aiResponseDuration;
            }
            
            let data = responseBody;

            if (!data || typeof data.calories !== 'number') { 
              if (import.meta.env.DEV) {
                console.error('[MealLogger] Parsing Error - Invalid AI response data:', data);
              }
              lastError = new Error('AI returned invalid data');
              if (attempt < 2) continue;
              throw new Error('AI returned invalid data');
            }
            
            return data;
          } catch (err: any) {
            lastError = err as Error;
            const retryableErrors = ['retrying', 'unavailable', 'Auth —', 'Server error', 'timeout', 'too long', 'Network', 'internet', 'invalid data'];
            if (attempt < 2 && retryableErrors.some(retryMsg => err.message.includes(retryMsg))) continue;
            break;
          }
        }
      }

      const errorContext = (() => {
        const msg = lastError?.message ?? '';
        return msg || 'AI temporarily unavailable';
      })();
      
      return { _errorMessage: errorContext, text };
    },
    onSuccess: (data, text) => {
      isSubmittingRef.current = false;
      setLoading(false);
      
      // Calculate costs
      let cost = 0;
      if (data.provider === 'gemini') cost = 0.0001;
      else if (data.provider === 'groq') cost = 0.00005;
      else if (data.provider === 'mistral') cost = 0.00002;

      const eventData = {
        source: data.source || 'unknown',
        provider: data.provider || 'none',
        latency: data._latency || 0,
        fallbackCount: data.fallbackCount || 0,
        confidence: data.confidence || 0,
        estimatedCost: cost,
        hitRateType: data.source // cache, rule_engine, ai
      };

      if (data._errorMessage) {
        analytics.trackEvent('AI Parse Failure', { error: data._errorMessage, input: text });
        setFailedMealError(data._errorMessage);
        setFailedMealText(null);
      } else if (data.confidence && data.confidence < 80) {
        analytics.trackEvent('AI Parse Failure', { error: 'Low confidence', input: text });
        setFailedMealText(text);
        setFailedMealError(null);
      } else {
        setRetryCount(0);
        
        analytics.trackEvent('Meal Parse Analytics', eventData);
        analytics.trackEvent('AI Parse Success', { confidence: data.confidence, calories: data.calories });
        
        setPendingMeal({ text, data });
      }
    },
    onError: (err: any, variables) => {
      isSubmittingRef.current = false;
      console.error('[parseMealMutation] onError fired:', err);
      let errorMessage = 'An unexpected error occurred';
      if (err instanceof Error) errorMessage = err.message;
      else if (typeof err === 'string') errorMessage = err;
      
      analytics.trackEvent('AI Parse Failure', { error: errorMessage, type: 'mutation_error' });
      setFailedMealError(errorMessage);
      setFailedMealText(null);
      setLoading(false);
    }
  });

  const confirmMealMutation = useMutation({
    mutationFn: async ({ text, data, source }: { text: string, data: any, source?: 'manual' | 'ai' }) => {
      let finalSlot = data.meal_slot || selectedMealSlot || undefined;
      if (typeof finalSlot === 'string') {
        finalSlot = finalSlot.toLowerCase();
        if (finalSlot === 'snacks') finalSlot = 'snack';
      }

      const mealData = { 
        meal_text: text, 
        calories: Math.round(data.calories), 
        protein: Math.round(data.protein), 
        fat: Math.round(data.fat), 
        carbs: Math.round(data.carbs), 
        fiber: data.fiber ? Math.round(data.fiber) : undefined,
        meal_time: getMealTime().toISOString(), 
        tip: data.tip || data.foods_detected?.join(', ') || text, 
        meal_slot: finalSlot,
        meal_source: source || 'ai'
      };

      if (typeof window !== 'undefined' && !navigator.onLine) {
        devLog('Offline: queueing add meal');
        const { offlineSyncService } = await import('@/shared/services/offlineSyncService');
        offlineSyncService.enqueue({ type: 'ADD_MEAL', payload: mealData });
        return { text, data, source, _localOnly: true };
      }

      await mealService.addMeal(mealData as any);
      return { text, data, source };
    },
    onMutate: async ({ text, data, source }) => {
      const dateKeyStr = selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0');
      const now = new Date();
      const isToday = selectedDate.getFullYear() === now.getFullYear() && 
                      selectedDate.getMonth() === now.getMonth() && 
                      selectedDate.getDate() === now.getDate();
      
      await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });
      if (isToday) {
        await queryClient.cancelQueries({ queryKey: ["meals"] });
      }

      const previousMeals = queryClient.getQueryData<any[]>(["meals", "date", dateKeyStr]);
      const previousTodayMeals = queryClient.getQueryData<any[]>(["meals"]);
      
      let finalSlot = data.meal_slot || selectedMealSlot || undefined;
      if (typeof finalSlot === 'string') {
        finalSlot = finalSlot.toLowerCase();
        if (finalSlot === 'snacks') finalSlot = 'snack';
      }

      const newMealObj = { 
        id: 'temp-' + Date.now(), 
        meal_text: text,
        calories: Math.round(data.calories),
        protein: Math.round(data.protein),
        fat: Math.round(data.fat),
        carbs: Math.round(data.carbs),
        fiber: data.fiber ? Math.round(data.fiber) : undefined,
        meal_slot: finalSlot,
        meal_source: source || 'ai',
        _localOnly: true 
      };

      if (previousMeals) {
        queryClient.setQueryData(["meals", "date", dateKeyStr], [...previousMeals, newMealObj]);
      }
      if (isToday && previousTodayMeals) {
        queryClient.setQueryData(["meals"], [...previousTodayMeals, newMealObj]);
      }

      return { previousMeals, previousTodayMeals, isToday, dateKeyStr };
    },
    onSuccess: ({ text, data, source }) => {
      setPendingMeal(null);
      haptics.success();
      haptics.success();
      
      if (source === 'manual') {
        analytics.trackEvent('Custom Meal Logged', { calories: data.calories } as any);
        setIsCustomMealModalOpen(false);
        addChatMessage({ role: 'ai', text: `✓ Logged Custom Meal: ${text}` });
      } else {
        const foodsDetected = Array.isArray(data?.foods_detected) && data?.foods_detected.length > 0 ? data.foods_detected.join(', ') : text;
        let responseText = `✓ Logged: ${foodsDetected}`;
        if (data?._fromCache) {
          responseText = `✓ Logged: ${foodsDetected}`;
        }
        addChatMessage({ role: 'ai', text: responseText, data });
      }
      
      setTimeout(() => {
        setModalOpen(false);
      }, 800);
    },
    onError: (err: any, variables: any, context: any) => {
      console.error('[confirmMealMutation] onError:', err);
      addChatMessage({ role: 'ai', text: `⚠️ Failed to save meal. Please try again.` });
      
      if (context?.dateKeyStr && context?.previousMeals) {
        queryClient.setQueryData(["meals", "date", context.dateKeyStr], context.previousMeals);
      }
      if (context?.isToday && context?.previousTodayMeals) {
        queryClient.setQueryData(["meals"], context.previousTodayMeals);
      }
    },
    onSettled: () => {
      onMealSaved(selectedDate.getFullYear() + '-' + String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + String(selectedDate.getDate()).padStart(2, '0'));
    }
  });

  const handleSend = React.useCallback(() => {
    const text = input.trim();
    if (!text || loading || isSubmittingRef.current || !selectedMealSlot) return;
    isSubmittingRef.current = true;
    if (import.meta.env.DEV) console.time('[PERF] MealLogger handleSend');
    setInput("");
    setPendingMeal(null);
    setFailedMealText(null);
    setFailedMealError(null);
    setRetryCount(0);
    addChatMessage({ role: "user", text });
    setLoading(true);
    parseMealMutation.mutate(text);
  }, [input, loading, selectedMealSlot, addChatMessage, parseMealMutation]);

  if (isLoading) {
    if (!isOnline) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] pb-[100px] flex flex-col items-center justify-center px-6 text-center">
          <AlertTriangle className="w-12 h-12 text-[rgba(255,255,255,0.2)] mb-4" />
          <h2 className="text-[18px] font-semibold text-white mb-2">You're offline</h2>
          <p className="text-[14px] text-[rgba(255,255,255,0.6)]">
            Connect to the internet to load your meals for the first time.
          </p>
        </div>
      );
    }
    return <MealLoggerSkeleton />;
  }

  return (
    <>
      <div className="screen-container screen-enter" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ── PAGE HEADER ── */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-[28px] font-semibold text-white tracking-tight">Meal Log</h2>
          <div className="text-[14px] font-medium text-[rgba(235,235,245,0.5)] mt-0.5">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (isAtOrBeforeCreatedAt(selectedDate)) return;
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d);
            }}
            disabled={isAtOrBeforeCreatedAt(selectedDate)}
            className={cn(
              "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-200",
              isAtOrBeforeCreatedAt(selectedDate) ? "opacity-30 cursor-not-allowed" : "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer active:scale-95"
            )}
            aria-label="Previous Day" title={isAtOrBeforeCreatedAt(selectedDate) ? "This is your first day on LeanIQA. No meal history exists before this date." : "Previous Day"}
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
          <span className="text-[15px] font-semibold text-white min-w-[85px] text-center tracking-tight">
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
              "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all duration-200",
              isToday(selectedDate) ? "opacity-30 cursor-not-allowed" : "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] cursor-pointer active:scale-95"
            )}
          >
            <ChevronRight size={18} className="text-white" />
          </button>
        </div>
      </div>

      {/* ── CALORIE RING SUMMARY ── */}
      <div className="mb-6 rounded-[24px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] p-5 shadow-sm backdrop-blur-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-5">
          <div className="text-[12px] font-semibold uppercase tracking-widest text-[rgba(235,235,245,0.5)]">Daily Summary</div>
          <div className="text-[13px] font-bold px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.05)]" style={{ color: eatenKcal > dailyTargetKcal ? '#FF4D1C' : '#D4FF00' }}>
            {eatenKcal > dailyTargetKcal ? `${eatenKcal - dailyTargetKcal} over` : `${dailyTargetKcal - eatenKcal} left`}
          </div>
        </div>

        {/* Calorie bar */}
        <div className="mb-4">
          <div className="flex justify-between mb-1.5 items-end">
            <span className="text-[13px] font-medium text-[rgba(235,235,245,0.5)]">Calories</span>
            <span className="text-[14px] font-bold text-white tracking-tight">{eatenKcal} <span className="text-[11px] font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">/ {dailyTargetKcal}</span></span>
          </div>
          <div className="h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden shadow-inner">
            <div className="h-full w-full rounded-full origin-left transition-transform duration-1000 ease-out will-change-transform" style={{ transform: `translateX(-${100 - caloriePercent}%)`, background: eatenKcal > dailyTargetKcal ? '#FF4D1C' : '#D4FF00' }}></div>
          </div>
        </div>

        {/* Protein bar */}
        <div>
          <div className="flex justify-between mb-1.5 items-end">
            <span className="text-[13px] font-medium text-[rgba(235,235,245,0.5)]">Protein</span>
            <span className="text-[14px] font-bold text-white tracking-tight">{eatenProtein}g <span className="text-[11px] font-medium text-[rgba(255,255,255,0.5)] uppercase tracking-wider">/ {proteinTarget}g</span></span>
          </div>
          <div className="h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden shadow-inner">
            <div className="h-full w-full rounded-full bg-[#378ADD] origin-left transition-transform duration-1000 ease-out will-change-transform" style={{ transform: `translateX(-${100 - proteinPercent}%)` }}></div>
          </div>
        </div>

        {/* Macros row */}
        <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          {[{ label: 'Kcal', val: eatenKcal, target: dailyTargetKcal, unit: '', color: '#FF4D1C' }, 
            { label: 'Protein', val: eatenProtein, target: proteinTarget, unit: 'g', color: '#378ADD' }, 
            { label: 'Fat', val: eatenFat, target: fatTarget, unit: 'g', color: 'white' }, 
            { label: 'Carbs', val: eatenCarbs, target: carbsTarget, unit: 'g', color: 'white' }].map(item => (
            <div key={item.label} className="text-center flex flex-col items-center">
              <div className="text-[16px] font-bold tracking-tight" style={{ color: item.color }}>
                {item.val}<span className="text-[12px]">{item.unit}</span>
              </div>
              <div className="text-[10px] text-[rgba(235,235,245,0.5)] uppercase tracking-widest mt-0.5 font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MEAL SLOT ROWS ── */}
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-widest text-[rgba(235,235,245,0.5)] mb-3 px-1">Meal Log</div>
        
        {meals.length === 0 && (
          <EmptyState
            icon={Lightbulb}
            title="No meals logged yet"
            description="Your daily meal log is empty. Tap the '+' button below to add your first meal."
            className="my-8 py-10"
          />
        )}

        <MealSlotRow slot="breakfast" icon={<Sunrise size={20} />} label="Breakfast" timeRange="6 am – 12 pm" meals={breakfastMeals} onDelete={handleDeleteMeal} />
        <MealSlotRow slot="lunch" icon={<Sun size={20} />} label="Lunch" timeRange="12 pm – 6 pm" meals={lunchMeals} onDelete={handleDeleteMeal} />
        <MealSlotRow slot="dinner" icon={<Moon size={20} />} label="Dinner" timeRange="6 pm – 10 pm" meals={dinnerMeals} onDelete={handleDeleteMeal} />
        <MealSlotRow slot="snack" icon={<Coffee size={20} />} label="Snack" timeRange="Anytime" meals={snackMeals} onDelete={handleDeleteMeal} />
      </div>
      {/* ── SPACER TO PREVENT FAB OVERLAP ── */}
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
                <button aria-label="Close modal" onClick={() => setModalOpen(false)} style={{ minWidth: '44px', minHeight: '44px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
                  <X size={16} />
                </button>
              </div>

              {/* Meal slot selector */}
              <div className="px-5 pt-3">
                <div className="bg-[rgba(255,255,255,0.02)] rounded-[24px] p-1.5 flex gap-1 relative">
                  {([['breakfast', Sunrise, 'Breakfast', '6 AM - 12 PM'], ['lunch', Sun, 'Lunch', '12 PM - 6 PM'], ['dinner', Moon, 'Dinner', '6 PM - 10 PM'], ['snack', Coffee, 'Snack', 'Anytime']] as const).map(([slot, Icon, label, time]) => {
                    const isActive = selectedMealSlot === slot;
                    return (
                      <div
                        key={slot}
                        onClick={() => setSelectedMealSlot(slot as any)}
                        className={cn(
                          "flex-1 flex flex-col items-center py-2.5 rounded-[24px] cursor-pointer transition-colors duration-200 relative z-10",
                          isActive ? "text-white font-medium" : "text-[rgba(255,255,255,0.4)] bg-transparent"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="slotActive"
                            className="absolute inset-0 bg-[rgba(255,255,255,0.1)] rounded-[24px] -z-10"
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
                  <div className="flex items-center gap-2 text-[13px] text-[rgba(235,235,245,0.5)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.25)]" />
                    <span>AI Offline — Using Database</span>
                  </div>
                )}
                {aiStatus === 'online' && (
                  <div className="flex items-center gap-2 text-[13px] text-[rgba(235,235,245,0.5)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_6px_#D4FF00] animate-pulse-glow" style={{ animation: 'pulseGlow 2s infinite ease-in-out' }} />
                    <style>{'@keyframes pulseGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }'}</style>
                    <span>Groq AI Active</span>
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
                            ? "bg-[rgba(212,255,0,0.12)] border-[0.5px] border-[rgba(212,255,0,0.2)] text-white rounded-[24px] rounded-tr-sm max-w-[85%] self-end" 
                            : "bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start"
                        )}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                        {msg.data && (
                          <div className="flex gap-[6px] flex-wrap mt-[8px]">
                            <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">~{msg.data.calories} kcal</span>
                            <span className="text-[10px] badge-lime px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{msg.data.protein}g pro</span>
                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{msg.data.fat}g fat</span>
                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{msg.data.carbs}g carb</span>
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
                  {loading && <LoadingStatusMessage />}
                  {pendingMeal && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start p-[12px_16px] text-[14px] leading-relaxed"
                    >
                      <div className="font-semibold text-white mb-2">Here is the estimated nutrition. Would you like to log this?</div>
                      <div className="flex gap-[6px] flex-wrap mb-[12px]">
                        <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">~{pendingMeal.data.calories} kcal</span>
                        <span className="text-[10px] badge-lime px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{pendingMeal.data.protein}g pro</span>
                        <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{pendingMeal.data.fat}g fat</span>
                        <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{pendingMeal.data.carbs}g carb</span>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => confirmMealMutation.mutate(pendingMeal)}
                          disabled={confirmMealMutation.isPending}
                          className="flex-1 bg-[#D4FF00] text-black font-bold py-2 rounded-[12px] text-[13px]"
                        >
                          {confirmMealMutation.isPending ? 'Logging...' : 'Confirm'}
                        </button>
                        <button 
                          onClick={() => setPendingMeal(null)}
                          disabled={confirmMealMutation.isPending}
                          className="flex-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 rounded-[12px] text-[13px] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                                    {failedMealError && !loading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[rgba(255,77,28,0.05)] border-[0.5px] border-[rgba(255,77,28,0.2)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start p-[12px_16px] text-[14px] leading-relaxed"
                    >
                      <div className="mb-3 text-[rgba(255,255,255,0.9)]">
                        <strong>Error:</strong> {failedMealError}
                      </div>
                      <button 
                        onClick={() => {
                          setFailedMealError(null);
                          setFailedMealText(null);
                          setRetryCount(0);
                        }}
                        className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 px-4 rounded-[12px] text-[13px] transition-colors w-full"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )}
                  {failedMealText && !loading && (
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
                              setFailedMealError(null);
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
                  )}
                </AnimatePresence>
              </div>


              {/* Input row */}
              <div className="glass-strong border-t border-[rgba(255,255,255,0.06)] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] flex flex-col gap-3">
                <div className="flex gap-3 items-center">

                <input aria-label="Meal description"
                  className="input-apple flex-1 text-[16px] placeholder:text-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.03)]"
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
                  disabled={!selectedMealSlot}
                />
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => handleSend()}
                  disabled={loading || !selectedMealSlot || !input.trim()}
                  className="w-[40px] h-[40px] rounded-full flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: loading || !selectedMealSlot || !input.trim() ? 'rgba(212,255,0,0.3)' : '#D4FF00' }}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin text-black" />
                  ) : (
                    <ArrowRight size={18} strokeWidth={2} color="#0A0A0A" />
                  )}
                </motion.button>
                </div>
                <button
                  onClick={() => { setModalOpen(false); setTimeout(() => setIsCustomMealModalOpen(true), 300); }}
                  className="flex items-center justify-center gap-1.5 text-[rgba(255,255,255,0.5)] hover:text-white text-[13px] font-medium transition-colors w-fit mx-auto pb-1"
                >
                  <Plus size={14} />
                  Create Custom Meal
                </button>
              </div>
            </motion.div>
          </motion.div>

        )}
        </AnimatePresence>,
        document.body
      )}
      
      <CustomMealModal
        isOpen={isCustomMealModalOpen}
        onClose={() => setIsCustomMealModalOpen(false)}
        onSave={handleCustomMealSave}
        defaultSlot={selectedMealSlot || undefined}
      />
    </>
  );

}
