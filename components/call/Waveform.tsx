"use client";

import { useEffect, useRef } from "react";

interface Props {
  // Remote audio track — the waveform reacts when the other person speaks
  track: MediaStreamTrack | null;
}

// The only animated element in the app.
export function Waveform({ track }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !track) return;

    const ctx = canvas.getContext("2d")!;
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(
      new MediaStream([track]),
    );
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let raf: number;
    const draw = () => {
      analyser.getByteFrequencyData(data);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const barCount = 24;
      const barWidth = width / barCount - 3;
      for (let i = 0; i < barCount; i++) {
        const v = data[Math.floor((i * data.length) / barCount)] / 255;
        const h = Math.max(2, v * height * 0.9);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(
          i * (barWidth + 3),
          (height - h) / 2,
          barWidth,
          h,
        );
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      source.disconnect();
      audioCtx.close();
    };
  }, [track]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={48}
      className="mx-auto block"
    />
  );
}
