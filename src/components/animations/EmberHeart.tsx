import { useEffect, useRef } from 'react';

interface FormationEmber {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  delay: number;
  duration: number;
  size: number;
  seed: number;
}

interface AmbientEmber {
  x: number;
  y: number;
  speed: number;
  size: number;
  seed: number;
  baseAlpha: number;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Fireflies that drift in from across the screen and gently gather into a
 * heart-shaped formation, while soft ambient sparks continue rising behind.
 */
export default function EmberHeart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let formation: FormationEmber[] = [];
    let ambient: AmbientEmber[] = [];
    let start: number | null = null;

    const initFormation = () => {
      formation = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = Math.min(canvas.width, canvas.height) / 45;

      const heartTargets: { x: number; y: number }[] = [];
      for (let t = 0; t < Math.PI * 2; t += 0.08) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        heartTargets.push({ x: centerX + x * scale, y: centerY + y * scale });
      }
      for (const layer of [0.35, 0.65]) {
        for (let t = 0; t < Math.PI * 2; t += 0.15) {
          const x = 16 * Math.pow(Math.sin(t), 3);
          const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          heartTargets.push({ x: centerX + x * scale * layer, y: centerY + y * scale * layer });
        }
      }

      heartTargets.forEach((target, i) => {
        formation.push({
          startX: Math.random() * canvas.width,
          startY: Math.random() * canvas.height,
          targetX: target.x,
          targetY: target.y,
          delay: Math.random() * 2200,
          duration: 2600 + Math.random() * 1600,
          size: 1.1 + Math.random() * 1.4,
          seed: i * 12.9898,
        });
      });
    };

    const initAmbient = () => {
      ambient = [];
      const count = 45;
      for (let i = 0; i < count; i++) {
        ambient.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 6 + Math.random() * 14,
          size: 0.8 + Math.random() * 1.6,
          seed: Math.random() * 1000,
          baseAlpha: 0.15 + Math.random() * 0.35,
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initFormation();
      initAmbient();
    };

    let lastTime = 0;
    const draw = (time: number) => {
      if (!start) start = time;
      const elapsed = time - start;
      const dt = lastTime ? time - lastTime : 16;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Soft breathing glow behind the formation
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const breathing = 0.5 + Math.sin(elapsed * 0.0006) * 0.5;
      const radius = Math.min(canvas.width, canvas.height) * 0.5;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, `rgba(255, 77, 109, ${0.07 + breathing * 0.04})`);
      gradient.addColorStop(1, 'rgba(255, 77, 109, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ambient background sparks, drifting upward
      ambient.forEach((p) => {
        p.y -= (p.speed * dt) / 1000;
        p.x += Math.sin(elapsed * 0.0005 + p.seed) * 0.15;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        const flicker = p.baseAlpha * (0.6 + Math.sin(elapsed * 0.002 + p.seed) * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 143, 177, ${Math.max(0, flicker)})`;
        ctx.fill();
      });

      // Fireflies converging into the heart shape
      formation.forEach((p) => {
        const localElapsed = elapsed - p.delay;
        const t = Math.max(0, Math.min(1, localElapsed / p.duration));
        const eased = easeOutCubic(t);

        const wobbleAmount = 3 * eased;
        const wobbleX = Math.sin(elapsed * 0.0018 + p.seed) * wobbleAmount;
        const wobbleY = Math.cos(elapsed * 0.0022 + p.seed) * wobbleAmount;

        const x = p.startX + (p.targetX - p.startX) * eased + wobbleX;
        const y = p.startY + (p.targetY - p.startY) * eased + wobbleY;

        const flicker = 0.55 + Math.sin(elapsed * 0.004 + p.seed) * 0.35;
        const alpha = Math.max(0, t) * Math.max(0.2, flicker);

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 141, 177, ${alpha})`;
        ctx.shadowColor = 'rgba(255, 77, 109, 0.9)';
        ctx.shadowBlur = 6 + flicker * 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

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
