import re

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

# Let's find the `const { data: responseBody, error: functionError } = await supabase.functions.invoke('parse-meal', {`
# and the `return data;` inside the try catch.

start_str = "            const { data: responseBody, error: functionError } = await supabase.functions.invoke('parse-meal', {"
end_str = "            return data;"

start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_block = """            const { data: responseBody, error: functionError } = await supabase.functions.invoke('parse-meal', {
              body: { 
                text, 
                remainingCalories, 
                remainingProtein, 
                mealType: selectedMealSlot, 
                userGoal: onboardingData?.goal 
              }
            });

            aiResponseDuration = Date.now() - edgeStart;

            let data = responseBody;

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
                throw new Error(msg.includes('Friendly Retry') ? msg : `AI Service Error: ${msg}`);
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
              if (attempt < 2) continue;
              throw new Error('AI returned invalid data');
            }
            
"""
    new_content = content[:start_idx] + new_block + content[end_idx:]
    with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
        f.write(new_content)
    print("Fixed!")
else:
    print("Could not find start or end index.")
