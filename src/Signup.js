import { useState } from "react";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "./firebase";
import "./Auth.css";

export default function Signup({ onSignupSuccess }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleSignup = async (e) => {
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
        <h2>Create Account</h2>

        {error && <p className="error">{error}</p>}

        {linkSent ? (
          <div className="success-message">
            <p>✓ Confirmation link sent!</p>
            <p className="helper-text">Check your email and click the link to create your account.</p>
            <button
              type="button"
              className="reset-link"
              onClick={() => setLinkSent(false)}
            >
              Use different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending link..." : "Send Signup Link"}
            </button>
          </form>
        )}

        <p>
          Already have an account?{" "}
          <a href="/login" className="link">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
