"use client";

import { useEffect, useRef, useState } from "react";

type Notif = { amount: string; from: string; color: string };

const POOL: Notif[] = [
  { amount: "29,90 €", from: "****@gmail.com", color: "#4C6FFF" },
  { amount: "59,90 €", from: "****@outlook.fr", color: "#7B6EF6" },
  { amount: "14,90 €", from: "****@gmail.com", color: "#4C6FFF" },
  { amount: "29,90 €", from: "****@icloud.com", color: "#7B6EF6" },
  { amount: "14,90 €", from: "****@yahoo.fr", color: "#4C6FFF" },
  { amount: "59,90 €", from: "****@gmail.com", color: "#7B6EF6" },
  { amount: "29,90 €", from: "****@hotmail.fr", color: "#4C6FFF" },
  { amount: "29,90 €", from: "****@proton.me", color: "#7B6EF6" },
  { amount: "14,90 €", from: "****@outlook.fr", color: "#4C6FFF" },
  { amount: "59,90 €", from: "****@icloud.com", color: "#7B6EF6" },
];

const AGES = [
  "maintenant",
  "il y a 2 min",
  "il y a 9 min",
  "il y a 24 min",
  "il y a 1 h",
  "il y a 2 h",
  "il y a 3 h",
  "il y a 5 h",
];

const MAX_VISIBLE = AGES.length;
const INTERVAL_MS = 2600;

const make = (id: number) => ({ id, ...POOL[id % POOL.length] });

export function PhoneMockup() {
  const [items, setItems] = useState(() => [make(2), make(1), make(0)]);
  const nextId = useRef(3);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      const id = nextId.current++;
      setItems((prev) => [make(id), ...prev].slice(0, MAX_VISIBLE));
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="phone" aria-hidden="true">
      <span className="phone-btn" style={{ left: "-0.6cqw", top: "24cqw", height: "5cqw" }} />
      <span className="phone-btn" style={{ left: "-0.6cqw", top: "34cqw", height: "9cqw" }} />
      <span className="phone-btn" style={{ left: "-0.6cqw", top: "45cqw", height: "9cqw" }} />
      <span className="phone-btn" style={{ right: "-0.6cqw", top: "38cqw", height: "15cqw" }} />

      <div className="phone-body">
        <div className="phone-bezel">
          <div className="phone-screen">
            <div className="phone-notch" />

            <div className="phone-status">
              <span>9:41</span>
              <span className="phone-status-icons">
                <svg viewBox="0 0 16 10" style={{ width: "3.6cqw", height: "auto" }}>
                  <rect x="0" y="6" width="2.4" height="4" rx="0.5" fill="#F5F6F8" />
                  <rect x="3.6" y="4" width="2.4" height="6" rx="0.5" fill="#F5F6F8" />
                  <rect x="7.2" y="2" width="2.4" height="8" rx="0.5" fill="#F5F6F8" />
                  <rect x="10.8" y="0" width="2.4" height="10" rx="0.5" fill="#F5F6F8" />
                </svg>
                <svg viewBox="0 0 14 10" style={{ width: "3.6cqw", height: "auto" }}>
                  <path d="M1 4 Q7 -1 13 4" stroke="#F5F6F8" strokeWidth="1.4" fill="none" />
                  <path d="M3.3 6.3 Q7 3 10.7 6.3" stroke="#F5F6F8" strokeWidth="1.4" fill="none" />
                  <circle cx="7" cy="8.5" r="1" fill="#F5F6F8" />
                </svg>
                <svg viewBox="0 0 22 11" style={{ width: "5.6cqw", height: "auto" }}>
                  <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="#F5F6F8" fill="none" />
                  <rect x="2" y="2" width="14" height="7" rx="1" fill="#F5F6F8" />
                  <rect x="19" y="3.2" width="1.8" height="4.6" rx="0.8" fill="#F5F6F8" />
                </svg>
              </span>
            </div>

            <div className="phone-lock">
              <svg viewBox="0 0 12 16" fill="none" stroke="#F5F6F8" strokeWidth="1.6">
                <rect x="1.5" y="7" width="9" height="8" rx="1.8" fill="#F5F6F8" stroke="none" />
                <path d="M3.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
              <div className="phone-time">9:41</div>
            </div>

            <div className="phone-feed">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="notif-wrap"
                  style={
                    item.id < 3
                      ? ({ "--delay": `${0.1 + (2 - item.id) * 0.25}s` } as React.CSSProperties)
                      : undefined
                  }
                >
                  <div>
                    <div className="notif-card">
                      <div className="notif-icon" style={{ background: item.color }}>
                        S
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="notif-head">
                          <span className="notif-app">Stripe</span>
                          <span className="notif-when">{AGES[i]}</span>
                        </div>
                        <div className="notif-body">
                          Paiement reçu : <strong>{item.amount}</strong> de {item.from}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="phone-home" />
          </div>
        </div>
      </div>
    </div>
  );
}
