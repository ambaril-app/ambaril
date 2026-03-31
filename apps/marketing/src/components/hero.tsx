"use client";

import { useEffect, useRef } from "react";

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    // Assign to local non-nullable refs so closures can access them safely
    const canvasEl: HTMLCanvasElement = canvas;
    const sectionEl: HTMLElement = section;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const PARTICLE_COUNT = 200;
    const CONNECTION_DIST = 130;
    const REPULSION_RADIUS = 100;
    const REPULSION_FORCE = 0.5;
    const GRAVITY_RADIUS = 200;
    const GRAVITY_FORCE = 0.002;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      radius: number; opacity: number;
    };

    let W = 0, H = 0;
    let cursor = { x: -9999, y: -9999 };
    let particles: Particle[] = [];

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function init() {
      const rect = sectionEl.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvasEl.width = W;
      canvasEl.height = H;
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.2, 0.2),
        vy: rand(-0.2, 0.2),
        radius: rand(0.5, 1.2),
        opacity: rand(0.2, 0.5),
      }));
    }

    const tick = () => {
      const cx = W / 2;
      const cy = H / 2;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > H) { p.y = H; p.vy *= -1; }

        // Cursor repulsion
        const dx = p.x - cursor.x;
        const dy = p.y - cursor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPULSION_RADIUS && dist > 0) {
          const force = ((REPULSION_RADIUS - dist) / REPULSION_RADIUS) * REPULSION_FORCE;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        // Center gravity
        const gx = cx - p.x;
        const gy = cy - p.y;
        const gd = Math.sqrt(gx * gx + gy * gy);
        if (gd < GRAVITY_RADIUS && gd > 0) {
          const gf = GRAVITY_FORCE * (gd / GRAVITY_RADIUS);
          p.x += gx * gf;
          p.y += gy * gf;
        }
      }

      ctx.clearRect(0, 0, W, H);

      // Cursor glow
      if (cursor.x > 0 && cursor.x < W) {
        const glow = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 80);
        glow.addColorStop(0, "rgba(168,174,187,0.03)");
        glow.addColorStop(1, "rgba(168,174,187,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cursor.x, cursor.y, 80, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connections
      ctx.lineWidth = 0.4;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]!;
          const b = particles[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DIST) {
            ctx.strokeStyle = `rgba(168,174,187,${(1 - d / CONNECTION_DIST) * 0.15})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168,174,187,${p.opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      const rect = sectionEl.getBoundingClientRect();
      cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { cursor = { x: -9999, y: -9999 }; };

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(rafRef.current);
        init();
        rafRef.current = requestAnimationFrame(tick);
      }, 150);
    };

    init();
    rafRef.current = requestAnimationFrame(tick);

    sectionEl.addEventListener("mousemove", onMove);
    sectionEl.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resizeTimer);
      sectionEl.removeEventListener("mousemove", onMove);
      sectionEl.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ background: "#07080B", minHeight: "100dvh", position: "relative", overflow: "hidden" }}
      aria-label="Hero"
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="hero-constellation"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          padding: "100px 24px 80px",
          textAlign: "center",
        }}
      >
        <p
          className="animate-fade-up-1"
          style={{
            fontFamily: "var(--font)",
            fontSize: "12px",
            fontWeight: 400,
            letterSpacing: "0.14em",
            color: "oklch(36% 0.018 220)",
            marginBottom: "56px",
          }}
        >
          Ambaril
        </p>

        <h1
          className="animate-fade-up-2"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(38px, 5vw, 64px)",
            fontWeight: 500,
            letterSpacing: "-0.026em",
            lineHeight: 1.06,
            color: "#E8EAF0",
            textWrap: "balance",
            margin: "0 0 24px",
            maxWidth: "680px",
          }}
        >
          O primeiro sistema que opera seu e-commerce, não só mostra.
        </h1>

        <p
          className="animate-fade-up-3"
          style={{
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: 1.7,
            color: "oklch(50% 0.018 220)",
            textWrap: "balance",
            maxWidth: "460px",
            margin: "0 auto 0",
          }}
        >
          Enquanto ferramentas te mostram o problema, ele já está resolvendo.{" "}
          <span className="invite-badge">invite-only</span>
        </p>

        <div
          className="animate-fade-up-4"
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginTop: "80px",
          }}
        >
          {["E-commerce DTC", "Multi-tenant", "Built by operators"].map((item, i) => (
            <>
              {i > 0 && (
                <span
                  key={`sep-${i}`}
                  style={{
                    width: "3px", height: "3px",
                    borderRadius: "50%",
                    background: "oklch(24% 0.015 220)",
                    flexShrink: 0,
                  }}
                />
              )}
              <span
                key={item}
                style={{
                  fontSize: "11px",
                  color: "oklch(32% 0.015 220)",
                  letterSpacing: "0.01em",
                }}
              >
                {item}
              </span>
            </>
          ))}
        </div>
      </div>
    </section>
  );
}
