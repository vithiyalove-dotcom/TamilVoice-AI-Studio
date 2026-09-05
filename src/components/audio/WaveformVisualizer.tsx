import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  isProcessing?: boolean;
  barCount?: number;
  height?: number;
  color?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  isProcessing = false,
  barCount = 36,
  height = 48,
  color = '#06b6d4',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const barWidth = (width / barCount) * 0.65;
      const spacing = (width / barCount) * 0.35;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4; // minimum height when idle

        if (isPlaying) {
          // Dynamic harmonic motion when playing
          const sinVal1 = Math.sin(phase + i * 0.3);
          const sinVal2 = Math.cos(phase * 1.5 + i * 0.4);
          const factor = Math.abs(sinVal1 * 0.7 + sinVal2 * 0.3);
          barHeight = Math.max(6, factor * (height - 8));
        } else if (isProcessing) {
          // Wave pulse ripple when processing
          const ripple = Math.sin(phase * 2 - i * 0.25);
          barHeight = Math.max(4, Math.abs(ripple) * (height * 0.7));
        }

        const x = i * (barWidth + spacing);
        const y = (height - barHeight) / 2;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          grad.addColorStop(0, '#818cf8'); // Brand indigo
          grad.addColorStop(1, color);     // Cyan accent
        } else if (isProcessing) {
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(1, '#ec4899');
        } else {
          grad.addColorStop(0, '#334155');
          grad.addColorStop(1, '#1e293b');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        // Rounded bar
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      if (isPlaying || isProcessing) {
        phase += 0.12;
        animIdRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
      }
    };
  }, [isPlaying, isProcessing, barCount, height, color]);

  return (
    <div className="w-full flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full h-full max-h-[60px]"
      />
    </div>
  );
};
