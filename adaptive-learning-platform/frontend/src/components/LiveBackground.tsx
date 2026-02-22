import React, { useRef, useEffect, useCallback } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    baseOpacity: number;
    opacity: number;
    color: string;
    hue: number;
}

const PARTICLE_COUNT = 120;
const CONNECTION_DISTANCE = 150;
const MOUSE_RADIUS = 160;
const MOUSE_ATTRACT_FORCE = 0.015;
const COLORS = [
    { rgb: '59, 130, 246', hue: 217 },    // blue
    { rgb: '56, 189, 248', hue: 199 },    // sky blue
    { rgb: '96, 165, 250', hue: 213 },    // light blue
    { rgb: '37, 99, 235', hue: 224 },     // dark blue
    { rgb: '14, 165, 233', hue: 199 },    // cyan blue
];

const LiveBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>(0);
    const mouseRef = useRef({ x: -1000, y: -1000, active: false });
    const trailRef = useRef<{ x: number; y: number; age: number }[]>([]);

    const initParticles = useCallback((width: number, height: number) => {
        const particles: Particle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const colorObj = COLORS[Math.floor(Math.random() * COLORS.length)];
            const baseOpacity = Math.random() * 0.5 + 0.2;
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 0.8,
                baseOpacity,
                opacity: baseOpacity,
                color: colorObj.rgb,
                hue: colorObj.hue,
            });
        }
        particlesRef.current = particles;
    }, []);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas;
        const particles = particlesRef.current;
        const mouse = mouseRef.current;
        const trail = trailRef.current;

        // Clear
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, width, height);

        // ── Mouse cursor glow ──
        if (mouse.active) {
            // Large outer glow
            const outerGlow = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, MOUSE_RADIUS
            );
            outerGlow.addColorStop(0, 'rgba(59, 130, 246, 0.04)');
            outerGlow.addColorStop(0.4, 'rgba(59, 130, 246, 0.015)');
            outerGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
            ctx.fillStyle = outerGlow;
            ctx.fillRect(0, 0, width, height);

            // Inner spotlight
            const innerGlow = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, 80
            );
            innerGlow.addColorStop(0, 'rgba(96, 165, 250, 0.06)');
            innerGlow.addColorStop(1, 'rgba(96, 165, 250, 0)');
            ctx.fillStyle = innerGlow;
            ctx.fillRect(0, 0, width, height);
        }

        // ── Mouse trail ──
        for (let t = trail.length - 1; t >= 0; t--) {
            trail[t].age += 1;
            if (trail[t].age > 30) {
                trail.splice(t, 1);
                continue;
            }
            const alpha = (1 - trail[t].age / 30) * 0.15;
            const size = (1 - trail[t].age / 30) * 4;
            ctx.beginPath();
            ctx.arc(trail[t].x, trail[t].y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
            ctx.fill();
        }

        // Add trail point
        if (mouse.active && Math.random() > 0.8) {
            trail.push({ x: mouse.x + (Math.random() - 0.5) * 10, y: mouse.y + (Math.random() - 0.5) * 10, age: 0 });
        }

        // ── Update & draw particles ──
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // Mouse interaction: attract toward cursor
            if (mouse.active) {
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < MOUSE_RADIUS) {
                    const strength = (1 - dist / MOUSE_RADIUS);
                    // Attract particles toward cursor
                    p.vx += dx / dist * strength * MOUSE_ATTRACT_FORCE;
                    p.vy += dy / dist * strength * MOUSE_ATTRACT_FORCE;

                    // Brighten particles near cursor
                    p.opacity = p.baseOpacity + strength * 0.3;

                    // Make particles near cursor grow
                    const drawRadius = p.radius + strength * 1;

                    // Draw enhanced glow for near-cursor particles
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, drawRadius * 4, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${p.color}, ${strength * 0.1})`;
                    ctx.fill();
                } else {
                    p.opacity += (p.baseOpacity - p.opacity) * 0.05;
                }
            } else {
                p.opacity += (p.baseOpacity - p.opacity) * 0.05;
            }

            // Dampen velocity
            p.vx *= 0.985;
            p.vy *= 0.985;

            // Subtle drift
            p.vx += (Math.random() - 0.5) * 0.01;
            p.vy += (Math.random() - 0.5) * 0.01;

            p.x += p.vx;
            p.y += p.vy;

            // Wrap edges
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;
            if (p.y < -10) p.y = height + 10;
            if (p.y > height + 10) p.y = -10;

            // Breathing opacity
            p.opacity += (Math.random() - 0.5) * 0.008;
            p.opacity = Math.max(0.08, Math.min(0.85, p.opacity));

            // Draw particle core
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${p.opacity})`;
            ctx.fill();

            // Soft glow ring
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${p.opacity * 0.12})`;
            ctx.fill();
        }

        // ── Draw connections ──
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECTION_DISTANCE) {
                    const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.12;

                    // Brighten connections near mouse
                    let lineAlpha = alpha;
                    if (mouse.active) {
                        const midX = (particles[i].x + particles[j].x) / 2;
                        const midY = (particles[i].y + particles[j].y) / 2;
                        const mouseDist = Math.sqrt(
                            (midX - mouse.x) ** 2 + (midY - mouse.y) ** 2
                        );
                        if (mouseDist < MOUSE_RADIUS) {
                            lineAlpha += (1 - mouseDist / MOUSE_RADIUS) * 0.15;
                        }
                    }

                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(59, 130, 246, ${lineAlpha})`;
                    ctx.lineWidth = lineAlpha > 0.1 ? 1 : 0.5;
                    ctx.stroke();
                }
            }
        }

        // ── Draw connection lines from cursor to nearby particles ──
        if (mouse.active) {
            for (let i = 0; i < particles.length; i++) {
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < MOUSE_RADIUS * 0.6) {
                    const alpha = (1 - dist / (MOUSE_RADIUS * 0.6)) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(particles[i].x, particles[i].y);
                    ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
                    ctx.lineWidth = alpha > 0.1 ? 1.2 : 0.6;
                    ctx.stroke();
                }
            }
        }

        animationRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (particlesRef.current.length === 0) {
                initParticles(canvas.width, canvas.height);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { ...mouseRef.current, active: false };
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationRef.current);
        };
    }, [animate, initParticles]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none',
            }}
        />
    );
};

export default LiveBackground;
