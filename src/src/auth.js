import { supabase } from "./supabase.js";

function checkSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Check your environment variables."
    );
  }
}

export async function registerUser(email, password) {
  checkSupabase();

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password
  });

  if (error) throw error;

  return {
    user: data.user,
    session: data.session,
    message: data.session
      ? "Registration successful."
      : "Check your email to confirm your account."
  };
}

export async function signInUser(email, password) {
  checkSupabase();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

  if (error) throw error;

  return data;
}

export async function signOutUser() {
  checkSupabase();

  const { error } = await supabase.auth.signOut();

  if (error) throw error;

  return { message: "You have signed out successfully." };
}

export function watchAuthChanges(callback) {
  checkSupabase();

  const { data } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      callback(session?.user ?? null);
    }
  );

  return () => data.subscription.unsubscribe();
}
