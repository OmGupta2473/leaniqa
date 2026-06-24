import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hevkurreqyubqvpykisf.supabase.co';
const supabaseKey = 'sb_publishable_R6vq-kdzZeycXhspWZ5_QQ_zaPDm389'; // Dummy/user provided key

export const supabase = createClient(supabaseUrl, supabaseKey);
