import { useEffect, useRef } from 'react';

// Heart curve sampled once as a unit shape; scaled/positioned per frame.
function heartUnitPoints(segments: number) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    pts.push({ x, y });
  }
  return pts;
}

// Distance-with-wraparound gaussian bump, used to build the lub-dub thump
// and the EKG waveform from the same beat phase so they stay in sync.
function bump(phase: number, center: number, width: number, height: number) {
  let d = phase - center;
  if (d > 0.5) d -= 1;
  if (d < -0.5) d += 1;
  return height * Math.exp(-(d * d) / (2 * width * width));
}

function heartbeatScale(phase: number) {
  return bump(phase, 0.08, 0.03, 0.22) + bump(phase, 0.22, 0.05, 0.12);
}

function ecgValue(phase: number) {
  return (
    bump(phase, 0.02, 0.012, 0.15) -
    bump(phase, 0.065, 0.008, 0.25) +
    bump(phase, 0.08, 0.012, 1.0) -
    bump(phase, 0.1, 0.012, 0.4) +
    bump(phase, 0.22, 0.05, 0.35)
  );
}

interface Ring {
  startTime: number;
}

export default function PulseHeart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const BEAT_PERIOD = 1100; // ms, ~ a slow, calm thump
    const RING_LIFETIME = 1500;
    const unitHeart = heartUnitPoints(80);

    let animationFrameId: number;
    let rings: Ring[] = [];
    let lastBeatIndex = -1;
    let start: number | null = null;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const strokeHeart = (centerX: number, centerY: number, scale: number, alpha: number, glow: number) => {
      ctx.beginPath();
      unitHeart.forEach((p, i) => {
        const x = centerX + p.x * scale;
        const y = centerY + p.y * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 77, 109, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255, 77, 109, 0.9)';
      ctx.shadowBlur = glow;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const draw = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      const cycle = elapsed / BEAT_PERIOD;
      const phase = cycle - Math.floor(cycle);
      const pulse = heartbeatScale(phase);

      const beatIndex = Math.floor((elapsed - 0.08 * BEAT_PERIOD) / BEAT_PERIOD);
      if (beatIndex > lastBeatIndex) {
        lastBeatIndex = beatIndex;
        rings.push({ startTime: elapsed });
      }
      rings = rings.filter((r) => elapsed - r.startTime < RING_LIFETIME);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.42;
      const baseScale = Math.min(canvas.width, canvas.height) / 26;

      // Expanding heart-shaped echoes
      rings.forEach((r) => {
        const age = elapsed - r.startTime;
        const t = age / RING_LIFETIME;
        strokeHeart(centerX, centerY, baseScale * (1 + t * 1.6), (1 - t) * 0.35, 0);
      });

      // Main pulsing heart
      strokeHeart(centerX, centerY, baseScale * (1 + pulse * 0.15), 0.75 + pulse * 0.25, 12 + pulse * 30);

      // Scrolling EKG line beneath the heart
      const lineY = canvas.height * 0.82;
      const lineHeight = Math.min(canvas.height * 0.12, 90);
      const scrollSpeed = BEAT_PERIOD * 1.4; // ms of history shown across the width

      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 2) {
        const tAgo = ((canvas.width - x) / canvas.width) * scrollSpeed;
        const sampleElapsed = elapsed - tAgo;
        const sampleCycle = sampleElapsed / BEAT_PERIOD;
        const samplePhase = sampleCycle - Math.floor(sampleCycle);
        const v = sampleElapsed < 0 ? 0 : ecgValue(samplePhase);
        const y = lineY - v * lineHeight;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 143, 177, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(255, 77, 109, 0.6)';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" />;
}
