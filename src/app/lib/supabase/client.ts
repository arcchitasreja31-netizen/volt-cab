import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Supabase URL or publishable key is missing.");
}

console.log("Supabase URL loaded:", Boolean(supabaseUrl));
console.log("Supabase publishable key loaded:", Boolean(supabasePublishableKey));

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);