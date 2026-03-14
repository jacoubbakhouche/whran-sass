import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hswctqluqtrlmxymepce.supabase.co';
const supabaseAnonKey = 'sb_publishable_wecrEujeNBWyw8OH2Clfgw_ZIkHoJT2';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
