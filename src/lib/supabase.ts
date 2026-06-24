import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hevkurreqyubqvpykisf.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_R6vq-kdzZeycXhspWZ5_QQ_zaPDm389';

export const supabase = createClient(supabaseUrl, supabaseKey);
