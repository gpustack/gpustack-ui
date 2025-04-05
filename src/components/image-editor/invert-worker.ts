/// <reference lib="webworker" />

let offscreenCanvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;

const COLOR = 'rgba(0, 0, 255, 0.3)';

type Point = { x: number; y: number; lineWidth: number };
type Stroke = Point[];

self.onmessage = (event) => {
  const { width, height, strokes, maskStrokes } = event.data;

  if (event.data.type === 'init') {
    offscreenCanvas = event.data.canvas;
    ctx = offscreenCanvas!.getContext('2d')!;
    return;
  }

  if (event.data.type === 'draw') {
    ctx.fillStyle = COLOR;
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'destination-out';

    [...strokes].forEach((stroke: Stroke) => {
      stroke.forEach((point: { x: number; y: number; lineWidth: number }) => {
        const lineWidth = point.lineWidth;
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // points
    maskStrokes?.forEach((stroke: Stroke) => {
      stroke.forEach((point: { x: number; y: number; lineWidth: number }) => {
        const lineWidth = 4;
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    const newImageData = ctx.getImageData(0, 0, width, height);
    self.postMessage({ type: 'done', imageData: newImageData }, [
      newImageData.data.buffer
    ]);
  }
};

export {};
