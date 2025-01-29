import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqonxznqsocuayvrcmdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlxb254em5xc29jdWF5dnJjbWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc4NDgzNjgsImV4cCI6MjA1MzQyNDM2OH0.LsYdvmm-swAU13KJvWIe9kkFkE_69gREqlbElkmQiQY';

export const supabase = createClient(supabaseUrl, supabaseKey);
