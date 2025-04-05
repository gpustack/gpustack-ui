let offscreenCanvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;

const COLOR = 'rgba(0, 0, 255, 0.3)';

type Point = { x: number; y: number; lineWidth: number };
type Stroke = Point[];

const postDone = () => {
  const imageData = ctx.getImageData(
    0,
    0,
    offscreenCanvas.width,
    offscreenCanvas.height
  );
  self.postMessage({ type: 'done', imageData });
};

const drawFillRect = (
  ctx: OffscreenCanvasRenderingContext2D,
  stroke: Stroke,
  options: any
) => {
  const { color } = options;

  stroke?.forEach(({ x, y }) => {
    const width = options.lineWidth || 10;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(x - width / 2, y - width / 2, width, width);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y - width / 2, width, width);
    ctx.restore();
  });
};

const drawStrokes = (strokes: Stroke[]) => {
  strokes?.forEach((stroke) => {
    drawFillRect(ctx, stroke, {
      color: COLOR
    });
  });
};

const drawLine = (
  stroke: Stroke | Point[],
  options: {
    lineWidth?: number;
    color: string;
    compositeOperation: 'source-over' | 'destination-out';
  }
) => {
  const { color, compositeOperation } = options;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = compositeOperation;
  ctx.save();

  ctx.beginPath();

  stroke?.forEach((point, i) => {
    const { x, y } = point;
    ctx.lineWidth = point.lineWidth || 10;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (compositeOperation === 'source-over') {
    ctx.strokeStyle = color;
  }
  ctx.stroke();
  ctx.restore();
};

const drawLines = (strokes: Stroke[]) => {
  strokes?.forEach((stroke: Point[], index) => {
    drawLine(stroke, {
      color: COLOR,
      compositeOperation: 'destination-out'
    });

    drawLine(stroke, {
      color: COLOR,
      compositeOperation: 'source-over'
    });
  });
};

self.onmessage = (event) => {
  if (event.data.type === 'init') {
    offscreenCanvas = event.data.canvas;
    ctx = offscreenCanvas!.getContext('2d')!;
    return;
  }

  if (event.data.type === 'draw') {
    ctx?.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    const { maskStrokes, strokes } = event.data;
    drawStrokes(maskStrokes);
    drawLines(strokes);
    postDone();
  }
};

export {};
