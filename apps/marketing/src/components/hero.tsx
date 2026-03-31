"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 120;
const SPARK_ELIGIBLE_RATIO = 0.15;
const CURSOR_RADIUS = 130;
const MAX_SPEED = 0.64; // -20% from 0.8

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  glowRadius: number;
  opacity: number;
  pulsePhase: number;
  pulseSpeed: number;
  type: "cool" | "warm";
  sparkEligible: boolean;
  sparkTimer: number;
  sparkFrame: number;
  sparking: boolean;
  sparkOpacityBoost: number;
  sparkGlowBoost: number;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    const mouse = { x: -9999, y: -9999 };
    let particles: Particle[] = [];
    let rafId = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.parentElement!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      canvas!.style.width = W + "px";
      canvas!.style.height = H + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticle(atBottom: boolean): Particle {
      const sparkEligible = Math.random() < SPARK_ELIGIBLE_RATIO;
      const baseRadius = rand(0.8, 2.8);
      return {
        x: rand(0, W),
        y: atBottom ? rand(H * 0.8, H + 20) : rand(0, H),
        vx: rand(-0.096, 0.096),
        vy: rand(-0.096, 0.096),
        baseRadius,
        glowRadius: baseRadius * 7,
        opacity: rand(0.25, 0.75),
        pulsePhase: rand(0, Math.PI * 2),
        pulseSpeed: rand(0.0064, 0.0144),
        type: Math.random() < 0.8 ? "cool" : "warm",
        sparkEligible,
        sparkTimer: sparkEligible ? Math.random() * 600 : Infinity,
        sparkFrame: 0,
        sparking: false,
        sparkOpacityBoost: 0,
        sparkGlowBoost: 1,
      };
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(makeParticle(false));
      }
    }

    function respawn(p: Particle) {
      p.x = rand(0, W);
      p.y = H + rand(2, 20);
      p.vx = rand(-0.096, 0.096);
      p.vy = rand(0.032, 0.064);
      p.opacity = rand(0.25, 0.75);
      p.pulsePhase = rand(0, Math.PI * 2);
      p.sparking = false;
      p.sparkFrame = 0;
      p.sparkOpacityBoost = 0;
      p.sparkGlowBoost = 1;
      if (p.sparkEligible) {
        p.sparkTimer = 400 + Math.random() * 400;
      }
    }

    function updateSpark(p: Particle) {
      if (!p.sparkEligible) return;
      if (!p.sparking) {
        p.sparkTimer--;
        if (p.sparkTimer <= 0) {
          p.sparking = true;
          p.sparkFrame = 0;
        }
        return;
      }
      p.sparkFrame++;
      if (p.sparkFrame <= 8) {
        const t = p.sparkFrame / 8;
        p.sparkOpacityBoost = t;
        p.sparkGlowBoost = 1 + t;
      } else if (p.sparkFrame <= 20) {
        const t = (p.sparkFrame - 8) / 12;
        p.sparkOpacityBoost = 1 - t;
        p.sparkGlowBoost = 2 - t;
      } else {
        p.sparking = false;
        p.sparkFrame = 0;
        p.sparkOpacityBoost = 0;
        p.sparkGlowBoost = 1;
        p.sparkTimer = 400 + Math.random() * 400;
      }
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.pulsePhase += p.pulseSpeed;
        const pulseFactor = 0.85 + 0.15 * Math.sin(p.pulsePhase);
        const r = p.baseRadius * pulseFactor;

        updateSpark(p);
        const displayOpacity = Math.min(
          1,
          p.opacity + p.sparkOpacityBoost * (1 - p.opacity)
        );
        const displayGlowRadius = p.glowRadius * p.sparkGlowBoost;

        // Cursor attraction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CURSOR_RADIUS && dist > 0) {
          p.vx += (dx / dist) * 0.025;
          p.vy += (dy / dist) * 0.025;
        }

        // Upward bias -20%
        p.vy -= 0.0048;

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > MAX_SPEED) {
          const scale = MAX_SPEED / speed;
          p.vx *= scale;
          p.vy *= scale;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > W) { p.x = W; p.vx *= -1; }

        if (p.y < -20) {
          respawn(p);
          continue;
        }

        // Glow halo
        const grd = ctx!.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, displayGlowRadius
        );
        if (p.type === "cool") {
          grd.addColorStop(0, `rgba(232,234,240,${displayOpacity * 0.18})`);
          grd.addColorStop(1, `rgba(232,234,240,0)`);
        } else {
          grd.addColorStop(0, `rgba(255,245,220,${displayOpacity * 0.14})`);
          grd.addColorStop(1, `rgba(255,245,220,0)`);
        }
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, displayGlowRadius, 0, Math.PI * 2);
        ctx!.fillStyle = grd;
        ctx!.fill();

        // Core dot
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx!.fillStyle =
          p.type === "cool"
            ? `rgba(240,242,248,${displayOpacity})`
            : `rgba(255,248,230,${displayOpacity * 0.8})`;
        ctx!.fill();
      }
    }

    function loop() {
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function onMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!prefersReducedMotion) {
      resize();
      initParticles();
      loop();

      const handleResize = () => {
        resize();
        for (const p of particles) {
          if (p.x > W) p.x = rand(0, W);
          if (p.y > H) p.y = rand(0, H);
        }
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseleave", onMouseLeave);

      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseleave", onMouseLeave);
      };
    }
  }, []);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#07080B",
      }}
    >
      {/* Lumens canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          display: "block",
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, #07080B 90%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "0 clamp(24px, 6vw, 96px)",
          maxWidth: "880px",
          width: "100%",
        }}
      >
        <p
          className="animate-fade-up-1"
          style={{
            fontFamily: "var(--font)",
            fontWeight: 400,
            fontSize: "12px",
            letterSpacing: "0.02em",
            color: "#3A3F4C",
            textTransform: "uppercase",
            marginBottom: "56px",
          }}
        >
          Ambaril
        </p>

        <h1
          className="animate-fade-up-2"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: "clamp(38px, 5vw, 64px)",
            letterSpacing: "-0.026em",
            lineHeight: 1.06,
            color: "#E8EAF0",
            maxWidth: "680px",
            textWrap: "balance",
            marginBottom: "24px",
          }}
        >
          O primeiro sistema que opera seu e-commerce, não só mostra.
        </h1>

        <p
          className="animate-fade-up-3"
          style={{
            fontFamily: "var(--font)",
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: 1.7,
            color: "#7C8293",
            maxWidth: "460px",
            marginBottom: "40px",
          }}
        >
          Enquanto ferramentas te mostram o problema, ele já está resolvendo.{" "}
          <span className="invite-badge">invite-only</span>
        </p>

        <div
          className="animate-fade-up-4"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#3A3F4C",
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span>Drop War Room</span>
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "#3A3F4C",
              margin: "0 10px",
              flexShrink: 0,
              position: "relative",
              top: "-1px",
            }}
          />
          <span>Creators com atribuição</span>
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: "3px",
              height: "3px",
              borderRadius: "50%",
              background: "#3A3F4C",
              margin: "0 10px",
              flexShrink: 0,
              position: "relative",
              top: "-1px",
            }}
          />
          <span>PCP integrado</span>
        </div>
      </div>
    </section>
  );
}
