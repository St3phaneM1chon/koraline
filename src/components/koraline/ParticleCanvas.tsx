'use client';

import { useEffect, useRef, useCallback } from 'react';

type ParticleType = 'confetti' | 'fire' | 'stars' | 'burst';

interface ParticleCanvasProps {
  type?: ParticleType;
  trigger: boolean;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
}

const COLORS: Record<ParticleType, string[]> = {
  confetti: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#34c759', '#0ea5e9'],
  fire: ['#ff4500', '#ff6b00', '#ff9500', '#ffcc00', '#fff176'],
  stars: ['#ffffff', '#e0e0ff', '#c0c0ff', '#ffd700', '#fffacd'],
  burst: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#e9d5ff'],
};

function createParticle(type: ParticleType, w: number, h: number): Particle {
  const colors = COLORS[type];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const maxLife = 60 + Math.random() * 60;

  switch (type) {
    case 'confetti':
      return {
        x: Math.random() * w, y: -10,
        vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2,
        size: 6 + Math.random() * 4, color, life: 0, maxLife,
        rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 10,
      };
    case 'fire':
      return {
        x: w / 2 + (Math.random() - 0.5) * 80, y: h,
        vx: (Math.random() - 0.5) * 2, vy: -(Math.random() * 4 + 2),
        size: 4 + Math.random() * 6, color, life: 0, maxLife: 40 + Math.random() * 30,
        rotation: 0, rotationSpeed: 0,
      };
    case 'stars':
      return {
        x: Math.random() * w, y: Math.random() * h,
        vx: 0, vy: 0,
        size: 1 + Math.random() * 3, color, life: 0, maxLife: maxLife * 1.5,
        rotation: 0, rotationSpeed: 0,
      };
    case 'burst':
    default: {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      return {
        x: w / 2, y: h / 2,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5, color, life: 0, maxLife,
        rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 8,
      };
    }
  }
}

function ParticleCanvas({ type = 'confetti', trigger, duration = 2000, onComplete, className = '' }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const activeRef = useRef(false);

  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const startAnimation = useCallback(() => {
    if (prefersReducedMotion.current) {
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;

    particlesRef.current = Array.from({ length: 60 }, () => createParticle(type, w, h));
    activeRef.current = true;

    const startTime = performance.now();

    function frame(now: number) {
      if (!ctx || !activeRef.current) return;
      const elapsed = now - startTime;

      ctx.clearRect(0, 0, w, h);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (type === 'confetti') p.vy += 0.05;
        if (type === 'burst') { p.vx *= 0.98; p.vy *= 0.98; p.vy += 0.03; }
        if (type === 'fire') p.size *= 0.97;

        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) return false;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (type === 'confetti') {
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (type === 'stars') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * (0.5 + 0.5 * Math.sin(p.life * 0.1)), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
        return true;
      });

      if (elapsed < duration && particlesRef.current.length < 80 && elapsed < duration * 0.7) {
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push(createParticle(type, w, h));
        }
      }

      if (particlesRef.current.length > 0 && elapsed < duration + 3000) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        activeRef.current = false;
        ctx.clearRect(0, 0, w, h);
        onComplete?.();
      }
    }

    animRef.current = requestAnimationFrame(frame);
  }, [type, duration, onComplete]);

  useEffect(() => {
    if (trigger) startAnimation();
    return () => {
      activeRef.current = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [trigger, startAnimation]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export { ParticleCanvas };
export type { ParticleCanvasProps };
