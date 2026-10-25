import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hevkurreqyubqvpykisf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhldmt1cnJlcXl1YnF2cHlraXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMDg4NDMsImV4cCI6MjA5Nzg4NDg0M30.Xjs_cGs21YzLA-LUM2CJlAWwT9cLhLtanYC8Pfkhw-4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  // Try to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'spike@leaniqa.local',
    password: 'Omgupta123@'
  });
  
  if (error) {
    console.log('Sign in error:', error.message);
    return;
  }
  
  console.log('Signed in:', data.user?.id);
  
  const token = data.session.access_token;
  console.log('Token:', token.substring(0, 50) + '...');
  
  // Call the function
  const response = await fetch(`${SUPABASE_URL}/functions/v1/resolve-meal-v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: '200g grilled salmon weighed after air frying, no oil',
      mealType: 'lunch'
    })
  });
  
  const result = await response.json();
  console.log('Call 1 result:', JSON.stringify(result, null, 2));
  
  // Call 2
  const response2 = await fetch(`${SUPABASE_URL}/functions/v1/resolve-meal-v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: '200g grilled salmon',
      mealType: 'lunch'
    })
  });
  
  const result2 = await response2.json();
  console.log('Call 2 result:', JSON.stringify(result2, null, 2));
  
  // Call 3
  const response3 = await fetch(`${SUPABASE_URL}/functions/v1/resolve-meal-v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: '200g grilled salmon',
      mealType: 'lunch'
    })
  });
  
  const result3 = await response3.json();
  console.log('Call 3 result:', JSON.stringify(result3, null, 2));
}

test();