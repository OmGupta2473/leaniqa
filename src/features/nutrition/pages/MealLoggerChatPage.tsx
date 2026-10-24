import React from 'react';
import { PerfProfiler } from '@/shared/utils/perfDebug';
import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { createPortal } from "react-dom";
import { AmbiguityIndicator } from '../components/AmbiguityIndicator';
import '../components/ambiguityIndicator.css';
import { useAppStore } from "@/app/store";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "@/app/store";
import { useNutritionStore } from "../store/nutritionStore";
import {
    Send, Loader2, Dumbbell, Lightbulb, Sun, Sunrise, Moon, Coffee, Plus, X, ChevronLeft, ChevronRight, ArrowRight, ChevronDown,
    Zap, AlertTriangle, Pencil, Lock
} from "lucide-react";
import { EmptyState } from '@/shared/components/EmptyState';
import { CustomMealModal } from '../components/CustomMealModal';
import { AiLimitNudge } from '../components/AiLimitNudge';
import { PreCommitEditModal } from '../components/PreCommitEditModal';
import { EditMealModal } from '../components/EditMealModal';
import { DbMealLog } from '@/shared/types/supabase';
import { cn } from "@/shared/utils/utils";
import { SmoothInput } from "@/shared/components/SmoothInput";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDailyNutrition } from "@/features/nutrition/hooks/useDailyNutrition";
import { onMealSaved } from "@/features/nutrition/utils/mealSync";
// import {
//     canonicalTotalsForSave,
//     removeUnresolvedComponent,
//     toMealBreakdownUiState,
//     type MealBreakdownUiState,
//     type MealInterpretationResponse,
// } from "@/features/nutrition/utils/mealInterpretationUi";
import {
    toAiMealUiState,
    type AiMealUiState,
    type AiMealResponse,
} from "@/features/nutrition/utils/mealInterpretationUi";
import { AiMealPreviewCard } from "../components/AiMealPreviewCard";
import { mealService } from "../services/mealService";
import { fetchTodayMessages, saveMessage } from '../services/chatService';
import { profileService } from "@/features/profile/services/profileService";
import { complianceService } from "@/features/reports/services/complianceService";
import { supabase } from "@/shared/utils/supabase";
import { authService } from "@/features/auth/services/authService";
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { useVisualViewport, useKeyboardOpen } from "@/shared/hooks/useVisualViewport";
import { lookupCachedMeal } from '../constants/data';
import { haptics } from '@/shared/utils/haptics';
import { useCalculatedProfile } from '@/shared/hooks/useCalculatedProfile';
import { analytics } from '@/shared/utils/analytics';
import { useNetworkConnectivity } from '@/shared/hooks/useNetworkConnectivity';
import { MealLoggerSkeleton } from '@/shared/components/Skeletons';
import { useToast } from '@/shared/components/Toast';
import { useAiCredits } from '@/features/nutrition/hooks/useAiCredits';
import { devLog } from '@/shared/utils/logger';
import { LogCalendar } from '../components/LogCalendar';
import { reportService } from '@/features/reports/services/reportService';
import { classifyDay, type GoalType, type MetricStatus } from '@/shared/utils/dayStatus';
import { parseDateKey } from '@/shared/utils/dateKey';
import { ProtectProgressSheet, shouldShowProtectProgress, PROTECT_PROGRESS_MEAL_THRESHOLD } from '@/features/auth/components/ProtectProgressSheet';
import { useAuthSession } from '@/router/useAuthSession';
import { getKolkataDateString, getKolkataHour, shiftKolkataDateString, kolkataDateStringToUtcMidnight, msSinceKolkataMidnight } from '@/shared/utils/timezone';
import { useEntitlements } from '@/features/pricing/hooks/useEntitlements';

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
function MealSlotRow({ slot, icon, label, timeRange, meals, onDelete, onEdit }: { slot: string; icon: React.ReactNode; label: string; timeRange: string; meals: any[], onDelete: (id: string) => void; onEdit: (meal: any) => void }) {
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
                                        <button
                                            type="button"
                                            onClick={() => onEdit(m)}
                                            aria-label="Edit meal"
                                            className="flex-1 min-w-0 pr-1 flex flex-col justify-center items-start gap-1 text-left cursor-pointer"
                                        >
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
                                        </button>
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

// ── LOCKED DAY VIEW ────────────────────────────────────────────────────────
function LockedHistoryView({ plan }: { plan: 'free' | 'discipline' | 'premium' }) {
    const navigate = useNavigate();
    const targetPlan = plan === 'discipline' ? 'Premium' : 'Discipline';
    const limitText = plan === 'discipline' ? '180' : '14';

    return (
        <div className="relative mt-2">
            {/* Ghost content behind the lock — blurred mock of what would be here */}
            <div
                aria-hidden="true"
                className="absolute inset-0 blur-[10px] opacity-25 pointer-events-none select-none px-5 space-y-4"
            >
                <div className="rounded-[24px] bg-[rgba(255,255,255,0.06)] h-[220px]" />
                <div className="rounded-[24px] bg-[rgba(255,255,255,0.05)] h-[96px]" />
                <div className="rounded-[24px] bg-[rgba(255,255,255,0.05)] h-[96px]" />
                <div className="rounded-[24px] bg-[rgba(255,255,255,0.05)] h-[96px]" />
            </div>

            {/* Lock overlay */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24">
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, rgba(212,255,0,0.18), rgba(212,255,0,0.04))',
                        border: '1px solid rgba(212,255,0,0.30)',
                        boxShadow: '0 0 48px rgba(212,255,0,0.15)',
                    }}
                >
                    <Lock size={32} className="text-[#D4FF00]" strokeWidth={2.2} />
                </div>

                <h3 className="text-[22px] font-semibold text-white tracking-tight mb-3">
                    This day is locked
                </h3>

                <p className="text-[14px] text-zinc-400 leading-relaxed max-w-[280px] mb-8">
                    Your detailed history beyond {limitText} days is available with {targetPlan}.
                </p>

                <button
                    type="button"
                    onClick={() => navigate('/pricing')}
                    className="bg-[#D4FF00] text-black px-8 py-3.5 rounded-full font-semibold text-[15px] active:scale-95 transition-transform min-h-[48px] shadow-[0_0_30px_rgba(212,255,0,0.25)]"
                >
                    Get {targetPlan}
                </button>
            </div>
        </div>
    );
}

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

