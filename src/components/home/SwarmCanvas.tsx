import { useEffect, useRef } from 'react';

const INITIALS = ['BO', 'MA', 'CF', 'CC', 'CT', 'WC', 'ON', 'CM', 'LC', 'TA', 'PD', 'NH'];

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  dx: number;
  dy: number;
  label: string;
  you: boolean;
}

/**
 * Signature hero visual: 12 nodes drifting on slow brownian paths; edges draw
 * (1px, gray-300) between nodes <140px apart, fading with distance. Cursor is a
 * soft repulsor (radius 120px). The teal YOU node slowly orbits the ring center.
 * Honors prefers-reduced-motion with a single static frame.
 */
export default function SwarmCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const start = performance.now();
    const mouse = { x: -9999, y: -9999 };

    const nodes: Node[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    if (nodes.length === 0) {
      const cx = width / 2;
      const cy = height / 2;
      const ringR = Math.min(width, height) * 0.34;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        nodes.push({
          x: cx + ringR * Math.cos(a) + (Math.random() - 0.5) * 40,
          y: cy + ringR * Math.sin(a) + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          dx: 0,
          dy: 0,
          label: INITIALS[i],
          you: false,
        });
      }
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const fadeNodes = Math.min(1, t / 1.2);
      const fadeEdges = Math.max(0, Math.min(1, (t - 1.2) / 0.8));
      const cx = width / 2;
      const cy = height / 2;
      const ringR = Math.min(width, height) * 0.34;

      ctx.clearRect(0, 0, width, height);

      // YOU node orbits the ring's center
      const youIdx = 2;
      const oa = t * 0.12 - Math.PI / 2 + (youIdx / 12) * Math.PI * 2;
      const youTargetX = cx + ringR * 0.55 * Math.cos(oa);
      const youTargetY = cy + ringR * 0.55 * Math.sin(oa);

      nodes.forEach((n, i) => {
        if (!reduced) {
          if (i === youIdx) {
            n.x += (youTargetX - n.x) * 0.008;
            n.y += (youTargetY - n.y) * 0.008;
          } else {
            // brownian drift
            n.vx += (Math.random() - 0.5) * 0.02;
            n.vy += (Math.random() - 0.5) * 0.02;
            n.vx *= 0.985;
            n.vy *= 0.985;
            n.x += n.vx;
            n.y += n.vy;
            // soft containment
            if (n.x < 30 || n.x > width - 30) n.vx *= -1;
            if (n.y < 30 || n.y > height - 30) n.vy *= -1;
            n.x = Math.max(24, Math.min(width - 24, n.x));
            n.y = Math.max(24, Math.min(height - 24, n.y));
          }
          // cursor repulsor (120px) via displacement with lerp decay
          const mdx = n.x - mouse.x;
          const mdy = n.y - mouse.y;
          const md = Math.hypot(mdx, mdy);
          if (md < 120 && md > 0.01) {
            const f = ((120 - md) / 120) * 0.9;
            n.dx += (mdx / md) * f;
            n.dy += (mdy / md) * f;
          }
          n.dx *= 0.92;
          n.dy *= 0.92;
        }
      });

      // edges <140px, fading with distance
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const ax = a.x + a.dx;
          const ay = a.y + a.dy;
          const bx = b.x + b.dx;
          const by = b.y + b.dy;
          const d = Math.hypot(ax - bx, ay - by);
          if (d < 140) {
            const alpha = (1 - d / 140) * 0.55 * fadeEdges;
            ctx.strokeStyle = `rgba(212,210,203,${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }

      // nodes
      nodes.forEach((n) => {
        const x = n.x + n.dx;
        const y = n.y + n.dy;
        ctx.beginPath();
        ctx.arc(x, y, n.you ? 7 : 6, 0, Math.PI * 2);
        ctx.fillStyle = n.you
          ? `rgba(15,118,110,${(0.95 * fadeNodes).toFixed(3)})`
          : `rgba(107,114,128,${(0.6 * fadeNodes).toFixed(3)})`;
        ctx.fill();
        ctx.font = '500 10px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = n.you
          ? `rgba(15,118,110,${(0.9 * fadeNodes).toFixed(3)})`
          : `rgba(107,114,128,${(0.55 * fadeNodes).toFixed(3)})`;
        ctx.fillText(n.you ? 'YOU' : n.label, x, y + 18);
      });

      if (!reduced) raf = requestAnimationFrame(draw);
    };

    if (reduced) {
      draw(performance.now() + 2000); // single static frame, fully faded in
    } else {
      raf = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
      aria-hidden
    />
  );
}
