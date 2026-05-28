import { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "./firebase";
import "./Auth.css";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.origin,
        handleCodeInApp: true,
      });
      window.localStorage.setItem("emailForSignIn", email);
      setLinkSent(true);
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Taskify</h1>
        <h2>Login</h2>

        {error && <p className="error">{error}</p>}

        {linkSent ? (
          <div className="success-message">
            <p>✓ Check your email for the login link!</p>
            <p className="helper-text">Click the link to sign in to Taskify.</p>
            <button
              type="button"
              className="reset-link"
              onClick={() => setLinkSent(false)}
            >
              Send to different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending link..." : "Send Login Link"}
            </button>
          </form>
        )}

        <p>
          Don't have an account?{" "}
          <a href="/signup" className="link">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
