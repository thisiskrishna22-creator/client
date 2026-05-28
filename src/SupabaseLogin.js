import { useState, useEffect } from "react";
import { supabase, supabaseKey, supabaseUrl } from "./supabaseClient";
import "./SupabaseLogin.css";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SupabaseLogin() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    try {
      console.log("[Taskify] Supabase URL:", supabaseUrl);
      if (supabaseKey) {
        const masked = supabaseKey.length > 8 ? supabaseKey.slice(0, 8) + "..." : supabaseKey;
        console.log("[Taskify] Supabase key (masked):", masked);
      } else {
        console.log("[Taskify] Supabase key: (missing)");
      }
    } catch (e) {
      console.warn("[Taskify] Debug log failed", e);
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const missingKey = !supabaseKey || supabaseKey === "YOUR_PUBLISHABLE_KEY";
  const secretKeyUsed = supabaseKey?.startsWith("sb_secret_");
  const emailValid = emailRegex.test(email.trim());

  const login = async () => {
    if (!emailValid) {
      setStatus("Please enter a valid email address.");
      return;
    }

    if (!supabase) {
      setStatus("Supabase auth is not configured. Check your .env file.");
      return;
    }

    setBusy(true);
    setStatus("Sending your login link...");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setBusy(false);

    if (error) {
      console.error(error);
      const msg = (error.message || "").toString();
      const lowered = msg.toLowerCase();
      if (lowered.includes("invalid api key") || lowered.includes("api key")) {
        setStatus(
          "Invalid API key: update client/.env REACT_APP_SUPABASE_ANON_KEY with your project's anon/public key and restart the dev server."
        );
      } else if (lowered.includes("email rate limit exceeded") || lowered.includes("rate limit")) {
        setStatus(
          "Email rate limit exceeded. Please wait 60 seconds before trying again or use a different email address."
        );
        setCooldown(60);
      } else {
        setStatus(msg || "An unknown error occurred.");
      }
    } else {
      setStatus("Success! Check your email for the login link.");
      setEmail("");
      // Allow immediate retry after a successful send instead of forcing another wait.
      setCooldown(0);
    }
  };

  if (missingKey || secretKeyUsed) {
    return (
      <div className="sb-shell">
        <div className="sb-card">
          <div className="sb-brand">
            <div className="sb-logo">!</div>
            <div>
              <h2>Taskify Setup Required</h2>
              <p className="sb-tag">Supabase configuration is not finished.</p>
            </div>
          </div>

          <p className="sb-lead">
            {secretKeyUsed
              ? "You are using a protected Supabase secret key in the browser. Use the anon/public key instead."
              : "Your Supabase anon key is missing or still set to the placeholder."}
          </p>

          <div className="sb-form">
            <p className="sb-helper">
              Create or update the `client/.env` file with:
            </p>
            <pre className="sb-code">REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here</pre>
            <p className="sb-helper">
              Or copy the example from `.env.example` and restart the development server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sb-shell">
      <div className="sb-card">
        <div className="sb-brand">
          <div className="sb-logo">T</div>
          <div>
            <h2>Taskify</h2>
            <p className="sb-tag">Productivity made simple</p>
          </div>
        </div>

        <p className="sb-lead">Sign in with your email to continue to Taskify.</p>

        <div className="sb-form">
          <label className="sb-field">
            <span className="sb-label">Email address</span>
            <input
              className="sb-input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />
          </label>

          <button
            className="sb-primary"
            type="button"
            onClick={login}
            disabled={!emailValid || busy || cooldown > 0}
          >
            {busy ? "Sending..." : cooldown > 0 ? `Try again in ${cooldown}s` : "Send Login Link"}
          </button>

          <p className="sb-helper">
            {status || "You'll receive a magic link for passwordless sign-in."}
          </p>
        </div>

        <div className="sb-footer">
          <small>
            By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy</a>.
          </small>
        </div>
      </div>
    </div>
  );
}
