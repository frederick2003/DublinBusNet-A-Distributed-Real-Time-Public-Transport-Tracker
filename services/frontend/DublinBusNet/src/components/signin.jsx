import React, { useState } from "react";
import "./signin.css";

export default function SignInPanel({ mode, setMode, close }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const Header = ({ title }) => (
    <div className="signin-header">
      <div className="signin-title">{title}</div>
      <button className="signin-close" onClick={close} aria-label="Close sign in">
        ×
      </button>
    </div>
  );

  if (mode === "choice") {
    return (
      <div className="signin-container">
        <Header title="Welcome" />
        <div className="signin-buttons">
          <button
            className="signin-btn"
            onClick={() => {
              console.log("User wants to sign in");
              setMode("signin");
            }}
          >
            Sign In
          </button>

          <button
            className="guest-btn"
            onClick={() => {
              console.log("User wants to continue as guest");
              close();
            }}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  if (mode === "signin") {
    return (
      <div className="signin-container">
        <Header title="Sign in" />
        <div className="signin-form">
          <input
            className="signin-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="signin-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="signin-btn"
            onClick={() => {
              console.log("Submitting sign-in:", { email, password });
              close();
            }}
          >
            Submit
          </button>

          <button className="guest-btn" onClick={close}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return null;
}
