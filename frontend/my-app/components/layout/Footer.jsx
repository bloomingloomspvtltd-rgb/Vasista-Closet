"use client";

import { useState } from "react";

export default function Footer() {
  const [openSections, setOpenSections] = useState({
    resources: false,
    quick: false,
    follow: false,
    contact: false,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-top">
          {/* RESOURCES */}
          <div className="footer-section">
            <h3 
              className="footer-header" 
              onClick={() => toggleSection("resources")}
            >
              RESOURCES
              <span className={`dropdown-icon ${openSections.resources ? "active" : ""}`}>▼</span>
            </h3>
            <ul className={`footer-menu ${openSections.resources ? "open" : ""}`}>
              <li><a href="/products/coordsets">Coord Sets</a></li>
              <li><a href="/products/kurtas">Kurtas</a></li>
            </ul>
          </div>

          {/* QUICK LINKS */}
          <div className="footer-section">
            <h3 
              className="footer-header" 
              onClick={() => toggleSection("quick")}
            >
              QUICK LINKS
              <span className={`dropdown-icon ${openSections.quick ? "active" : ""}`}>▼</span>
            </h3>
            <ul className={`footer-menu ${openSections.quick ? "open" : ""}`}>
              <li><a href="/about">About Us</a></li>
              <li><a href="/blog">Blog</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* FOLLOW US */}
          <div className="footer-section">
            <h3 
              className="footer-header" 
              onClick={() => toggleSection("follow")}
            >
              FOLLOW US
              <span className={`dropdown-icon ${openSections.follow ? "active" : ""}`}>&#x25BC;</span>
            </h3>
            <div className={`social-links ${openSections.follow ? "open" : ""}`}>
              <a
                href="https://www.instagram.com/visista_closet/?hl=en"
                title="Instagram"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  className="social-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    d="M16.5 3h-9A4.5 4.5 0 0 0 3 7.5v9A4.5 4.5 0 0 0 7.5 21h9a4.5 4.5 0 0 0 4.5-4.5v-9A4.5 4.5 0 0 0 16.5 3Zm3 13.5a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 7.25A4.75 4.75 0 1 0 16.75 12 4.75 4.75 0 0 0 12 7.25Zm0 8A3.25 3.25 0 1 1 15.25 12 3.25 3.25 0 0 1 12 15.25Z"
                    fill="currentColor"
                  />
                  <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>

          {/* CONTACT US */}
          <div className="footer-section">
            <h3 
              className="footer-header" 
              onClick={() => toggleSection("contact")}
            >
              CONTACT US
              <span className={`dropdown-icon ${openSections.contact ? "active" : ""}`}>▼</span>
            </h3>
            <div className={`contact-details ${openSections.contact ? "open" : ""}`}>
              <p>Phone: <a href="tel:+918374845641">+91 8374845641</a></p>
              <p>Email: <a href="mailto:bloomingloomspvtltd@gmail.com">bloomingloomspvtltd@gmail.com</a></p>
              <p>Working Hours: 10:30 AM – 6:00 PM</p>
              <p>Mon to Sat</p>
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="footer-bottom">
        <p className="copyright">© 2026 Visista. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
