"use client";

import { useEffect, useState } from "react";

const items = [
  "2.847 pedidos processados hoje",
  "R$ 1.2M faturado este mês",
  "340 creators ativos",
  "99.7% uptime checkout",
  "12.4s tempo médio de resposta do agente",
  "847 automações disparadas esta semana",
];

function MarqueeTrack({ hidden }: { hidden?: boolean }) {
  return (
    <span className="marquee-content" aria-hidden={hidden || undefined}>
      {items.map((text, i) => (
        <span key={i}>
          <span className="marquee-diamond">{"\u25c6"}</span>
          {"\u00a0\u00a0"}
          {text}
          {"\u00a0\u00a0\u00a0\u00a0"}
        </span>
      ))}
    </span>
  );
}

export function TransitionBand() {
  const [scrollSpeed, setScrollSpeed] = useState(1);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = Math.abs(currentScrollY - lastScrollY);
      setScrollSpeed(1 + diff * 0.05);
      lastScrollY = currentScrollY;

      // Decay speed
      setTimeout(() => setScrollSpeed(1), 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="marquee-band"
      role="marquee"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 15%, black 85%, transparent)",
      }}
    >
      <div
        className="marquee-track"
        style={{
          animationDuration: `${45 / scrollSpeed}s`,
        }}
      >
        <MarqueeTrack />
        <MarqueeTrack hidden />
      </div>
    </div>
  );
}
