import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { mealService } from '@/features/nutrition/services/mealService';

interface MealDistributionChartProps {
  color: string;
}

export function MealDistributionChart({ color }: MealDistributionChartProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  
  // Format date for fetching
  const dateStr = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

  const { data: meals = [] } = useQuery({
    queryKey: ['meals', 'date', dateStr],
    queryFn: () => mealService.getMealsForDate(selectedDate)
  });

  const distribution = useMemo(() => {
    const dist = {
      breakfast: { calories: 0, protein: 0, fat: 0, carbs: 0 },
      lunch: { calories: 0, protein: 0, fat: 0, carbs: 0 },
      dinner: { calories: 0, protein: 0, fat: 0, carbs: 0 },
    };
    meals.forEach(m => {
      const type = (m.meal_slot || 'breakfast').toLowerCase();
      if (dist[type as keyof typeof dist]) {
        dist[type as keyof typeof dist].calories += m.calories;
        dist[type as keyof typeof dist].protein += m.protein;
        dist[type as keyof typeof dist].fat += m.fat;
        dist[type as keyof typeof dist].carbs += m.carbs;
      }
    });
    return dist;
  }, [meals]);

  const maxCalories = Math.max(
    distribution.breakfast.calories,
    distribution.lunch.calories,
    distribution.dinner.calories,
    100 // ensure we don't divide by zero
  );

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const handlePrevDay = () => setSelectedDate(d => {
    const newDate = new Date(d);
    newDate.setDate(newDate.getDate() - 1);
    return newDate;
  });

  const handleNextDay = () => setSelectedDate(d => {
    if (isToday(d)) return d;
    const newDate = new Date(d);
    newDate.setDate(newDate.getDate() + 1);
    return newDate;
  });

  const slots = [
    { id: 'breakfast', label: '🍳 Breakfast', data: distribution.breakfast },
    { id: 'lunch', label: '☀️ Lunch', data: distribution.lunch },
    { id: 'dinner', label: '🌙 Dinner', data: distribution.dinner },
  ];

  const dateDisplay = isToday(selectedDate) ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'rgba(235,235,245,0.5)', textTransform: 'uppercase' }}>Meal Distribution</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handlePrevDay} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: 'white', padding: '2px', cursor: 'pointer' }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 'var(--font-xs)', color: 'white', minWidth: '60px', textAlign: 'center', fontWeight: 500 }}>{dateDisplay}</span>
          <button onClick={handleNextDay} disabled={isToday(selectedDate)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px', color: 'white', padding: '2px', cursor: isToday(selectedDate) ? 'not-allowed' : 'pointer', opacity: isToday(selectedDate) ? 0.3 : 1 }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {slots.map((slot, i) => (
          <React.Fragment key={slot.id}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{slot.label}</div>
                <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: slot.data.calories > 0 ? 'white' : 'rgba(235,235,245,0.3)' }}>
                  {Math.round(slot.data.calories)} kcal
                </div>
              </div>
              
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: slot.data.calories > 0 ? `${Math.min(100, (slot.data.calories / maxCalories) * 100)}%` : '0%', 
                    background: slot.data.calories > 0 ? color : 'transparent',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease-out'
                  }} 
                />
              </div>
              
              {slot.data.calories > 0 && (
                <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: 'rgba(235,235,245,0.4)', fontWeight: 600 }}>
                  <span>P: {Math.round(slot.data.protein)}g</span>
                  <span>F: {Math.round(slot.data.fat)}g</span>
                  <span>C: {Math.round(slot.data.carbs)}g</span>
                </div>
              )}
            </div>
            {i < slots.length - 1 && (
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', width: '100%' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
