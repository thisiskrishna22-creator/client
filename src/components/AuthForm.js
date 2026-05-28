import { useState } from "react";
import { auth } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
} from "@firebase/auth";

const actionCodeSettings = {
  url: window.location.origin,
  handleCodeInApp: true,
};

export default function AuthForm() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const resetStatus = () => setStatus("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    resetStatus();

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem("taskifyEmailForSignIn", email);
        setStatus("A sign-in link was sent to your inbox.");
      }
    } catch (error) {
      setStatus(error.message || "Unable to complete authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome to Taskify</h1>
          <p>Sign in, track your tasks, and sync across devices.</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === "login" ? "tab active" : "tab"} onClick={() => setMode("login")}>Login</button>
          <button className={mode === "signup" ? "tab active" : "tab"} onClick={() => setMode("signup")}>Sign Up</button>
          <button className={mode === "emailLink" ? "tab active" : "tab"} onClick={() => setMode("emailLink")}>Email Link</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label">
            Email address
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </label>

          {mode !== "emailLink" && (
            <label className="field-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a strong password"
                required
              />
            </label>
          )}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Working…" : mode === "login" ? "Login" : mode === "signup" ? "Create Account" : "Send Email Link"}
          </button>

          <p className="auth-note">
            {mode === "emailLink"
              ? "A magic link will be sent to your email for quick sign-in."
              : "Use a strong password and keep it safe."}
          </p>

          {status && <p className="form-status">{status}</p>}
        </form>
      </div>
    </div>
  );
}
