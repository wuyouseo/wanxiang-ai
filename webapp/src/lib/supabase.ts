import { createClient } from "@supabase/supabase-js";

// Cloud sync is optional: the app must still boot (and work in local-only
// mode) if these env vars aren't set yet, e.g. a fresh clone before .env.local
// is filled in, or a deploy where the platform env vars haven't been added.
// Every call site that touches Supabase checks `isSupabaseConfigured` first,
// so the placeholder client below is never actually asked to make a request.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder-anon-key");
