import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "WiseSell AI: Configure your Supabase environment variables."
  );
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export async function getCurrentUser() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;

  return data.user;
}

export async function signOut() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function callWiseSellAI(
  functionName,
  requestData
) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data: sessionData } =
    await supabase.auth.getSession();

  if (!sessionData.session) {
    throw new Error("Please sign in to use WiseSell AI.");
  }

  const { data, error } = await supabase.functions.invoke(
    functionName,
    {
      body: requestData
    }
  );

  if (error) throw error;

  return data;
}
