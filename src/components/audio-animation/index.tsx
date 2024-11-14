import React, { useEffect } from 'react';
import './index.less';

interface AudioAnimationProps {
  width: number;
  height: number;
  analyserData: {
    data: Uint8Array;
    analyser: any;
  };
}

const AudioAnimation: React.FC<AudioAnimationProps> = (props) => {
  const { width, height, analyserData } = props;
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animationId = React.useRef<number>(0);
  const isScaled = React.useRef<boolean>(false);
  const oscillationOffset = React.useRef(0);
  const direction = React.useRef(1);

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

    const barWidth = 3;
    const barSpacing = 2;
    const centerX = HEIGHT / 2;
    const centerLine = Math.floor(HEIGHT / 2);
    const jitterAmplitude = 60; // 最大抖动幅度
    const minJitter = 15; // 最小抖动幅度

    const frameInterval = 2;
    let frameCount = 0;

    canvasCtx.fillStyle = '#0073EF';

    const draw = () => {
      frameCount++;
      if (frameCount % frameInterval !== 0) {
        animationId.current = requestAnimationFrame(draw);
        return;
      }
      analyserData.analyser?.current?.getByteFrequencyData(analyserData.data);
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      const barCount = analyserData.data.length;
      const totalWidth = barCount * (barWidth + barSpacing) - barSpacing;
      let x = centerX - totalWidth / 2 + oscillationOffset.current;
      oscillationOffset.current += direction.current * 0.5;

      if (oscillationOffset.current > 20 || oscillationOffset.current < -20) {
        direction.current *= -1;
      }

      for (let i = 0; i < barCount; i++) {
        const baseHeight = Math.floor(analyserData.data[i] / 2);
        const jitter =
          minJitter +
          Math.round((Math.random() - 0.5) * (jitterAmplitude - minJitter));
        const barHeight = baseHeight + jitter;

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

    draw();
  };

  useEffect(() => {
    if (!analyserData.data?.length || !analyserData.analyser.current) {
      canvasRef.current
        ?.getContext('2d')
        ?.clearRect(0, 0, width * 2, height * 2);
      cancelAnimationFrame(animationId.current);
      animationId.current = 0;
      return;
    }
    startAudioVisualization();
    return () => {
      if (animationId.current) cancelAnimationFrame(animationId.current);
    };
  }, [analyserData, width, height]);

  return (
    <div
      className="canvas-wrap"
      style={{
        width: '100%',
        height: height
      }}
    >
      <canvas ref={canvasRef} style={{ width, height }}></canvas>
    </div>
  );
};

export default React.memo(AudioAnimation);
