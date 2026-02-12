import React, { useEffect, useRef } from 'react';
import './CinematicBackground.css';

const CinematicBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Star[] = [];
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Configuration
        const STAR_COUNT = 200;
        const SPEED = 0.05;

        class Star {
            x: number;
            y: number;
            z: number;
            size: number;
            color: string;

            constructor() {
                this.x = (Math.random() - 0.5) * width * 2;
                this.y = (Math.random() - 0.5) * height * 2;
                this.z = Math.random() * width;
                this.size = Math.random() * 2;

                // Randomly assign slight color variations for realism
                const colors = ['#ffffff', '#ffe9c4', '#d4fbff'];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                // Move towards viewer
                this.z -= SPEED * 50; // Speed factor

                // Reset if passed viewer
                if (this.z <= 0) {
                    this.z = width;
                    this.x = (Math.random() - 0.5) * width * 2;
                    this.y = (Math.random() - 0.5) * height * 2;
                }
            }

            draw() {
                if (!ctx) return;

                // Projection logic (3D -> 2D)
                const sx = (this.x / this.z) * width + width / 2;
                const sy = (this.y / this.z) * height + height / 2;

                // Scale size by depth
                const radius = (1 - this.z / width) * this.size * 2;

                if (radius > 0 && sx > 0 && sx < width && sy > 0 && sy < height) {
                    ctx.beginPath();
                    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;

                    // Add glow for closer stars
                    if (radius > 1.5) {
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = this.color;
                    } else {
                        ctx.shadowBlur = 0;
                    }

                    ctx.fill();
                }
            }
        }

        const init = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            stars = Array.from({ length: STAR_COUNT }, () => new Star());
        };

        const animate = () => {
            if (!ctx) return;

            // Clear with trail effect for "warp speed" feel
            ctx.fillStyle = 'rgba(5, 10, 16, 0.2)'; // Var(--bg-dark) with opacity
            ctx.fillRect(0, 0, width, height);

            stars.forEach(star => {
                star.update();
                star.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => init();

        window.addEventListener('resize', handleResize);
        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className="cinematic-background" />;
};

export default CinematicBackground;
