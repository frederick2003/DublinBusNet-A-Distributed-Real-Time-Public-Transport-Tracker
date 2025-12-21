import React from "react";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="footer-shell" id="contact">
      <div className="footer-brand">DublinBusNet</div>
      <div className="footer-links">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </div>
      <div className="footer-meta">Built for live bus tracking across Dublin.</div>
    </footer>
  );
}
