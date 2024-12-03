import useResizeObserver from '@/components/logs-viewer/use-size';
import React, { useEffect, useState } from 'react';
import './index.less';

interface AudioAnimationProps {
  width: number;
  height: number;
  maxWidth?: number;
  scaleFactor?: number;
  maxBarCount?: number;
  fixedHeight?: boolean;
  analyserData: {
    data: Uint8Array;
    analyser: any;
  };
}

const AudioAnimation: React.FC<AudioAnimationProps> = (props) => {
  const {
    scaleFactor = 1.2,
    maxBarCount = 128,
    maxWidth,
    fixedHeight = true,
    analyserData,
    width: initialWidth,
    height: initialHeight
  } = props;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationId = React.useRef<number>(0);
  const isScaled = React.useRef<boolean>(false);
  const oscillationOffset = React.useRef(0);
  const direction = React.useRef(1);
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const containerRef = React.useRef<any>(null);

  const size = useResizeObserver(scrollerRef);

  const calculateJitter = (
    i: number,
    timestamp: number,
    baseHeight: number,
    minJitter: number,
    jitterAmplitude: number
  ) => {
    //
    const jitterFactor = Math.sin(timestamp / 200 + i) * 0.5 + 0.5;
    const jitter =
      minJitter +
      jitterFactor * (jitterAmplitude - minJitter) * (baseHeight / maxBarCount);
    return jitter;
  };

  const startAudioVisualization = () => {
    if (!canvasRef.current || !analyserData.data?.length) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const WIDTH = (canvas.width = width * 2);
    const HEIGHT = (canvas.height = height * 2);

    if (!isScaled.current) {
      canvasCtx.scale(2, 2);
      isScaled.current = true;
    }

    const barWidth = 4;
    const barSpacing = 6;
    const centerLine = Math.floor(HEIGHT / 2);

    const jitterAmplitude = 40;
    const minJitter = 10;

    let lastFrameTime = 0;

    const gradient = canvasCtx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#007BFF');
    gradient.addColorStop(1, '#0069DA');
    canvasCtx.fillStyle = gradient;

    const draw = (timestamp: number) => {
      const elapsed = timestamp - lastFrameTime;
      if (elapsed < 16) {
        animationId.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameTime = timestamp;

      analyserData.analyser?.current?.getByteFrequencyData(analyserData.data);
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      const barCount = Math.min(maxBarCount, analyserData.data.length);
      const totalWidth = barCount * (barWidth + barSpacing) - barSpacing;
      let x = WIDTH / 2 - totalWidth / 2 + oscillationOffset.current;

      oscillationOffset.current += direction.current;
      if (Math.abs(oscillationOffset.current) > 20) {
        direction.current *= -1;
      }

      for (let i = 0; i < barCount; i++) {
        const baseHeight = Math.floor(analyserData.data[i] / 2) * scaleFactor;

        const jitter = calculateJitter(
          i,
          timestamp,
          baseHeight,
          minJitter,
          jitterAmplitude
        );
        const barHeight = baseHeight + Math.round(jitter);

        const topY = Math.round(centerLine - barHeight / 2);
        const bottomY = Math.round(centerLine + barHeight / 2);

        canvasCtx.beginPath();
        canvasCtx.moveTo(x, bottomY);
        canvasCtx.lineTo(x, topY + 2);
        canvasCtx.arcTo(x + barWidth, topY + 2, x + barWidth, bottomY, 2);
        canvasCtx.lineTo(x + barWidth, bottomY);
        canvasCtx.closePath();
        canvasCtx.fill();

        x += barWidth + barSpacing;
      }

      animationId.current = requestAnimationFrame(draw);
    };

    draw(performance.now());
  };

  React.useEffect(() => {
    if (size) {
      if (maxWidth) {
        setWidth(Math.min(size.width, maxWidth));
      } else {
        setWidth(size?.width || 0);
      }
      if (!fixedHeight) {
        setHeight(size?.height || 0);
      }
    }
  }, [size, maxWidth]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const clearCanvas = () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, width * 2, height * 2);
      }
    };

    if (!analyserData.data?.length || !analyserData.analyser?.current) {
      clearCanvas();
      cancelAnimationFrame(animationId.current);
      animationId.current = 0;
      return;
    }

    startAudioVisualization();

    return () => {
      cancelAnimationFrame(animationId.current);
      clearCanvas();
    };
  }, [analyserData, width, height]);

  return (
    <div
      className="scroller-wrapper"
      ref={scrollerRef}
      style={{ width: '100%', height: '100%' }}
    >
      <div
        ref={containerRef}
        className="canvas-wrap"
        style={{ width: '100%', height: '100%' }}
      >
        <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
      </div>
    </div>
  );
};

export default React.memo(AudioAnimation);
