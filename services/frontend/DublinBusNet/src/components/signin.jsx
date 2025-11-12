import React from "react";
import "./signin.css";

export default function SignInPanel() {
  const handleSignIn = () => {
    console.log("User wants to sign in");
  };

  const handleGuest = () => {
    console.log("User wants to continue as guest");
  };

  return (
    <div className="signin-container">
      <div className="signin-buttons">
        <button className="signin-btn" onClick={handleSignIn}>
          Sign In
        </button>
        <button className="guest-btn" onClick={handleGuest}>
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
