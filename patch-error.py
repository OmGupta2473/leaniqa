import sys

with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'r') as f:
    content = f.read()

target = """            if (error) {
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
            }"""

replacement = """            if (error) {
              const status = (error as any)?.context?.status ?? 0;
              let responseBody: any = data ?? null;
              
              if (error.name === 'FunctionsHttpError' && (error as any)?.context?.json) {
                try {
                  responseBody = await (error as any).context.clone().json();
                } catch (e) {
                  try {
                    responseBody = await (error as any).context.clone().text();
                  } catch (e2) {}
                }
              }

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
                  else if (typeof responseBody === 'string') detailedMessage = responseBody;
                  else if (responseBody) detailedMessage = JSON.stringify(responseBody);
                } catch (e) {}
                throw new Error(detailedMessage);
              }
              
              let detailedMessage = msg || 'AI temporarily unavailable';
              try {
                const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                if (parsed?.error) detailedMessage = parsed.error;
                else if (typeof responseBody === 'string') detailedMessage = responseBody;
                else if (responseBody) detailedMessage = JSON.stringify(responseBody);
              } catch (e) {}
              throw new Error(detailedMessage);
            }"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/features/nutrition/pages/MealLoggerPage.tsx', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Target not found!")
