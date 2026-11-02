"use client";

import { useEffect, useRef } from "react";

/**
 * Soft bowl-shaped sky-cyan glow (Halden-style).
 * Drawn on a tiny 96×60 canvas, CSS-stretched for smooth blur.
 * Scroll deepens/widens the bowl slightly; content sits above (z-index).
 */
export default function BowlGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const W = 96;
    const H = 60;
    canvas.width = W;
    canvas.height = H;

    const CORE = [0x8f, 0xd5, 0xf1]; // #8fd5f1
    const RIM = [0xd2, 0xda, 0xff]; // #d2daff
    const OUT = [0xfa, 0xfa, 0xfa]; // match site --background light

    // scroll keys (q = scrollY / innerHeight)
    const keys = [
      { q: 0, tip: 0.3, half: 0.34, soft: 0.22 },
      { q: 0.03, tip: 0.45, half: 0.38, soft: 0.26 },
      { q: 0.08, tip: 0.65, half: 0.38, soft: 0.22 },
      { q: 0.18, tip: 0.8, half: 0.38, soft: 0.22 },
      { q: 0.4, tip: 0.95, half: 0.38, soft: 0.19 },
      { q: 0.66, tip: 1.05, half: 0.46, soft: 0.16 },
      { q: 0.87, tip: 1.05, half: 0.66, soft: 0.13 },
      { q: 1.15, tip: 1.1, half: 0.9, soft: 0.1 },
      { q: 1.43, tip: 1.3, half: 1.6, soft: 0.1 },
      { q: 1.8, tip: 2.4, half: 3.0, soft: 0.1 },
    ];

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    function sampleKeys(q: number) {
      if (q <= keys[0].q) return { tip: keys[0].tip, half: keys[0].half, soft: keys[0].soft };
      if (q >= keys[keys.length - 1].q) {
        const k = keys[keys.length - 1];
        return { tip: k.tip, half: k.half, soft: k.soft };
      }
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i];
        const b = keys[i + 1];
        if (q >= a.q && q <= b.q) {
          const t = (q - a.q) / (b.q - a.q);
          return {
            tip: lerp(a.tip, b.tip, t),
            half: lerp(a.half, b.half, t),
            soft: lerp(a.soft, b.soft, t),
          };
        }
      }
      return { tip: keys[0].tip, half: keys[0].half, soft: keys[0].soft };
    }

    function smoothstep(x: number) {
      const t = Math.max(0, Math.min(1, x));
      return t * t * (3 - 2 * t);
    }

    function mix(a: number[], b: number[], t: number) {
      return [
        Math.round(lerp(a[0], b[0], t)),
        Math.round(lerp(a[1], b[1], t)),
        Math.round(lerp(a[2], b[2], t)),
      ];
    }

    // signed distance to bowl polyline
    function bowlSD(px: number, py: number, tip: number, half: number, aspect: number) {
      const segs = 48;
      let minD = 1e9;
      let prevX = half * aspect;
      let prevY = -0.3;
      for (let i = 1; i <= segs; i++) {
        const yy = -0.3 + (tip - -0.3) * (i / segs);
        const cx = half * aspect * Math.pow(Math.max(0, 1 - yy / tip), 0.72);
        const cy = yy;
        // distance to segment
        const dx = cx - prevX;
        const dy = cy - prevY;
        const len2 = dx * dx + dy * dy || 1e-8;
        let t = ((px - prevX) * dx + (py - prevY) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const sx = prevX + t * dx;
        const sy = prevY + t * dy;
        const d = Math.hypot(px - sx, py - sy);
        if (d < minD) minD = d;
        prevX = cx;
        prevY = cy;
      }
      const inside =
        py < tip && px < half * aspect * Math.pow(Math.max(0, 1 - py / tip), 0.72);
      return inside ? -minD : minD;
    }

    let cur = { tip: -0.3, half: 0.3, soft: 0.1 };
    let tgt = { tip: 0.3, half: 0.34, soft: 0.22 };
    let introDone = false;
    const introStart = performance.now() + 250;
    const introDur = 1050;
    let raf = 0;

    function frame(now: number) {
      const q =
        typeof window !== "undefined"
          ? window.scrollY / Math.max(1, window.innerHeight)
          : 0;

      if (!introDone) {
        if (now < introStart) {
          cur = { tip: -0.3, half: 0.3, soft: 0.1 };
        } else {
          const u = smoothstep((now - introStart) / introDur);
          const rest = sampleKeys(0);
          cur = {
            tip: lerp(-0.3, rest.tip, u),
            half: lerp(0.3, rest.half, u),
            soft: lerp(0.1, rest.soft, u),
          };
          if (u >= 1) introDone = true;
        }
      } else {
        tgt = sampleKeys(q);
        // idle drift
        const t = now;
        tgt = {
          tip: tgt.tip + Math.sin(t * 0.00033 + 1.3) * 0.02,
          half: tgt.half + Math.sin(t * 0.0005) * 0.015,
          soft: tgt.soft,
        };
        cur = {
          tip: cur.tip + (tgt.tip - cur.tip) * 0.12,
          half: cur.half + (tgt.half - cur.half) * 0.12,
          soft: cur.soft + (tgt.soft - cur.soft) * 0.12,
        };
      }

      const aspect =
        typeof window !== "undefined"
          ? window.innerWidth / Math.max(1, window.innerHeight)
          : 16 / 9;
      const RND = 0.25;
      const img = ctx!.createImageData(W, H);
      const data = img.data;

      for (let y = 0; y < H; y++) {
        const py = y / (H - 1);
        for (let x = 0; x < W; x++) {
          const nx = x / (W - 1);
          const px = Math.abs(nx - 0.5) * aspect;
          let sd = bowlSD(px, py, cur.tip, cur.half, aspect);
          sd -= RND;
          const g = 1 - smoothstep((sd + cur.soft) / (2 * cur.soft));
          let col: number[];
          if (g < 0.38) {
            col = mix(OUT, RIM, smoothstep(g / 0.38));
          } else {
            col = mix(RIM, CORE, smoothstep((g - 0.38) / 0.62));
          }
          const i = (y * W + x) * 4;
          data[i] = col[0];
          data[i + 1] = col[1];
          data[i + 2] = col[2];
          data[i + 3] = 255;
        }
      }
      ctx!.putImageData(img, 0, 0);
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="bowl-atmo"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} id="bg" width={96} height={60} />
    </div>
  );
}
