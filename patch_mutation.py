import sys

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "const { data, error } = await supabase.functions.invoke('parse-meal'" in line:
        new_lines.append("""            const { data, error } = await supabase.functions.invoke('parse-meal', { body: { text, remainingCalories, remainingProtein, mealType: selectedMealSlot }, headers: { Authorization: `Bearer ${freshSession.access_token}` } });
            aiResponseDuration = Date.now() - edgeStart;

            if (error) {
              const status = (error as any)?.context?.status ?? 0;
              const responseBody = (error as any)?.context?.body ?? data ?? null;
              const msg = String(error.message ?? '');
              
              if (import.meta.env.DEV) {
                 console.error('[MealLogger] Edge Function Error:', { status, message: msg, error, responseBody });
              }
              
              if (status === 401 || status === 403) { 
                if (attempt < 2) { await supabase.auth.refreshSession(); lastError = new Error('Auth — retrying'); continue; }
                throw new Error('Authentication failure');
              }
              if (status === 429) throw new Error('Daily AI limit reached');
              if (status === 504 || msg.includes('timeout')) {
                lastError = new Error('AI took too long to respond');
                if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; }
                throw new Error('AI took too long to respond');
              }
              if (msg.includes('fetch') || msg.includes('Network') || msg.includes('Failed to fetch')) { 
                lastError = new Error('No internet connection');
                if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; }
                throw new Error('No internet connection');
              }
              if (status >= 500) { 
                lastError = new Error('Server error');
                if (attempt < 2) { await new Promise(r => setTimeout(r, 1200 * (attempt + 1))); continue; }
                
                let detailedMessage = 'Server error';
                try {
                  const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                  if (parsed?.error) detailedMessage = parsed.error;
                } catch (e) {}
                throw new Error(detailedMessage);
              }
              
              let detailedMessage = msg || 'AI temporarily unavailable';
              try {
                const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                if (parsed?.error) detailedMessage = parsed.error;
              } catch (e) {}
              throw new Error(detailedMessage);
            }

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
      
      return { _errorMessage: errorContext, text };\n""")
        skip = True
        continue
    
    if skip:
        if "return { _errorMessage: errorContext, text };" in line:
            skip = False
        continue
        
    new_lines.append(line)

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
    f.writelines(new_lines)
print("Updated successfully")
