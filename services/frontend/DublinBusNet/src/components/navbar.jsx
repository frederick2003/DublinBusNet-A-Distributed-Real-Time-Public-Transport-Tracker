import React from "react";
import "./navbar.css";

export default function Navbar() {
  return (
    <header className="nav-shell">
      <div className="nav-brand">Dublin Bus Net</div>
      <nav className="nav-links">
        <a href="/">Home</a>
        <a href="/about.html">About</a>
        <a href="/contact.html">Contact</a>
      </nav>
    </header>
  );
}
