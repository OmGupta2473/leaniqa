import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { IndianFoodsDB } from '../data';

export function MealLoggerScreen() {
  const { meals, addMeal, profile } = useAppStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<{role: 'user'|'ai', text: string, data?: any}[]>([
    { role: 'ai', text: `Good morning, ${profile?.name || 'Rahul'}! What did you eat first today? Just type it naturally — I'll handle the rest.` }
  ]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input.trim();
    if (!text) return;
    
    setInput('');
    setChat(prev => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      // First check local hardcoded DB for instant response simulation
      const tLower = text.toLowerCase();
      let matchedLocal = false;
      
      for (const [key, resp] of Object.entries(IndianFoodsDB)) {
        if (tLower.includes(key) && resp) {
          // It's a string like '~620 kcal · 22g protein...'
          // We can parse it roughly or just let the API handle it if we want structured data
          // But to be safe and structured, we will always call our API!
        }
      }

      const res = await fetch('/api/parse-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await res.json();
      
      if (data.calories) {
        addMeal({
          id: Date.now().toString(),
          text,
          name: data.name || text,
          calories: data.calories,
          protein: data.protein,
          fat: data.fat,
          carbs: data.carbs,
          time: new Date().toISOString()
        });
        
        setChat(prev => [...prev, { 
          role: 'ai', 
          text: `Got it. ${data.name || text}.`,
          data 
        }]);
      } else {
        setChat(prev => [...prev, { role: 'ai', text: "I couldn't parse that meal. Could you try being more specific?" }]);
      }
    } catch (e) {
      console.error(e);
      setChat(prev => [...prev, { role: 'ai', text: "Sorry, I had trouble connecting to the nutrition database." }]);
    } finally {
      setLoading(false);
    }
  };

  const eatenKcal = meals.reduce((acc, m) => acc + m.calories, 0);
  const eatenProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const eatenFat = meals.reduce((acc, m) => acc + m.fat, 0);
  const eatenCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary mb-2">Today's meals</div>
      <div className="flex gap-1.5 flex-wrap mb-2.5">
        {['Dal chawal (1 plate)', '2 rotis with sabzi', '1 cup chai with 2 biscuits', 'Boiled eggs (2)', 'Paneer tikka 150g'].map(q => (
          <div key={q} onClick={() => handleSend(q)} className="px-2.5 py-1 rounded-full border-[0.5px] border-border-secondary text-[11px] text-text-secondary cursor-pointer bg-background-primary transition-all hover:border-purple hover:text-text-primary hover:bg-purple-bg">
            + {q.split(' (')[0].split(' with')[0]}
          </div>
        ))}
      </div>
      
      <div className="flex flex-col gap-2 mb-3 flex-1 overflow-y-auto" ref={chatRef}>
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
            {msg.data?.tip && (
              <div className="mt-2 pt-2 border-t border-border-tertiary text-[12px] text-teal italic">
                "{msg.data.tip}"
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
          className="flex-1 px-3 py-2 border-[0.5px] border-border-secondary rounded-md text-[13px] text-text-primary bg-background-primary focus:outline-none focus:border-purple" 
          type="text" 
          placeholder="What did you eat? Type naturally..." 
          value={input} 
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button onClick={() => handleSend()} disabled={loading} aria-label="Log meal" className="w-9 h-9 rounded-md border-none bg-purple text-background-primary flex items-center justify-center cursor-pointer disabled:opacity-50">
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
