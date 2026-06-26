import { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store";
import {
  Send,
  Loader2,
  Dumbbell,
  ChevronDown,
  ChevronRight,
  Sun,
  Sunrise,
  Moon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mealService } from "../services/mealService";
import { profileService } from "../services/profileService";
import { complianceService } from "../services/complianceService";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "motion/react";

const getDeterministicFallback = (text: string) => {
  const normalizedText = text.toLowerCase();
  let calories = 300,
    protein = 10,
    fat = 10,
    carbs = 40;
  let detected = [text];

  const foodDb: Record<
    string,
    { calories: number; protein: number; fat: number; carbs: number }
  > = {
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
      if (!foundMatch) {
        calories = 0;
        protein = 0;
        fat = 0;
        carbs = 0;
        detected = [];
        foundMatch = true;
      }
      calories += macros.calories;
      protein += macros.protein;
      fat += macros.fat;
      carbs += macros.carbs;
      detected.push(key);
    }
  }

  return {
    calories,
    protein,
    fat,
    carbs,
    confidence: foundMatch ? 80 : 30,
    foods_detected: detected,
    coaching_tip: "Stay consistent with your portions to hit your goals.",
  };
};

export function MealLoggerScreen() {
  const { chatHistory, addChatMessage, clearOldChats } = useAppStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<
    "breakfast" | "lunch" | "dinner" | null
  >(null);
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    clearOldChats();
    const hour = new Date().getHours();
    if (hour < 12) setSelectedMealSlot("breakfast");
    else if (hour < 18) setSelectedMealSlot("lunch");
    else setSelectedMealSlot("dinner");
  }, [clearOldChats]);

  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileService.getProfile(),
  });
  const { data: goal } = useQuery({
    queryKey: ["goal"],
    queryFn: () => profileService.getGoal(),
  });
  const { data: meals = [] } = useQuery({
    queryKey: ["meals", "today"],
    queryFn: () => mealService.getTodaysMeals(),
  });

  const toggleSlot = (slot: string) => {
    setExpandedSlots((prev) => (prev[slot] ? {} : { [slot]: true }));
  };

  const todaysMeals = meals;

  const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);
  const eatenFat = todaysMeals.reduce((acc, m) => acc + m.fat, 0);
  const eatenCarbs = todaysMeals.reduce((acc, m) => acc + m.carbs, 0);

  const breakfastMeals = todaysMeals.filter((m) => m.meal_slot === "breakfast");
  const lunchMeals = todaysMeals.filter((m) => m.meal_slot === "lunch");
  const dinnerMeals = todaysMeals.filter((m) => m.meal_slot === "dinner");

  const maintKcal = profile?.maintenance_kcal || 2200;
  const dailyTargetKcal = maintKcal - (goal?.deficit_kcal ?? 400);
  const proteinTarget = profile?.protein_target || 150;

  const remainingCalories = dailyTargetKcal - eatenKcal;
  const remainingProtein = proteinTarget - eatenProtein;

  const chat =
    chatHistory.length > 0
      ? chatHistory
      : [
          {
            role: "ai" as const,
            text: "Log a meal below — I'll calculate the macros and give coaching advice.",
          },
        ];
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat, meals]);

  const addMealMutation = useMutation({
    mutationFn: async (text: string) => {
      let retries = 3;
      while (retries > 0) {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) {
            throw new Error("Authentication failed");
          }

          const { data, error } = await supabase.functions.invoke(
            "parse-meal",
            {
              body: {
                text,
                remainingCalories,
                remainingProtein,
                mealType: selectedMealSlot,
              },
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            },
          );

          let errorMessage = null;
          let shouldRetry = true;

          if (error) {
            console.error("Function invoke error:", error);
            const msg = error.message || "";
            const status = error.status || (error as any).context?.status;

            if (
              status === 401 ||
              msg.includes("401") ||
              msg.includes("Unauthorized")
            ) {
              errorMessage = "Authentication failed";
              shouldRetry = false;
            } else if (
              status === 403 ||
              msg.includes("403") ||
              msg.includes("Forbidden")
            ) {
              errorMessage = "Authentication failed";
              shouldRetry = false;
            } else if (
              status === 429 ||
              msg.includes("429") ||
              msg.includes("limit")
            ) {
              errorMessage = "Daily limit reached";
              shouldRetry = false;
            } else if (
              status >= 500 ||
              msg.includes("500") ||
              msg.includes("Internal")
            )
              errorMessage = "Server unavailable";
            else if (msg.includes("timeout") || msg.includes("Timeout"))
              errorMessage = "Server unavailable";
            else if (msg.includes("JSON"))
              errorMessage = "Meal parsing unavailable";
            else if (msg.includes("fetch") || msg.includes("Network"))
              errorMessage = "Network offline";
            else errorMessage = "Meal parsing unavailable";
          }

          if (error || !data || typeof data.calories !== "number") {
            if (!shouldRetry || retries === 1) {
              if (!errorMessage) {
                errorMessage = "Meal parsing unavailable";
              }
              const fallbackData = getDeterministicFallback(text);
              const tip = `${errorMessage} Using offline estimate.`;

              await mealService.addMeal({
                meal_text: text,
                calories: fallbackData.calories,
                protein: fallbackData.protein,
                fat: fallbackData.fat,
                carbs: fallbackData.carbs,
                meal_time: new Date().toISOString(),
                tip: fallbackData.foods_detected?.join(", ") || text,
                meal_slot: selectedMealSlot || undefined,
              });

              return { ...fallbackData, _errorMessage: tip };
            }
            throw new Error(errorMessage || "API Error");
          }

          // Success Case
          await mealService.addMeal({
            meal_text: text,
            calories: data.calories,
            protein: data.protein,
            fat: data.fat,
            carbs: data.carbs,
            meal_time: new Date().toISOString(),
            tip: data.foods_detected?.join(", ") || text,
            meal_slot: selectedMealSlot || undefined,
          });
          return data;
        } catch (err: any) {
          retries--;
          if (retries === 0) {
            console.error("All retries failed:", err);
            const msg = err.message || "";
            let errorMessage = "";

            if (msg.includes("timeout") || msg.includes("Timeout"))
              errorMessage = "Server unavailable";
            else if (msg.includes("JSON"))
              errorMessage = "Meal parsing unavailable";
            else if (msg.includes("fetch") || msg.includes("Network"))
              errorMessage = "Network offline";
            else errorMessage = "Server unavailable";

            const fallbackData = getDeterministicFallback(text);
            const tip = `${errorMessage} Using offline estimate.`;

            await mealService.addMeal({
              meal_text: text,
              calories: fallbackData.calories,
              protein: fallbackData.protein,
              fat: fallbackData.fat,
              carbs: fallbackData.carbs,
              meal_time: new Date().toISOString(),
              tip: fallbackData.foods_detected?.join(", ") || text,
              meal_slot: selectedMealSlot || undefined,
            });

            return { ...fallbackData, _errorMessage: tip };
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    },
    onSuccess: (data, text) => {
      queryClient.invalidateQueries({ queryKey: ["meals", "today"] });
      // Fire-and-forget score update
      complianceService
        .updateTodayScore()
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["complianceScore"] });
        })
        .catch(console.error);

      const foodsDetected = data.foods_detected?.join(", ") || text;

      if (data._errorMessage) {
        addChatMessage({
          role: "ai",
          text: `${data._errorMessage} Logged: ${foodsDetected}. (Confidence: ${data.confidence}%)`,
          data,
        });
      } else {
        addChatMessage({
          role: "ai",
          text: `Got it. Logged: ${foodsDetected}. (Confidence: ${data.confidence}%)`,
          data,
        });
      }
      setLoading(false);
    },
    onError: () => {
      addChatMessage({
        role: "ai",
        text: "Sorry, I had trouble connecting to the nutrition database after multiple attempts.",
      });
      setLoading(false);
    },
  });

  const handleSend = (textOverride?: string) => {
    const text = textOverride || input.trim();
    if (!text || loading || !selectedMealSlot) return;

    setInput("");
    addChatMessage({ role: "user", text });
    setLoading(true);

    addMealMutation.mutate(text);
  };

  const renderMealBox = (
    slot: "breakfast" | "lunch" | "dinner",
    icon: React.ReactNode,
    title: string,
    timeRange: string,
  ) => {
    const slotMeals =
      slot === "breakfast"
        ? breakfastMeals
        : slot === "lunch"
          ? lunchMeals
          : dinnerMeals;
    const slotKcal = slotMeals.reduce((sum, m) => sum + m.calories, 0);
    const slotProtein = slotMeals.reduce((sum, m) => sum + m.protein, 0);
    const isExpanded = expandedSlots[slot];

    return (
      <div className="glass-card mb-[8px] sm:mb-0 overflow-hidden flex-1 flex flex-col">
        <div
          className="p-[10px_12px] sm:p-[8px_16px] flex justify-between items-center cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors relative"
          onClick={() => toggleSlot(slot)}
        >
          <div className="flex items-center gap-[10px]">
            <div
              className={cn(
                "w-[28px] h-[28px] rounded-[100px] flex items-center justify-center transition-colors",
                selectedMealSlot === slot
                  ? "bg-[#D4FF00] text-[#0A0A0A]"
                  : "bg-[rgba(255,255,255,0.1)] text-white",
              )}
            >
              {icon}
            </div>
            <div className="flex items-center gap-[6px]">
              <div className="text-[13px] font-semibold text-white leading-tight tracking-[-0.1px]">
                {title}
              </div>
              <div className="text-[11px] text-[#EBEBF599] hidden sm:block">
                · {timeRange}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-[12px] pr-[24px]">
            <div className="text-right flex items-center gap-[8px]">
              <div className="text-[13px] font-bold text-white tracking-[-0.2px] leading-none">
                {slotKcal}{" "}
                <span className="text-[10px] font-normal text-[#EBEBF599]">
                  kcal
                </span>
              </div>
              <div className="text-[11px] text-[#EBEBF5CC] bg-[rgba(255,255,255,0.05)] px-[6px] py-[2px] rounded-md">
                {slotProtein}g pro
              </div>
            </div>
            <div className="absolute right-[8px]">
              {isExpanded ? (
                <ChevronDown size={16} className="text-[#EBEBF599]" />
              ) : (
                <ChevronRight size={16} className="text-[#EBEBF599]" />
              )}
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }} // iOS like easing
              className="overflow-hidden bg-[rgba(20,20,20,0.5)] border-t border-[rgba(255,255,255,0.06)]"
            >
              <div className="p-[12px] sm:p-[8px]">
                {slotMeals.length === 0 ? (
                  <div className="text-[12px] text-[#EBEBF599] text-center py-[8px] italic">
                    Nothing logged yet
                  </div>
                ) : (
                  <div className="space-y-[8px]">
                    {slotMeals.map((m, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-[rgba(255,255,255,0.03)] p-[8px_10px] rounded-lg"
                      >
                        <div className="text-[13px] font-medium text-white capitalize truncate max-w-[50%] w-full">
                          {m.meal_text}
                        </div>
                        <div className="flex gap-[6px]">
                          <span className="text-[10px] bg-[rgba(255,77,28,0.15)] text-[#FF4D1C] px-[6px] py-[2px] rounded-[100px] font-semibold tracking-[0.02em] leading-none">
                            {m.calories} kcal
                          </span>
                          <span className="text-[10px] bg-[rgba(55,138,221,0.15)] text-[#378ADD] px-[6px] py-[2px] rounded-[100px] font-semibold tracking-[0.02em] leading-none">
                            {m.protein}g
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="screen-container screen-enter flex flex-col h-full !pb-4">
      <div className="mb-[12px] sm:mb-[16px]">
        <div className="flex justify-center gap-[6px] mb-[8px] sm:mb-[12px]">
          <button
            onClick={() => setSelectedMealSlot("breakfast")}
            className={cn(
              "flex-1 py-[6px] px-[8px] rounded-[100px] transition-all text-[11px] sm:text-[12px] font-semibold flex items-center justify-center gap-[4px] border",
              selectedMealSlot === "breakfast"
                ? "bg-[rgba(212,255,0,0.1)] text-[#D4FF00] border-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.1)]"
                : "bg-[rgba(255,255,255,0.05)] text-[#EBEBF5CC] border-transparent hover:bg-[rgba(255,255,255,0.08)]",
            )}
          >
            <Sunrise size={14} /> Breakfast
          </button>
          <button
            onClick={() => setSelectedMealSlot("lunch")}
            className={cn(
              "flex-1 py-[6px] px-[8px] rounded-[100px] transition-all text-[11px] sm:text-[12px] font-semibold flex items-center justify-center gap-[4px] border",
              selectedMealSlot === "lunch"
                ? "bg-[rgba(212,255,0,0.1)] text-[#D4FF00] border-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.1)]"
                : "bg-[rgba(255,255,255,0.05)] text-[#EBEBF5CC] border-transparent hover:bg-[rgba(255,255,255,0.08)]",
            )}
          >
            <Sun size={14} /> Lunch
          </button>
          <button
            onClick={() => setSelectedMealSlot("dinner")}
            className={cn(
              "flex-1 py-[6px] px-[8px] rounded-[100px] transition-all text-[11px] sm:text-[12px] font-semibold flex items-center justify-center gap-[4px] border",
              selectedMealSlot === "dinner"
                ? "bg-[rgba(212,255,0,0.1)] text-[#D4FF00] border-[#D4FF00] shadow-[0_0_10px_rgba(212,255,0,0.1)]"
                : "bg-[rgba(255,255,255,0.05)] text-[#EBEBF5CC] border-transparent hover:bg-[rgba(255,255,255,0.08)]",
            )}
          >
            <Moon size={14} /> Dinner
          </button>
        </div>

        <div className="flex flex-col gap-[8px] mb-[12px] sm:mb-[16px]">
          {renderMealBox(
            "breakfast",
            <Sunrise size={14} />,
            "Breakfast",
            "6 am–12 pm",
          )}
          {renderMealBox("lunch", <Sun size={14} />, "Lunch", "12 pm–6 pm")}
          {renderMealBox("dinner", <Moon size={14} />, "Dinner", "6 pm–10 pm")}
        </div>
      </div>

      <div
        className="flex flex-col gap-[12px] mb-[20px] flex-1 overflow-y-auto pr-[4px] hide-scrollbar"
        ref={chatRef}
      >
        {chat.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "p-[12px_16px] text-[15px] leading-relaxed max-w-[85%] font-normal tracking-[-0.1px]",
              msg.role === "user"
                ? "bg-[#D4FF00] text-[#0A0A0A] rounded-[16px] rounded-br-[4px] self-end shadow-sm"
                : "glass-card text-white rounded-[16px] rounded-bl-[4px] self-start",
            )}
          >
            <div>{msg.text}</div>
            {msg.data && (
              <div className="flex gap-[8px] flex-wrap mt-[12px]">
                <span className="text-[11px] px-[8px] py-[2px] rounded-[100px] font-semibold uppercase tracking-[0.04em] bg-[rgba(255,77,28,0.15)] text-[#FF4D1C]">
                  ~{msg.data.calories} kcal
                </span>
                <span className="text-[11px] px-[8px] py-[2px] rounded-[100px] font-semibold uppercase tracking-[0.04em] bg-[rgba(55,138,221,0.15)] text-[#378ADD]">
                  {msg.data.protein}g pro
                </span>
                <span className="text-[11px] px-[8px] py-[2px] rounded-[100px] font-semibold uppercase tracking-[0.04em] bg-[rgba(255,255,255,0.1)] text-[#EBEBF5CC]">
                  {msg.data.fat}g fat
                </span>
                <span className="text-[11px] px-[8px] py-[2px] rounded-[100px] font-semibold uppercase tracking-[0.04em] bg-[rgba(255,255,255,0.1)] text-[#EBEBF5CC]">
                  {msg.data.carbs}g carb
                </span>
              </div>
            )}
            {msg.data?.coaching_tip && (
              <div className="mt-[16px] pt-[12px] border-t border-[rgba(255,255,255,0.06)] flex gap-[8px]">
                <Dumbbell
                  size={16}
                  className="text-[#D4FF00] mt-[2px] shrink-0"
                />
                <div className="text-[13px] text-[#EBEBF5CC] italic pl-[8px] border-l-[1.5px] border-[#D4FF00]/40 leading-[1.4]">
                  {msg.data.coaching_tip}
                </div>
              </div>
            )}
            {msg.data?.tip && !msg.data?.coaching_tip && (
              <div className="mt-[12px] pt-[8px] border-t border-[rgba(255,255,255,0.06)] text-[12px] text-[#EBEBF599] italic">
                Detected: {msg.data.tip}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="glass-card text-white rounded-[16px] rounded-bl-[4px] self-start p-[12px_16px] text-[15px] font-normal tracking-[-0.1px] max-w-[85%] flex items-center gap-[8px]">
            <Loader2 size={16} className="animate-spin text-[#D4FF00]" />{" "}
            Parsing meal...
          </div>
        )}
      </div>

      <div className="flex gap-[12px] items-center mb-[20px] shrink-0">
        <input
          className="input-field flex-1 !p-[14px_16px] !rounded-[100px]"
          type="text"
          placeholder={
            selectedMealSlot
              ? "What did you eat? Type naturally..."
              : "Select a meal slot above first"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading || !selectedMealSlot}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !selectedMealSlot}
          aria-label="Log meal"
          className="w-[48px] h-[48px] rounded-[100px] border-none bg-[#D4FF00] text-[#0A0A0A] flex items-center justify-center cursor-pointer disabled:opacity-50 transition-transform active:scale-[0.96]"
        >
          <Send size={20} className="ml-[2px]" />
        </button>
      </div>

      <div className="glass-card p-[16px] shrink-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#EBEBF599] mb-[12px]">
          Today so far
        </div>
        <div className="grid grid-cols-4 gap-[8px]">
          <div className="text-center">
            <div className="text-[17px] font-bold text-[#FF4D1C] tracking-[-0.2px]">
              {eatenKcal.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#EBEBF599] mt-[2px]">kcal</div>
          </div>
          <div className="text-center">
            <div className="text-[17px] font-bold text-[#378ADD] tracking-[-0.2px]">
              {eatenProtein}g
            </div>
            <div className="text-[11px] text-[#EBEBF599] mt-[2px]">pro</div>
          </div>
          <div className="text-center">
            <div className="text-[17px] font-bold text-white tracking-[-0.2px]">
              {eatenFat}g
            </div>
            <div className="text-[11px] text-[#EBEBF599] mt-[2px]">fat</div>
          </div>
          <div className="text-center">
            <div className="text-[17px] font-bold text-white tracking-[-0.2px]">
              {eatenCarbs}g
            </div>
            <div className="text-[11px] text-[#EBEBF599] mt-[2px]">carbs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
