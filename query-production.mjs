import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hevkurreqyubqvpykisf.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhldmt1cnJlcXl1YnF2cHlraXNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjMwODg0MywiZXhwIjoyMDk3ODg0ODQzfQ.rjH4XLWDOOOK8BS8oLMV6lpiC5PvVTHvKP_s3GrXr6M';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEST_USER_ID = 'b1d69045-15b6-4617-9334-d1e558b2f418';

async function queryFoods() {
  console.log('=== 1. Foods with oil_included=true ===');
  
  const { data: foods, error } = await supabase
    .from('foods')
    .select('id, canonical_name, category, is_ambiguous, oil_included')
    .eq('oil_included', true)
    .order('id');
  
  if (error) {
    console.error('Error fetching foods:', error);
    return;
  }
  
  console.log(`Found ${foods.length} foods with oil_included=true`);
  foods.forEach(f => {
    console.log(`  id: ${f.id}, name: ${f.canonical_name}, category: ${f.category}, ambiguous: ${f.is_ambiguous}`);
  });
  
  // Check ambiguous terms table
  console.log('\n=== 2. Ambiguous terms ===');
  const { data: ambTerms } = await supabase
    .from('food_ambiguous_terms')
    .select('term');
  console.log('Ambiguous terms:', ambTerms?.map(t => t.term).join(', '));
  
  // Check ambiguous candidates
  console.log('\n=== 3. Ambiguous candidates ===');
  const { data: ambCandidates } = await supabase
    .from('food_ambiguous_candidates')
    .select('term, food_id')
    .order('term');
  console.log('Ambiguous candidates:', ambCandidates?.map(c => `${c.term} -> food_id ${c.food_id}`).join(', '));
}

async function queryMemory() {
  console.log('\n=== 4. User meal memory for user', TEST_USER_ID, '===');
  
  const { data: memory, error } = await supabase
    .from('user_meal_memory')
    .select('normalized_text, items')
    .eq('user_id', TEST_USER_ID);
  
  if (error) {
    console.error('Error fetching memory:', error);
    return;
  }
  
  if (!memory || memory.length === 0) {
    console.log('No memory entries found');
    return;
  }
  
  const foodIds = new Set();
  memory.forEach(m => {
    console.log(`  Text: ${m.normalized_text}`);
    m.items?.forEach(item => {
      console.log(`    - food_id: ${item.food_id}, input: ${item.input_term}`);
      foodIds.add(item.food_id);
    });
  });
  
  console.log(`\nMemory food_ids: ${Array.from(foodIds).join(', ')}`);
  return foodIds;
}

async function recommendFood() {
  console.log('\n=== 5. Recommendation ===');
  
  // Get all oil_included foods
  const { data: foods } = await supabase
    .from('foods')
    .select('id, canonical_name, category, is_ambiguous, oil_included')
    .eq('oil_included', true);
  
  // Get memory food_ids
  const { data: memory } = await supabase
    .from('user_meal_memory')
    .select('items')
    .eq('user_id', TEST_USER_ID);
  
  const memoryFoodIds = new Set();
  memory?.forEach(m => {
    m.items?.forEach(item => memoryFoodIds.add(item.food_id));
  });
  
  // Get ambiguous food_ids from candidates
  const { data: ambCandidates } = await supabase
    .from('food_ambiguous_candidates')
    .select('food_id');
  
  const ambiguousFoodIds = new Set(ambCandidates?.map(c => c.food_id) || []);
  
  // Filter: oil_included=true, non-ambiguous, no memory
  const candidates = foods?.filter(f => 
    f.oil_included === true &&
    !f.is_ambiguous &&
    !memoryFoodIds.has(f.id) &&
    !ambiguousFoodIds.has(f.id)
  ) || [];
  
  console.log(`\nCandidate foods (oil_included=true, non-ambiguous, no memory): ${candidates.length}`);
  candidates.forEach(f => {
    console.log(`  RECOMMENDED: id=${f.id}, name="${f.canonical_name}", category=${f.category}`);
  });
  
  if (candidates.length === 0) {
    console.log('No perfect candidates. Relaxing non-ambiguous requirement...');
    const relaxed = foods?.filter(f => 
      f.oil_included === true &&
      !memoryFoodIds.has(f.id)
    ) || [];
    relaxed.forEach(f => {
      console.log(`  Alternative: id=${f.id}, name="${f.canonical_name}", category=${f.category}, ambiguous=${f.is_ambiguous}`);
    });
  }
}

async function main() {
  await queryFoods();
  await queryMemory();
  await recommendFood();
}

main().catch(console.error);