export function MealLoggerChatPage() {
    const navigate = useNavigate();

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
    const { toast } = useToast();
    const { credits, refetch: refetchCredits } = useAiCredits();
    const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileService.getProfile() });
    const keyboardOffset = useVisualViewport();
    const isKeyboardOpen = useKeyboardOpen();
    const isSubmittingRef = React.useRef(false);

    useEffect(() => {
        if (profile?.id) {
            initializeSession(profile.id);
        }
    }, [profile?.id, initializeSession]);

    useEffect(() => {
        let cancelled = false;
        if (!profile?.id) return;
        (async () => {
            try {
                const messages = await fetchTodayMessages(profile.id);
                if (cancelled) return;
                useChatStore.setState({ chatHistory: messages });
            } catch (err) {
                console.error('Failed to load chat history', err);
            }
        })();
        return () => { cancelled = true; };
    }, [profile?.id]);

    type PendingMeal = {
        text: string;
        data: any;
        request_id?: string;
        source?: string;
        creditsConsumed?: boolean;
        lowConfidence?: boolean;
        was_ambiguous?: boolean;
        structured?: AiMealUiState;
    };
    const [selectedDateStr, setSelectedDateStr] = useState<string>(() => getKolkataDateString());
    // Phase 6.7 R2.8 — resolve-meal-v2 endpoint gate.
    // Vite bakes VITE_* env vars at build time, so this is a compile-time
    // constant. Default false: parse-meal remains the default path unless
    // the environment explicitly opts in.
    const USE_V2_RESOLVER = import.meta.env.VITE_RESOLVE_V2_ENABLED === 'true';
    const RESOLVE_MEAL_ENDPOINT = 'resolve-meal-v2';

    // type ResolverV2Result = MealInterpretationResponse & {
    //     items: Array<{
    //         food_id: number | null;
    //         canonical_name: string;
    //         grams: number;
    //         kcal: number;
    //         protein: number;
    //         fat: number;
    //         carbs: number;
    //         fiber: number;
    //         unit: string | null;
    //         quantity: number;
    //     }>;
    //     meal_confidence: number;
    //     needs_confirmation: boolean;
    //     layers_used: string[];
    //     source?: string;
    //     request_id?: string;
    //     was_ambiguous?: boolean;
    //     kb_confidence?: number;
    //     ai_used?: boolean;
    //     best_value_to_log?: unknown;
    // };

    function aiResponseToPendingData(resp: AiMealResponse): Record<string, unknown> {
        return {
            // Legacy fields the confirm/PreCommitEditMutation pipeline reads:
            calories: resp.totals.calories,
            protein: resp.totals.protein,
            fat: resp.totals.fat,
            carbs: resp.totals.carbs,
            fiber: resp.totals.fiber,
            _canonicalTotals: true,
            // New fields for the AI card (informational):
            meal_title: resp.meal_title,
            meal_style: resp.meal_style,
            assumptions: resp.assumptions,
            items: resp.items,
            confidence: resp.confidence,
            needs_review: resp.needs_review,
            clarifying_questions: resp.clarifying_questions,
            request_id: resp.request_id,
            source: resp.source,
        };
    }
    const [pendingMeal, setPendingMeal] = useState<
        (PendingMeal & { was_ambiguous?: boolean }) | null
    >(null);
    const [failedMealText, setFailedMealText] = useState<string | null>(null);
    const [failedMealError, setFailedMealError] = useState<string | null>(null);
    const [isCustomMealModalOpen, setIsCustomMealModalOpen] = useState(false);
    const [retryCount, setRetryCount] = useState<number>(0);
    const [editingMeal, setEditingMeal] = useState<(DbMealLog & { id: string }) | null>(null);
    const [editingPending, setEditingPending] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [protectOpen, setProtectOpen] = useState(false);

    const { session } = useAuthSession();
    const isGuest = session?.user?.is_anonymous === true;

    const refundParseCredit = useCallback(async (pm: PendingMeal | null) => {
        if (!pm || pm.source !== 'llm' || !pm.request_id) {
            console.log('[credits] refund skipped', {
                reason: !pm ? 'no pm' : pm.source !== 'llm' ? 'not llm' : 'no request_id',
                pm,
            });
            return;
        }
        try {
            const userId = await authService.getUserId();
            const p_date = getKolkataDateString();
            console.log('[credits] refund calling', {
                request_id: pm.request_id,
                p_user_id: userId,
                p_date,
            });
            const { data, error } = await supabase.rpc('refund_api_usage', {
                p_user_id: userId,
                p_endpoint: 'parse-meal',
                p_date,
                p_request_id: pm.request_id,
            });
            if (error) {
                console.error('[credits] refund FAILED', {
                    request_id: pm.request_id,
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                });
                return;
            }
            console.log('[credits] refund succeeded', {
                request_id: pm.request_id,
                result: data,
            });
            toast({ type: 'success', message: 'Credit refunded', duration: 2000 });
        } catch (thrown) {
            console.error('[credits] refund threw', {
                request_id: pm.request_id,
                error: thrown instanceof Error ? thrown.message : String(thrown),
            });
        }
    }, [toast]);

    // Deterministic ordering: close the card first (blocks double-tap), then let
    // the refund RPC fully commit, then read the true post-refund count.
    const handleCancelPendingMeal = useCallback(async () => {
        const pm = pendingMeal;
        if (!pm) return;
        setPendingMeal(null);
        await refundParseCredit(pm);
        await refetchCredits();
    }, [pendingMeal, refundParseCredit, refetchCredits]);

    const isToday = (dateStr: string) => dateStr === getKolkataDateString();
    const isYesterday = (dateStr: string) =>
        dateStr === shiftKolkataDateString(getKolkataDateString(), -1);
    // The previous-day arrow is disabled once we reach the lock floor.
    // For premium (lockFloorDate === null) it falls back to the data floor.
    const isAtOrBeforeFloor = (dateStr: string) =>
        lockFloorDate != null ? dateStr <= lockFloorDate : dateStr <= floorDate;


    const formatDateLabel = (dateStr: string) => {
        if (isToday(dateStr)) return "Today";
        if (isYesterday(dateStr)) return "Yesterday";
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    };

    const dateKeyStr = selectedDateStr;

    const getMealTime = (): Date => {
        const now = new Date();
        if (selectedDateStr === getKolkataDateString(now)) return now;
        const offsetMs = msSinceKolkataMidnight(now);
        const selectedMidnightUtc = kolkataDateStringToUtcMidnight(selectedDateStr);
        return new Date(selectedMidnightUtc.getTime() + offsetMs);
    };

    const selectedMealSlot = useNutritionStore(s => s.selectedMealSlot);
    const setSelectedMealSlot = useNutritionStore(s => s.setSelectedMealSlot);

    useEffect(() => {
        clearOldChats();
        const hour = getKolkataHour();
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

    const { data: firstMealDate } = useQuery({
        queryKey: ['firstMealDate'],
        queryFn: () => mealService.getFirstMealDate(),
    });

    const { data: dailyMetrics = [] } = useQuery({
        queryKey: ['dailyMetrics'],
        queryFn: () => reportService.getDailyMetrics(),
    });

    const todayStr = getKolkataDateString();

    const { entitlements, plan } = useEntitlements();

    const baseFloorDate = firstMealDate
        ?? (profile?.created_at
            ? getKolkataDateString(new Date(profile.created_at))
            : todayStr);

    // The earliest day with full detail allowed for this plan.
    // null for premium (unlimited).
    const entitlementFloorDate =
        entitlements.historyDays == null
            ? null
            : shiftKolkataDateString(todayStr, -(entitlements.historyDays - 1));

    // The earliest day the user can navigate to. It is one day BEFORE the
    // entitlement floor, so they can land on the first locked day and see
    // the lock overlay — but not go any further back.
    const lockFloorDate = entitlementFloorDate
        ? shiftKolkataDateString(entitlementFloorDate, -1)
        : null;

    // Effective floor for the calendar: the later of the two.
    const floorDate =
        entitlementFloorDate && entitlementFloorDate > baseFloorDate
            ? entitlementFloorDate
            : baseFloorDate;

    // True when the currently selected day is past the plan's full-detail window.
    const isLockedDay =
        entitlementFloorDate != null &&
        selectedDateStr < entitlementFloorDate &&
        selectedDateStr >= (lockFloorDate ?? entitlementFloorDate);

    const goalType: GoalType = (goal?.goal_type ?? 'cut') as GoalType;

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
    } = useDailyNutrition(selectedDateStr);

    const isViewingToday = selectedDateStr === todayStr;

    const todayStatus: MetricStatus | null =
        isViewingToday && dailyTargetKcal > 0
            ? classifyDay(goalType, {
                actual_calories: eatenKcal,
                target_calories: dailyTargetKcal,
                actual_protein: eatenProtein,
                target_protein: proteinTarget,
            })
            : null;

    const breakfastMeals = meals.filter(m => m.meal_slot?.toLowerCase() === "breakfast");
    const lunchMeals = meals.filter(m => m.meal_slot?.toLowerCase() === "lunch");
    const dinnerMeals = meals.filter(m => m.meal_slot?.toLowerCase() === "dinner");
    const snackMeals = meals.filter(m => {
        const s = m.meal_slot?.toLowerCase();
        return !s || s === "snack" || s === "snacks" || !["breakfast", "lunch", "dinner"].includes(s);
    });

    const caloriePercent = Math.min(100, calPct * 100);
    const proteinPercent = Math.min(100, proPct * 100);

    const chatRef = useRef<HTMLDivElement>(null);
    const chat = chatHistory.length > 0 ? chatHistory : [{ role: "ai" as const, text: "What did you eat? I'll calculate the macros and give you coaching advice." }];

    useEffect(() => {
        if (!chatRef.current) return;

        chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [chat, loading, pendingMeal, failedMealError, failedMealText]);

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
            await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });

            const previousMeals = queryClient.getQueryData<any[]>(["meals", "date", dateKeyStr]);

            const newMeals = previousMeals ? previousMeals.filter((m: any) => m.id !== id) : [];
            queryClient.setQueryData(["meals", "date", dateKeyStr], newMeals);

            devLog('Remaining Meals:', newMeals.length);
            const newKcal = newMeals.reduce((s, m) => s + m.calories, 0);
            const newPro = newMeals.reduce((s, m) => s + m.protein, 0);
            devLog('Recalculated Daily Totals:', { calories: newKcal, protein: newPro });

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
            onMealSaved(dateKeyStr).then(() => {
                devLog('Updated Dashboard & Progress Rings');
                devLog('Updated History & Reports');
                console.groupEnd();
            });
        }
    });


    const updateMealMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Parameters<typeof mealService.updateMeal>[1] }) => {
            if (typeof window !== 'undefined' && !navigator.onLine) {
                // v1: edits require network. Show a toast and abort.
                throw new Error('Editing requires an internet connection.');
            }
            await mealService.updateMeal(id, updates);
            return { id, updates };
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['meals', 'date', dateKeyStr] });
            const previousMeals = queryClient.getQueryData<any[]>(['meals', 'date', dateKeyStr]);
            if (previousMeals) {
                queryClient.setQueryData(
                    ['meals', 'date', dateKeyStr],
                    previousMeals.map((m) => m.id === id ? { ...m, ...updates } : m),
                );
            }
            return { previousMeals };
        },
        onError: (_err, _vars, context) => {
            if (context?.previousMeals) {
                queryClient.setQueryData(['meals', 'date', dateKeyStr], context.previousMeals);
            }
        },
        onSuccess: () => {
            haptics.success();
            setEditingMeal(null);
        },
        onSettled: () => {
            onMealSaved(dateKeyStr);
        },
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
            source: 'manual',
            client_token: crypto.randomUUID(),
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
                {
                    try {
                        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                        let currentSession = session;
                        if (sessionError || !session?.access_token) {
                            const { data: refreshData } = await supabase.auth.refreshSession();
                            currentSession = refreshData.session;
                        }

                        if (!currentSession?.access_token) throw new Error('Authentication failure');

                        const edgeStart = Date.now();
                        const { data: responseBody, error: functionError } = await supabase.functions.invoke('parse-meal', {
                            body: {
                                text,
                                remainingCalories,
                                remainingProtein,
                                mealType: selectedMealSlot,
                                userGoal: onboardingData?.goal,
                                dietaryPreference: profile?.dietary_preference ?? 'unspecified'
                            }
                        });

                        aiResponseDuration = Date.now() - edgeStart;

                        let data = responseBody;

                        if (functionError) {
                            let msg = functionError.message || 'Server error';
                            let errorMeta: { _refunded?: boolean; request_id?: string; error_code?: string } = {};

                            if (functionError.context && typeof functionError.context.json === 'function') {
                                try {
                                    const errorBody = await functionError.context.json();
                                    if (errorBody && errorBody.error) {
                                        msg = errorBody.error;
                                    }
                                    if (errorBody) {
                                        errorMeta = {
                                            _refunded: errorBody._refunded === true,
                                            request_id: errorBody.request_id,
                                            error_code: errorBody.error_code,
                                        };
                                    }
                                } catch (e) { }
                            }

                            if (msg.includes('Auth') || msg.includes('Authentication') || msg.includes('JWT') || functionError.message?.includes('Auth')) {
                                throw new Error('Authentication failure');
                            }
                            if (msg.includes('429') || msg.includes('limit reached')) throw new Error('Daily AI limit reached');
                            if (msg.includes('504') || msg.includes('timeout')) {
                                throw new Error('AI took too long to respond');
                            }

                            if (msg.includes('Failed to parse Groq JSON:')) {
                                try {
                                    const jsonStrMatch = msg.match(/\{[\s\S]*\}/);
                                    if (jsonStrMatch) {
                                        let jsonStr = jsonStrMatch[0];
                                        jsonStr = jsonStr.replace(/([0-9.]+)\s*\*\s*([0-9.]+)/g, (match, p1, p2) => String(parseFloat(p1) * parseFloat(p2)));
                                        data = JSON.parse(jsonStr);
                                        msg = ''; // Clear error to proceed
                                    }
                                } catch (fallbackErr) {
                                    console.error('Fallback parse failed', fallbackErr);
                                }
                            }

                            if (msg) {
                                const err = new Error(msg.includes('Friendly Retry') ? msg : `AI Service Error: ${msg}`);
                                (err as any)._refunded = errorMeta._refunded === true;
                                (err as any).request_id = errorMeta.request_id;
                                (err as any).error_code = errorMeta.error_code;
                                throw err;
                            }
                        }

                        if (data) {
                            data._latency = aiResponseDuration;
                        }

                        if (!data || typeof data.calories !== 'number') {
                            if (import.meta.env.DEV) {
                                console.error('[MealLogger] Parsing Error - Invalid AI response data:', data);
                            }
                            lastError = new Error('AI returned invalid data');
                            throw new Error('AI returned invalid data');
                        }

                        return data;
                    } catch (err: any) {
                        // err may carry _refunded/request_id/error_code attached in the
                        // functionError branch above — keep the object, don't rewrap it.
                        lastError = err as Error;
                    }
                }
            }

            const errorContext = (() => {
                const msg = lastError?.message ?? '';
                return msg || 'AI temporarily unavailable';
            })();

            return {
                _errorMessage: errorContext,
                text,
                _refunded: (lastError as any)?._refunded === true,
                request_id: (lastError as any)?.request_id,
            };
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
                refetchCredits();
                if (data._refunded) {
                    toast({
                        type: 'info',
                        message: 'No credit used — parse failed',
                        duration: 3000,
                    });
                }
                if (typeof data._errorMessage === 'string' && data._errorMessage.includes('Daily AI limit reached')) {
                    toast({
                        type: 'warning',
                        message: 'Daily AI parses used up. Resets at midnight IST.',
                        duration: 5000,
                    });
                }
            } else {
                setRetryCount(0);
                analytics.trackEvent('Meal Parse Analytics', eventData);
                analytics.trackEvent('AI Parse Success', {
                    confidence: data.confidence,
                    calories: data.calories,
                    low_confidence: typeof data.confidence === 'number' && data.confidence < 80,
                });

                const source = data.source as string | undefined;
                const isHighConfidence = source === 'kb' || source === 'memory_cache' || source === 'db_cache';

                if (isHighConfidence) {
                    // Verified values from KB or cache — auto-log without a tap.
                    analytics.trackEvent('Meal Logged', { auto: true, source, calories: data.calories });
                    toast({
                        type: 'success',
                        message: `Logged ✓ ${Math.round(data.calories)} kcal · ${Math.round(data.protein)}g pro`,
                        duration: 3000,
                    });
                    confirmMealMutation.mutate({
                        text,
                        data,
                        source: 'ai',
                        client_token: crypto.randomUUID(),
                    });
                    refetchCredits();
                } else {
                    // LLM estimate — show the card so the user can Edit/Confirm/Cancel.
                    setPendingMeal({
                        text,
                        data,
                        request_id: data.request_id,
                        source: data.source,
                        creditsConsumed: data.source === 'llm',
                        lowConfidence: typeof data.confidence === 'number' && data.confidence < 80,
                    });
                    refetchCredits();
                }
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
            refetchCredits();
        }
    });

    // Phase 6.7 R2.8 — resolve-meal-v2 mutation.
    // Calls the KB-primary backend first when USE_V2_RESOLVER is on.
    // Fall-through to parseMealMutation on (a) partial resolution, or
    // (b) transport/auth error. Terminal path (full resolution) sets
    // pendingMeal directly and does not consume credits.
    const resolveMealV2Mutation = useMutation({
        mutationFn: async (text: string): Promise<AiMealResponse> => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            let currentSession = session;
            if (sessionError || !session?.access_token) {
                const { data: refreshData } = await supabase.auth.refreshSession();
                currentSession = refreshData.session;
            }
            if (!currentSession?.access_token) throw new Error("Authentication failure");

            const { data, error } = await supabase.functions.invoke(RESOLVE_MEAL_ENDPOINT, {
                body: { text, mealType: selectedMealSlot ?? "unspecified" },
            });

            if (error) {
                let msg = error.message || "Resolver error";
                const ctx = (error as { context?: Response }).context;
                if (ctx && typeof ctx.json === "function") {
                    try {
                        const errorBody = await ctx.json();
                        if (errorBody?.error) msg = errorBody.error;
                    } catch {
                        /* ignore */
                    }
                }
                throw new Error(msg);
            }

            if (!data || typeof data !== "object" || !Array.isArray((data as { items?: unknown }).items)) {
                throw new Error("The AI returned an incomplete estimate. Please try again.");
            }

            return data as AiMealResponse;
        },
        onSuccess: (data, text) => {
            isSubmittingRef.current = false;
            setLoading(false);

            if (!data.items || data.items.length === 0) {
                setFailedMealError(
                    "The AI could not parse this meal. Try adding quantity or prep details.",
                );
                setFailedMealText(text);
                return;
            }

            const uiState = toAiMealUiState(data);

            setPendingMeal({
                text,
                data: aiResponseToPendingData(data),
                request_id: data.request_id,
                source: "ai",
                creditsConsumed: true,
                lowConfidence: data.confidence < 80,
                was_ambiguous: false,
                structured: uiState,
            });

            refetchCredits();
        },
        onError: (err: unknown, text: string) => {
            isSubmittingRef.current = false;
            setLoading(false);

            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Unable to analyze this meal. Please try again.";

            console.error("[resolveMealV2Mutation] failed:", err);

            analytics.trackEvent("AI Parse Failure", {
                error: errorMessage,
                type: "resolver_v2_mutation_error",
            });

            setFailedMealError(errorMessage);
            setFailedMealText(text);

            void refetchCredits();
        },
    });

    const confirmMealMutation = useMutation({
        mutationFn: async ({ text, data, source, client_token }: { text: string, data: any, source?: 'manual' | 'ai', client_token: string }) => {
            const preserveCanonicalTotals = data._canonicalTotals === true;
            let finalSlot = data.meal_slot || selectedMealSlot || 'dinner'; // 👈 Fallback to 'dinner'
            if (typeof finalSlot === 'string') {
                finalSlot = finalSlot.toLowerCase();
                if (finalSlot === 'snacks') finalSlot = 'snack';
            }

            const mealData = {
                meal_text: text,
                calories: preserveCanonicalTotals ? data.calories : Math.round(data.calories),
                protein: preserveCanonicalTotals ? data.protein : Math.round(data.protein),
                fat: preserveCanonicalTotals ? data.fat : Math.round(data.fat),
                carbs: preserveCanonicalTotals ? data.carbs : Math.round(data.carbs),
                fiber: data.fiber == null ? undefined : (preserveCanonicalTotals ? data.fiber : Math.round(data.fiber)),
                meal_time: getMealTime().toISOString(),
                tip: data.tip || data.foods_detected?.join(', ') || text,
                meal_slot: finalSlot,
                client_token
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
            await queryClient.cancelQueries({ queryKey: ["meals", "date", dateKeyStr] });

            const previousMeals = queryClient.getQueryData<any[]>(["meals", "date", dateKeyStr]);

            let finalSlot = data.meal_slot || selectedMealSlot || 'dinner'; // 👈 Fallback to 'dinner'
            if (typeof finalSlot === 'string') {
                finalSlot = finalSlot.toLowerCase();
                if (finalSlot === 'snacks') finalSlot = 'snack';
            }

            const preserveCanonicalTotals = data._canonicalTotals === true;
            const newMealObj = {
                id: 'temp-' + Date.now(),
                meal_text: text,
                calories: preserveCanonicalTotals ? data.calories : Math.round(data.calories),
                protein: preserveCanonicalTotals ? data.protein : Math.round(data.protein),
                fat: preserveCanonicalTotals ? data.fat : Math.round(data.fat),
                carbs: preserveCanonicalTotals ? data.carbs : Math.round(data.carbs),
                fiber: data.fiber == null ? undefined : (preserveCanonicalTotals ? data.fiber : Math.round(data.fiber)),
                meal_slot: finalSlot,
                meal_source: source || 'ai',
                _localOnly: true
            };

            if (previousMeals) {
                queryClient.setQueryData(["meals", "date", dateKeyStr], [...previousMeals, newMealObj]);
            }
            return { previousMeals, dateKeyStr };
        },
        onSuccess: ({ text, data, source }) => {
            setPendingMeal(null);
            haptics.success();
            haptics.success();

            if (source === 'manual') {
                analytics.trackEvent('Custom Meal Logged', { calories: data.calories } as any);
                setIsCustomMealModalOpen(false);
                addChatMessage({ role: 'ai', text: `✓ Logged Custom Meal: ${text}` });
                if (profile?.id) {
                    void saveMessage(profile.id, { role: 'ai', text: `✓ Logged Custom Meal: ${text}` }).catch((err) =>
                        console.error('Failed to persist chat message', err));
                }
            } else {
                const foodsDetected = Array.isArray(data?.foods_detected) && data?.foods_detected.length > 0 ? data.foods_detected.join(', ') : text;
                let responseText = `✓ Logged: ${foodsDetected}`;
                if (data?._fromCache) {
                    responseText = `✓ Logged: ${foodsDetected}`;
                }
                addChatMessage({ role: 'ai', text: responseText, data });
                if (profile?.id) {
                    void saveMessage(profile.id, { role: 'ai', text: responseText, data }).catch((err) =>
                        console.error('Failed to persist chat message', err));
                }

                // Removed automatic modal close to allow continuous meal logging
                // setTimeout(() => {
                //   setModalOpen(false);
                // }, 800);

                // Show protect progress sheet for guest users after 3 meals in a day
                if (isGuest && shouldShowProtectProgress()) {
                    const todayKey = new Date().toDateString();
                    const todayCount = meals.filter(
                        (m) => new Date(m.meal_time).toDateString() === todayKey,
                    ).length;
                    if (todayCount >= PROTECT_PROGRESS_MEAL_THRESHOLD) {
                        window.setTimeout(() => setProtectOpen(true), 800);
                    }
                }
            }
        },
        onError: (err: any, variables: any, context: any) => {
            console.error('[confirmMealMutation] onError:', err);
            addChatMessage({ role: 'ai', text: `⚠️ Failed to save meal. Please try again.` });
            if (profile?.id) {
                void saveMessage(profile.id, { role: 'ai', text: `⚠️ Failed to save meal. Please try again.` }).catch((err) =>
                    console.error('Failed to persist chat message', err));
            }

            if (context?.dateKeyStr && context?.previousMeals) {
                queryClient.setQueryData(["meals", "date", context.dateKeyStr], context.previousMeals);
            }
        },
        onSettled: () => {
            onMealSaved(dateKeyStr);
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
        if (profile?.id) {
            void saveMessage(profile.id, { role: 'user', text }).catch((err) =>
                console.error('Failed to persist chat message', err));
        }
        setLoading(true);
        if (USE_V2_RESOLVER) {
            resolveMealV2Mutation.mutate(text);
        } else {
            parseMealMutation.mutate(text);
        }
    }, [input, loading, selectedMealSlot, addChatMessage, parseMealMutation, resolveMealV2Mutation]);

    // if (isLoading) {
    //     if (!isOnline) {
    //         return (
    //             <div className="min-h-screen bg-[#0A0A0A] pb-[100px] flex flex-col items-center justify-center px-6 text-center">
    //                 <AlertTriangle className="w-12 h-12 text-[rgba(255,255,255,0.2)] mb-4" />
    //                 <h2 className="text-[18px] font-semibold text-white mb-2">You're offline</h2>
    //                 <p className="text-[14px] text-[rgba(255,255,255,0.6)]">
    //                     Connect to the internet to load your meals for the first time.
    //                 </p>
    //             </div>
    //         );
    //     }
    //     return <MealLoggerSkeleton />;
    // }

    return (
        <MotionConfig reducedMotion="user">
            <div className="flex flex-col h-[100dvh] bg-[#0A0A0A] w-full overflow-hidden">

                {/* Page Header */}
                <div className="shrink-0 px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                            <ChevronLeft size={20} className="text-white" />
                        </button>
                        <div>
                            <h1 className="text-[20px] font-bold text-white leading-tight">Log a meal</h1>
                            <p className="text-[12px] text-zinc-500">Tell me what you ate. I'll handle the nutrition.</p>
                        </div>
                    </div>
                </div>

                {/* Meal Slot Selector */}
                <div className="shrink-0 px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="max-w-[800px] mx-auto bg-[rgba(255,255,255,0.02)] rounded-[24px] p-1.5 flex gap-1 relative">
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
                                        <motion.div layoutId="slotActive" className="absolute inset-0 bg-[rgba(255,255,255,0.1)] rounded-[24px] -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                                    )}
                                    <Icon size={14} className="mb-1" />
                                    <div className="text-[13px]">{label}</div>
                                    <div className="text-[9px] text-[rgba(255,255,255,0.32)] font-normal">{time}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Conversation / Meal Results Area */}
                <div ref={chatRef} className="flex-1 overflow-y-auto px-5 py-4 max-w-[800px] mx-auto w-full flex flex-col gap-4">
                    <AnimatePresence>
                        {chat.map((msg, i) => {
                            const isUser = msg.role === "user";
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                    className={cn(
                                        "p-[16px_20px] text-[15px] leading-relaxed relative",
                                        isUser
                                            ? "bg-[rgba(212,255,0,0.12)] border-[0.5px] border-[rgba(212,255,0,0.2)] text-white rounded-[24px] rounded-tr-sm max-w-[85%] self-end"
                                            : "bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start w-full"
                                    )}
                                >
                                    <div className="whitespace-pre-wrap">{msg.text}</div>

                                    {/* If the message is a confirmed meal, show the pills */}
                                    {msg.data && !msg.data.structured && (
                                        <div className="flex gap-[6px] flex-wrap mt-[12px]">
                                            <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">~{msg.data.calories} kcal</span>
                                            <span className="text-[10px] badge-lime px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{msg.data.protein}g pro</span>
                                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{msg.data.fat}g fat</span>
                                            <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{msg.data.carbs}g carb</span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}

                        {loading && <LoadingStatusMessage />}

                        {/* ... PASTE THE ENTIRE `pendingMeal && !loading` BLOCK FROM MealLoggerPage.tsx HERE ... */}
                        {pendingMeal && !loading && (
                            pendingMeal.structured ? (
                                <AiMealPreviewCard
                                    state={pendingMeal.structured}
                                    creditsConsumed={pendingMeal.creditsConsumed ?? false}
                                    isPending={confirmMealMutation.isPending}
                                    onConfirm={() => {
                                        confirmMealMutation.mutate({
                                            text: pendingMeal.text,
                                            data: {
                                                ...pendingMeal.data,
                                                calories: pendingMeal.structured!.totals.calories,
                                                protein: pendingMeal.structured!.totals.protein,
                                                fat: pendingMeal.structured!.totals.fat,
                                                carbs: pendingMeal.structured!.totals.carbs,
                                                fiber: pendingMeal.structured!.totals.fiber,
                                                _canonicalTotals: true,
                                            },
                                            source: "ai",
                                            client_token: crypto.randomUUID(),
                                        });
                                    }}
                                    onEdit={() => setEditingPending(true)}
                                    onCancel={handleCancelPendingMeal}
                                />
                            ) : (
                                /* legacy non-structured card — unchanged, keep byte-identical */
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[rgba(255,255,255,0.02)] border-[0.5px] border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.85)] rounded-[24px] rounded-tl-sm max-w-[90%] self-start p-[12px_16px] text-[14px] leading-relaxed"
                                >
                                    <div className="font-semibold text-white mb-2">
                                        Here is the estimated nutrition. Would you like to log this?
                                    </div>
                                    {pendingMeal.lowConfidence && !pendingMeal.was_ambiguous && (
                                        <div className="mb-3 flex items-start gap-2 rounded-xl border border-[rgba(255,179,71,0.25)] bg-[rgba(255,179,71,0.08)] p-2.5 text-[12px] leading-relaxed text-[#FFB347]">
                                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                            <span>Low confidence — please review the values before logging.</span>
                                        </div>
                                    )}
                                    <div className="flex gap-[6px] flex-wrap mb-[12px]">
                                        <span className="text-[10px] bg-[rgba(255,77,28,0.12)] text-[#FF4D1C] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">~{pendingMeal.data.calories} kcal</span>
                                        <span className="text-[10px] badge-lime px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{pendingMeal.data.protein}g pro</span>
                                        <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{pendingMeal.data.fat}g fat</span>
                                        <span className="text-[10px] bg-[rgba(255,255,255,0.1)] text-[rgba(235,235,245,0.6)] px-2 py-0.5 rounded-full font-semibold">{pendingMeal.data.carbs}g carb</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() =>
                                                confirmMealMutation.mutate({
                                                    ...pendingMeal,
                                                    source: "ai",
                                                    client_token: crypto.randomUUID(),
                                                })
                                            }
                                            disabled={confirmMealMutation.isPending}
                                            className="flex-1 bg-[#D4FF00] text-black font-bold py-2 rounded-[12px] text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {confirmMealMutation.isPending ? "Logging..." : "Confirm"}
                                        </button>
                                        <button
                                            onClick={handleCancelPendingMeal}
                                            disabled={confirmMealMutation.isPending}
                                            className="flex-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 rounded-[12px] text-[13px] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        )}
                        {/* ... PASTE THE ENTIRE `failedMealError` BLOCK HERE ... */}
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
                                        const text = failedMealText;
                                        if (!text || loading) return;

                                        setFailedMealError(null);
                                        setFailedMealText(null);
                                        setRetryCount(prev => prev + 1);
                                        setLoading(true);
                                        isSubmittingRef.current = true;

                                        if (USE_V2_RESOLVER) {
                                            resolveMealV2Mutation.mutate(text);
                                        } else {
                                            parseMealMutation.mutate(text);
                                        }
                                    }}
                                    className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 px-4 rounded-[12px] text-[13px] transition-colors w-full"
                                >
                                    Dismiss
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Persistent Meal Input Composer */}
                <div className="shrink-0 bg-[#0A0A0A] border-t border-[rgba(255,255,255,0.06)] p-4 pb-8">
                    <div className="max-w-[800px] mx-auto flex flex-col gap-3">
                        <div className="flex gap-3 items-center">
                            <input
                                className="input-apple flex-1 text-[16px] placeholder:text-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.03)]"
                                style={{ borderRadius: '14px', border: '0.5px solid rgba(255,255,255,0.15)', padding: '14px 18px' }}
                                type="text"
                                placeholder={selectedMealSlot ? "e.g. 2 boiled eggs and chai" : "Select breakfast / lunch / dinner"}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                disabled={!selectedMealSlot}
                            />
                            <motion.button
                                whileTap={{ scale: 0.92 }}
                                onClick={() => handleSend()}
                                disabled={loading || !selectedMealSlot || !input.trim()}
                                className="w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 transition-colors"
                                style={{ background: loading || !selectedMealSlot || !input.trim() ? 'rgba(212,255,0,0.3)' : '#D4FF00' }}
                            >
                                {loading ? <Loader2 size={20} className="animate-spin text-black" /> : <ArrowRight size={20} strokeWidth={2} color="#0A0A0A" />}
                            </motion.button>
                        </div>
                    </div>
                </div>

            </div>
            <CustomMealModal
                isOpen={isCustomMealModalOpen}
                onClose={() => setIsCustomMealModalOpen(false)}
                onSave={handleCustomMealSave}
                defaultSlot={selectedMealSlot || undefined}
            />

            <EditMealModal
                isOpen={!!editingMeal}
                onClose={() => setEditingMeal(null)}
                meal={editingMeal}
                onSave={(updates) => {
                    if (!editingMeal) return;
                    updateMealMutation.mutate({
                        id: editingMeal.id,
                        updates,
                    });
                }}
            />

            <PreCommitEditModal
                isOpen={editingPending && !!pendingMeal}
                onClose={() => setEditingPending(false)}
                initial={
                    pendingMeal
                        ? {
                            meal_text: pendingMeal.text,
                            calories: pendingMeal.data?.calories ?? 0,
                            protein: pendingMeal.data?.protein ?? 0,
                            fat: pendingMeal.data?.fat ?? 0,
                            carbs: pendingMeal.data?.carbs ?? 0,
                            fiber: pendingMeal.data?.fiber,
                        }
                        : null
                }
                onSave={(updates) => {
                    if (!pendingMeal) return;

                    const editedTotals = {
                        calories: updates.calories,
                        protein: updates.protein,
                        fat: updates.fat,
                        carbs: updates.carbs,
                        fiber: updates.fiber,
                    };

                    const editedData = {
                        ...pendingMeal.data,
                        ...editedTotals,
                        _canonicalTotals: false, // let confirmMealMutation round user-typed values
                        _userEdited: true,
                    };

                    const editedStructured = pendingMeal.structured
                        ? { ...pendingMeal.structured, totals: editedTotals }
                        : pendingMeal.structured;

                    setPendingMeal({
                        text: updates.meal_text,
                        data: editedData,
                        request_id: pendingMeal.request_id,
                        source: pendingMeal.source,
                        creditsConsumed: pendingMeal.creditsConsumed,
                        structured: editedStructured,
                    });
                    setEditingPending(false);
                    haptics.tap();

                    confirmMealMutation.mutate({
                        text: updates.meal_text,
                        data: editedData,
                        source: "ai",
                        client_token: crypto.randomUUID(),
                    });
                }}
            />

            <ProtectProgressSheet
                isOpen={protectOpen}
                onClose={() => setProtectOpen(false)}
            />
        </MotionConfig>
    );
}
