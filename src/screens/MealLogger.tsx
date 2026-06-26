import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { Send, Loader2, Dumbbell, ChevronDown, ChevronRight, Sun, Sunrise, Moon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mealService } from '../services/mealService';
import { profileService } from '../services/profileService';
import { complianceService } from '../services/complianceService';
import { supabase } from '../lib/supabase';

const getDeterministicFallback = (text: string) => {
  const normalizedText = text.toLowerCase();
  let calories = 300, protein = 10, fat = 10, carbs = 40;
  let detected = [text];

  const foodDb: Record<string, { calories: number, protein: number, fat: number, carbs: number }> = {
    'chicken': { calories: 250, protein: 30, fat: 10, carbs: 0 },
    'dal': { calories: 200, protein: 12, fat: 4, carbs: 30 },
    'chawal': { calories: 240, protein: 4, fat: 0, carbs: 53 },
    'rice': { calories: 240, protein: 4, fat: 0, carbs: 53 },
    'paneer': { calories: 350, protein: 20, fat: 28, carbs: 4 },
    'fish': { calories: 200, protein: 25, fat: 10, carbs: 0 },
    'idli': { calories: 150, protein: 4, fat: 0, carbs: 30 },
    'roti': { calories: 120, protein: 4, fat: 1, carbs: 25 },
    'egg': { calories: 140, protein: 12, fat: 10, carbs: 1 },
    'salad': { calories: 50, protein: 2, fat: 0, carbs: 10 },
    'chai': { calories: 100, protein: 2, fat: 3, carbs: 15 },
    'biscuit': { calories: 150, protein: 2, fat: 5, carbs: 20 }
  };

  let foundMatch = false;
  for (const [key, macros] of Object.entries(foodDb)) {
    if (normalizedText.includes(key)) {
      if (!foundMatch) {
        calories = 0; protein = 0; fat = 0; carbs = 0;
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
    coaching_tip: "Stay consistent with your portions to hit your goals."
  };
};

export function MealLoggerScreen() {
  const { chatHistory, addChatMessage, clearOldChats } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMealSlot, setSelectedMealSlot] = useState<'breakfast'|'lunch'|'dinner'|null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    clearOldChats();
    const hour = new Date().getHours();
    if (hour < 12) setSelectedMealSlot('breakfast');
    else if (hour < 18) setSelectedMealSlot('lunch');
    else setSelectedMealSlot('dinner');
  }, [clearOldChats]);

  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileService.getProfile() });
  const { data: goal } = useQuery({ queryKey: ['goal'], queryFn: () => profileService.getGoal() });
  const { data: meals = [] } = useQuery({ queryKey: ['meals', 'today'], queryFn: () => mealService.getTodaysMeals() });

  const toggleSlot = (slot: string) => {
    setExpandedSlots(prev => ({ ...prev, [slot]: !prev[slot] }));
  };

  const todaysMeals = meals;
  
  const eatenKcal = todaysMeals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = todaysMeals.reduce((acc, m) => acc + m.protein, 0);
  const eatenFat = todaysMeals.reduce((acc, m) => acc + m.fat, 0);
  const eatenCarbs = todaysMeals.reduce((acc, m) => acc + m.carbs, 0);

  const breakfastMeals = todaysMeals.filter(m => m.meal_slot === 'breakfast');
  const lunchMeals = todaysMeals.filter(m => m.meal_slot === 'lunch');
  const dinnerMeals = todaysMeals.filter(m => m.meal_slot === 'dinner');

  const maintKcal = profile?.maintenance_kcal || 2200;
  const dailyTargetKcal = maintKcal - (goal?.deficit_kcal ?? 400);
  const proteinTarget = profile?.protein_target || 150;
  
  const remainingCalories = dailyTargetKcal - eatenKcal;
  const remainingProtein = proteinTarget - eatenProtein;

  const chat = chatHistory.length > 0 ? chatHistory : [
    { role: 'ai' as const, text: "Log a meal below — I'll calculate the macros and give coaching advice." }
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
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error("Authentication failed");
          }

          const { data, error } = await supabase.functions.invoke('parse-meal', {
            body: { 
              text,
              remainingCalories,
              remainingProtein,
              mealType: selectedMealSlot
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });
          
          let errorMessage = null;
          let shouldRetry = true;

          if (error) {
            console.error("Function invoke error:", error);
            const msg = error.message || '';
            const status = error.status || (error as any).context?.status;
            
            if (status === 401 || msg.includes('401') || msg.includes('Unauthorized')) { errorMessage = "Authentication failed"; shouldRetry = false; }
            else if (status === 403 || msg.includes('403') || msg.includes('Forbidden')) { errorMessage = "Authentication failed"; shouldRetry = false; }
            else if (status === 429 || msg.includes('429') || msg.includes('limit')) { errorMessage = "Daily limit reached"; shouldRetry = false; }
            else if (status >= 500 || msg.includes('500') || msg.includes('Internal')) errorMessage = "Server unavailable";
            else if (msg.includes('timeout') || msg.includes('Timeout')) errorMessage = "Server unavailable";
            else if (msg.includes('JSON')) errorMessage = "Meal parsing unavailable";
            else if (msg.includes('fetch') || msg.includes('Network')) errorMessage = "Network offline";
            else errorMessage = "Meal parsing unavailable";
          }

          if (error || !data || typeof data.calories !== 'number') {
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
                tip: fallbackData.foods_detected?.join(', ') || text,
                meal_slot: selectedMealSlot || undefined
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
            tip: data.foods_detected?.join(', ') || text,
            meal_slot: selectedMealSlot || undefined
          });
          return data;

        } catch (err: any) {
          retries--;
          if (retries === 0) {
            console.error("All retries failed:", err);
            const msg = err.message || '';
            let errorMessage = '';
            
            if (msg.includes('timeout') || msg.includes('Timeout')) errorMessage = "Server unavailable";
            else if (msg.includes('JSON')) errorMessage = "Meal parsing unavailable";
            else if (msg.includes('fetch') || msg.includes('Network')) errorMessage = "Network offline";
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
              tip: fallbackData.foods_detected?.join(', ') || text,
              meal_slot: selectedMealSlot || undefined
            });

            return { ...fallbackData, _errorMessage: tip };
          }
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    },
    onSuccess: (data, text) => {
      queryClient.invalidateQueries({ queryKey: ['meals', 'today'] });
      // Fire-and-forget score update
      complianceService.updateTodayScore().then(() => {
        queryClient.invalidateQueries({ queryKey: ['complianceScore'] });
      }).catch(console.error);
      
      const foodsDetected = data.foods_detected?.join(', ') || text;
      
      if (data._errorMessage) {
        addChatMessage({ 
          role: 'ai', 
          text: `${data._errorMessage} Logged: ${foodsDetected}. (Confidence: ${data.confidence}%)`,
          data 
        });
      } else {
        addChatMessage({ 
          role: 'ai', 
          text: `Got it. Logged: ${foodsDetected}. (Confidence: ${data.confidence}%)`,
          data 
        });
      }
      setLoading(false);
    },
    onError: () => {
      addChatMessage({ role: 'ai', text: "Sorry, I had trouble connecting to the nutrition database after multiple attempts." });
      setLoading(false);
    }
  });

  const handleSend = (textOverride?: string) => {
    const text = textOverride || input.trim();
    if (!text || loading || !selectedMealSlot) return;
    
    setInput('');
    addChatMessage({ role: 'user', text });
    setLoading(true);

    addMealMutation.mutate(text);
  };

  const renderMealBox = (slot: 'breakfast' | 'lunch' | 'dinner', icon: React.ReactNode, title: string, timeRange: string) => {
    const slotMeals = slot === 'breakfast' ? breakfastMeals : slot === 'lunch' ? lunchMeals : dinnerMeals;
    const slotKcal = slotMeals.reduce((sum, m) => sum + m.calories, 0);
    const slotProtein = slotMeals.reduce((sum, m) => sum + m.protein, 0);
    const isExpanded = expandedSlots[slot];

    return (
      <div className="bg-background-secondary border border-border-secondary rounded-lg mb-2 overflow-hidden">
        <div 
          className="p-3 flex justify-between items-center cursor-pointer hover:bg-background-tertiary transition-colors"
          onClick={() => toggleSlot(slot)}
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              selectedMealSlot === slot ? "bg-purple text-background-primary" : "bg-purple/10 text-purple"
            )}>
              {icon}
            </div>
            <div>
              <div className="text-[14px] font-medium text-text-primary leading-tight">{title}</div>
              <div className="text-[11px] text-text-secondary">{timeRange}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[13px] font-bold text-text-primary">{slotKcal} kcal</div>
              <div className="text-[11px] text-text-secondary">{slotProtein}g protein</div>
            </div>
            {isExpanded ? <ChevronDown size={16} className="text-text-tertiary" /> : <ChevronRight size={16} className="text-text-tertiary" />}
          </div>
        </div>
        
        {isExpanded && (
          <div className="bg-background-primary p-3 border-t border-border-secondary">
            {slotMeals.length === 0 ? (
              <div className="text-[12px] text-text-tertiary text-center py-2 italic">Nothing logged yet</div>
            ) : (
              <div className="space-y-2">
                {slotMeals.map((m, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="text-[13px] text-text-primary capitalize truncate max-w-[50%]">{m.meal_text}</div>
                    <div className="flex gap-1.5">
                      <span className="text-[10px] bg-amber/10 text-amber px-1.5 py-0.5 rounded font-medium">{m.calories} kcal</span>
                      <span className="text-[10px] bg-blue/10 text-blue px-1.5 py-0.5 rounded font-medium">{m.protein}g</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-4">
        <div className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-3 text-center">Select Meal Slot</div>
        <div className="flex justify-center gap-2 mb-4">
          <button 
            onClick={() => setSelectedMealSlot('breakfast')}
            className={cn(
              "flex-1 py-2 px-1 rounded-full border transition-all text-[12px] font-medium flex items-center justify-center gap-1.5",
              selectedMealSlot === 'breakfast' 
                ? "bg-purple text-background-primary border-purple shadow-sm" 
                : "bg-background-secondary text-text-secondary border-border-tertiary hover:border-border-secondary"
            )}
          >
            <Sunrise size={14} /> Breakfast
          </button>
          <button 
            onClick={() => setSelectedMealSlot('lunch')}
            className={cn(
              "flex-1 py-2 px-1 rounded-full border transition-all text-[12px] font-medium flex items-center justify-center gap-1.5",
              selectedMealSlot === 'lunch' 
                ? "bg-purple text-background-primary border-purple shadow-sm" 
                : "bg-background-secondary text-text-secondary border-border-tertiary hover:border-border-secondary"
            )}
          >
            <Sun size={14} /> Lunch
          </button>
          <button 
            onClick={() => setSelectedMealSlot('dinner')}
            className={cn(
              "flex-1 py-2 px-1 rounded-full border transition-all text-[12px] font-medium flex items-center justify-center gap-1.5",
              selectedMealSlot === 'dinner' 
                ? "bg-purple text-background-primary border-purple shadow-sm" 
                : "bg-background-secondary text-text-secondary border-border-tertiary hover:border-border-secondary"
            )}
          >
            <Moon size={14} /> Dinner
          </button>
        </div>

        {renderMealBox('breakfast', <Sunrise size={16} />, 'Breakfast', '6 am–12 pm')}
        {renderMealBox('lunch', <Sun size={16} />, 'Lunch', '12 pm–6 pm')}
        {renderMealBox('dinner', <Moon size={16} />, 'Dinner', '6 pm–10 pm')}
      </div>
      
      <div className="flex flex-col gap-2 mb-3 flex-1 overflow-y-auto pr-1" ref={chatRef}>
        {chat.map((msg, i) => (
          <div key={i} className={cn(
            "p-2 px-3 text-[13px] leading-relaxed max-w-[85%]",
            msg.role === 'user' 
              ? "bg-purple text-background-primary rounded-t-xl rounded-bl-xl self-end"
              : "bg-background-secondary border-[0.5px] border-border-tertiary text-text-primary rounded-t-xl rounded-br-xl self-start"
          )}>
            <div>{msg.text}</div>
            {msg.data && (
              <div className="flex gap-1.5 flex-wrap mt-1.5">
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-bg text-text-primary">~{msg.data.calories} kcal</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-bg text-text-primary">{msg.data.protein}g protein</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-pink-bg text-text-primary">{msg.data.fat}g fat</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-green-bg text-text-primary">{msg.data.carbs}g carbs</span>
              </div>
            )}
            {msg.data?.coaching_tip && (
              <div className="mt-2.5 pt-2.5 border-t border-border-tertiary flex gap-2">
                <Dumbbell size={14} className="text-teal mt-0.5 shrink-0" />
                <div className="text-[12px] text-teal italic pl-1 border-l-2 border-teal/30">
                  {msg.data.coaching_tip}
                </div>
              </div>
            )}
            {msg.data?.tip && !msg.data?.coaching_tip && (
              <div className="mt-2 pt-2 border-t border-border-tertiary text-[12px] text-text-secondary italic">
                Detected: {msg.data.tip}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="bg-background-secondary border-[0.5px] border-border-tertiary text-text-primary rounded-t-xl rounded-br-xl self-start p-2 px-3 text-[13px] max-w-[85%] flex items-center gap-1.5">
            <Loader2 size={14} className="animate-spin text-purple" /> Parsing meal...
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center mb-3">
        <input 
          className="flex-1 px-3 py-2 border-[0.5px] border-border-secondary rounded-md text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple disabled:opacity-50" 
          type="text" 
          placeholder={selectedMealSlot ? "What did you eat? Type naturally..." : "Select a meal slot above first"}
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={loading || !selectedMealSlot}
        />
        <button onClick={() => handleSend()} disabled={loading || !selectedMealSlot} aria-label="Log meal" className="w-9 h-9 rounded-md border-none bg-purple text-background-primary flex items-center justify-center cursor-pointer disabled:opacity-50">
          <Send size={16} />
        </button>
      </div>

      <div className="bg-background-secondary rounded-md p-3 border-[0.5px] border-border-tertiary shrink-0">
        <div className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-2">Today so far</div>
        <div className="grid grid-cols-4 gap-1.5">
          <div className="text-center">
            <div className="text-[16px] font-medium text-amber">{eatenKcal.toLocaleString()}</div>
            <div className="text-[10px] text-text-secondary">kcal eaten</div>
          </div>
          <div className="text-center">
            <div className="text-[16px] font-medium text-blue">{eatenProtein}g</div>
            <div className="text-[10px] text-text-secondary">protein</div>
          </div>
          <div className="text-center">
            <div className="text-[16px] font-medium text-pink">{eatenFat}g</div>
            <div className="text-[10px] text-text-secondary">fat</div>
          </div>
          <div className="text-center">
            <div className="text-[16px] font-medium text-green">{eatenCarbs}g</div>
            <div className="text-[10px] text-text-secondary">carbs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
