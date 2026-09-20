"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** System tray: decorative status icons plus a live clock. */
export function SystemTray() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="tray">
      <div
        className="tray-icon"
        aria-hidden="true"
        title="PHP Academy tray"
        style={{ fontSize: 12, fontStyle: "italic", fontWeight: 800 }}
      >
        php
      </div>
      <div className="tray-icon" aria-hidden="true" title="Network (coming soon)">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M1.5 12.5 C3 10.5 13 10.5 14.5 12.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M3.5 15 C5 13 11 13 12.5 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="tray-clock" role="timer" aria-label="Current time">
        <div>{formatTime(now)}</div>
        <div>{formatDate(now)}</div>
      </div>
    </div>
  );
}