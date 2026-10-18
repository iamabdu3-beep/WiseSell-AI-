import { supabase } from "./supabase.js";
import { registerUser, signInUser, signOutUser, watchAuthChanges } from "./auth.js";
import { callWiseSellAI } from "./supabase.js";
import "./styles.css";

const app = document.querySelector("#app");
let currentUser = null;
let mode = "signin";

const esc = (value = "") => String(value).replace(/[&<>"']/g, (ch) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));

function showMessage(text, isError = false) {
  const box = document.querySelector("#message");
  if (!box) return;
  box.textContent = text;
  box.className = `message ${isError ? "error" : "success"}`;
}

function renderAuth() {
  app.innerHTML = `
    <main class="auth-layout">
      <section class="brand-panel">
        <div class="brand-mark">W</div>
        <p class="eyebrow">BUSINESS GROWTH, SIMPLIFIED</p>
        <h1>Make smarter moves with <span>WiseSell AI.</span></h1>
        <p class="muted">Sales insights, expense tracking, and marketing assistance for businesses in Ethiopia and East Africa.</p>
        <div class="feature-pills"><span>Sales & expenses</span><span>AI assistant</span><span>Marketing drafts</span></div>
      </section>
      <section class="auth-card">
        <div class="mobile-brand"><span class="brand-mark small">W</span><strong>WiseSell AI</strong></div>
        <h2>${mode === "signin" ? "Welcome back" : "Create your account"}</h2>
        <p class="muted">${mode === "signin" ? "Sign in to continue to your workspace." : "Start building a clearer picture of your business."}</p>
        <form id="auth-form">
          ${mode === "signup" ? '<label>Business name (optional)<input name="businessName" autocomplete="organization" placeholder="Your business name"></label>' : ""}
          <label>Email address<input name="email" type="email" autocomplete="email" required placeholder="you@example.com"></label>
          <label>Password<input name="password" type="password" autocomplete="${mode === "signin" ? "current-password" : "new-password"}" minlength="6" required placeholder="At least 6 characters"></label>
          <button class="primary full" type="submit">${mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        <div id="message" class="message" aria-live="polite"></div>
        <p class="switch">${mode === "signin" ? "New to WiseSell AI?" : "Already have an account?"}
          <button id="switch-mode" class="text-button">${mode === "signin" ? "Create account" : "Sign in"}</button>
        </p>
        <p class="tiny">Authentication is handled by your configured Supabase project.</p>
      </section>
    </main>`;

  document.querySelector("#switch-mode").addEventListener("click", () => {
    mode = mode === "signin" ? "signup" : "signin";
    renderAuth();
  });

  document.querySelector("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const button = event.currentTarget.querySelector("button[type=submit]");
    button.disabled = true;
    button.textContent = "Please wait…";
    try {
      if (!supabase) throw new Error("Supabase is not configured yet. Set the environment variables described in README.md.");
      if (mode === "signin") {
        await signInUser(email, password);
        showMessage("Signed in successfully.");
      } else {
        const result = await registerUser(email, password);
        showMessage(result.message);
        if (!result.session) return;
      }
    } catch (error) {
      showMessage(error.message || "Something went wrong.", true);
    } finally {
      button.disabled = false;
      button.textContent = mode === "signin" ? "Sign in" : "Create account";
    }
  });
}

function renderDashboard() {
  app.innerHTML = `
    <div class="dashboard">
      <aside class="sidebar">
        <div class="sidebar-brand"><span class="brand-mark small">W</span><strong>WiseSell <span>AI</span></strong></div>
        <p class="nav-label">WORKSPACE</p>
        <a class="nav-item active" href="#overview">▦ &nbsp; Overview</a>
        <a class="nav-item" href="#transactions">↔ &nbsp; Sales & expenses</a>
        <a class="nav-item" href="#assistant">✦ &nbsp; AI assistant</a>
        <a class="nav-item" href="#marketing">◈ &nbsp; AI marketing</a>
        <div class="sidebar-bottom"><small>Signed in as</small><div class="user-email">${esc(currentUser?.email)}</div><button id="signout" class="secondary full">Sign out</button></div>
      </aside>
      <main class="main-content">
        <header class="topbar"><div><p class="eyebrow">BUSINESS OVERVIEW</p><h1>Your workspace</h1></div><div class="avatar">${esc((currentUser?.email || "W").slice(0,1).toUpperCase())}</div></header>
        <section class="welcome-card"><div><p class="eyebrow light">WELCOME TO WISESELL AI</p><h2>Turn business activity into better decisions.</h2><p>Connect your business data and use AI tools to find your next opportunity.</p></div><div class="welcome-symbol">✦</div></section>
        <section class="metric-grid">
          <article class="metric"><span>Total sales</span><strong>—</strong><small>Connect transaction data to calculate</small></article>
          <article class="metric"><span>Total expenses</span><strong>—</strong><small>Connect transaction data to calculate</small></article>
          <article class="metric"><span>Net profit</span><strong>—</strong><small>Sales minus expenses</small></article>
        </section>
        <section class="tool-grid">
          <article class="tool-card" id="assistant"><div class="tool-icon">✦</div><p class="eyebrow">AI BUSINESS ASSISTANT</p><h3>Ask about your business</h3><p class="muted">Ask questions about sales, costs, and business performance. Requires a configured backend and business profile.</p><form id="assistant-form"><label>Your question<textarea name="question" required rows="3" placeholder="How can I improve my monthly profit?"></textarea></label><button class="primary" type="submit">Ask WiseSell AI</button></form><div id="assistant-result" class="result-box">Your answer will appear here.</div></article>
          <article class="tool-card" id="marketing"><div class="tool-icon">↗</div><p class="eyebrow">AI SALES & MARKETING</p><h3>Create a campaign draft</h3><p class="muted">Generate promotional copy for social platforms. This starter does not publish posts automatically.</p><form id="marketing-form"><label>Product or service<input name="product_or_service" required placeholder="e.g. Coffee products"></label><label>Target audience<input name="target_audience" required placeholder="e.g. Local retailers"></label><label>Offer or key message<input name="offer" placeholder="e.g. New customer discount"></label><label>Platform<select name="platform"><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="telegram">Telegram</option><option value="whatsapp">WhatsApp</option><option value="tiktok">TikTok</option><option value="linkedin">LinkedIn</option><option value="twitter">X (Twitter)</option></select></label><button class="primary" type="submit">Generate draft</button></form><div id="marketing-result" class="result-box">Your campaign draft will appear here.</div></article>
        </section>
        <p class="footer-note">WiseSell AI starter • Secure your Supabase project with Row Level Security policies before storing business data.</p>
      </main>
    </div>`;

  document.querySelector("#signout").addEventListener("click", async () => {
    try { await signOutUser(); } catch (e) { alert(e.message); }
  });

  document.querySelector("#assistant-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const out = document.querySelector("#assistant-result");
    out.textContent = "Working…";
    try {
      const question = new FormData(event.currentTarget).get("question");
      const result = await callWiseSellAI("wisesell-business-assistant", { question });
      out.textContent = result.answer || JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message || "Unable to reach the AI assistant.";
    }
  });

  document.querySelector("#marketing-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const out = document.querySelector("#marketing-result");
    out.textContent = "Working…";
    try {
      const fd = new FormData(event.currentTarget);
      const result = await callWiseSellAI("wisesell-ai-marketing", {
        product_or_service: fd.get("product_or_service"),
        target_audience: fd.get("target_audience"),
        offer: fd.get("offer"),
        goal: "sales",
        tone: "friendly and professional",
        language: "en",
        platforms: [fd.get("platform")]
      });
      out.textContent = result.content || result.draft || JSON.stringify(result, null, 2);
    } catch (e) {
      out.textContent = e.message || "Unable to generate the marketing draft.";
    }
  });
}

function render() {
  if (currentUser) renderDashboard();
  else renderAuth();
}

if (supabase) {
  watchAuthChanges((user) => {
    currentUser = user;
    render();
  });
  supabase.auth.getUser().then(({ data, error }) => {
    if (error) console.warn(error.message);
    currentUser = data?.user ?? null;
    render();
  });
} else {
  renderAuth();
}