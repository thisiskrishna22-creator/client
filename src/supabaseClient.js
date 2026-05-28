import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://acekzkgjclokxyckxeny.supabase.co";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim() || "";

export const supabaseKey = supabaseAnonKey;
export const supabaseUrl = SUPABASE_URL;
export const supabase = supabaseAnonKey
  ? createClient(SUPABASE_URL, supabaseAnonKey)
  : null;
