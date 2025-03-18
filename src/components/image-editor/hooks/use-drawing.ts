import _ from 'lodash';
import { useCallback, useMemo, useRef } from 'react';

type Point = { x: number; y: number; lineWidth: number };
type Stroke = Point[];
const COLOR = 'rgba(0, 0, 255, 0.3)';

export default function useDrawing(props: {
  isDisabled?: boolean;
  invertMask: boolean;
  maskUpload?: any[];
  lineWidth: number;
  translatePos: { current: { x: number; y: number } };
  onSave: (imageData: { mask: string | null; img: string }) => void;
}) {
  const {
    isDisabled,
    invertMask,
    maskUpload,
    lineWidth,
    translatePos,
    onSave
  } = props;
  const mouseDownState = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<any>(null);
  const currentStroke = useRef<Point[]>([]);
  const strokesRef = useRef<Stroke[]>([]);
  const isDrawing = useRef<boolean>(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const autoScale = useRef<number>(1);
  const baseScale = useRef<number>(1);
  const contentPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const maskStorkeRef = useRef<Stroke[]>([]);

  const disabled = useMemo(() => {
    return isDisabled || invertMask || !!maskUpload?.length;
  }, [isDisabled, invertMask, maskUpload]);

  const setStrokes = (strokes: Stroke[]) => {
    strokesRef.current = strokes;
  };

  const setMaskStrokes = (strokes: Stroke[]) => {
    maskStorkeRef.current = strokes;
  };

  const inpaintArea = useCallback(
    (data: Uint8ClampedArray<ArrayBufferLike>) => {
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          data[i] = 255; // Red
          data[i + 1] = 255; // Green
          data[i + 2] = 255; // Blue
          data[i + 3] = 255; // Alpha
        }
      }
    },
    []
  );

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current!;
    return canvas.toDataURL('image/png');
  }, []);

  const generateMask = useCallback(() => {
    if (strokesRef.current.length === 0 && maskStorkeRef.current.length === 0) {
      return null;
    }
    const overlayCanvas = overlayCanvasRef.current!;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = overlayCanvas.width;
    maskCanvas.height = overlayCanvas.height;
    const maskCtx = maskCanvas.getContext('2d')!;
    const overlayCtx = overlayCanvas.getContext('2d')!;

    const imageData = overlayCtx.getImageData(
      0,
      0,
      overlayCanvas.width,
      overlayCanvas.height
    );
    const data = imageData.data;

    inpaintArea(data);

    maskCtx.putImageData(imageData, 0, 0);

    maskCtx.globalCompositeOperation = 'destination-over';
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    return maskCanvas.toDataURL('image/png');
  }, []);

  const saveImage = () => {
    const mask = generateMask();
    const img = generateImage();
    onSave({ mask, img });
  };

  const creatOffscreenCanvas = useCallback(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
  }, []);

  const setTransform = useCallback(() => {
    creatOffscreenCanvas();
    const ctx = canvasRef.current?.getContext('2d');
    const overlayCtx = overlayCanvasRef.current?.getContext('2d');
    const offCtx = offscreenCanvasRef.current?.getContext('2d');

    if (!ctx || !overlayCtx) return;

    ctx!.resetTransform();
    overlayCtx!.resetTransform();
    offCtx!.resetTransform();

    const { current: scale } = autoScale;
    const { x: translateX, y: translateY } = translatePos.current;
    ctx!.setTransform(scale, 0, 0, scale, translateX, translateY);
    overlayCtx!.setTransform(scale, 0, 0, scale, translateX, translateY);
    offCtx!.setTransform(scale, 0, 0, scale, translateX, translateY);
  }, []);

  const getTransformedPoint = useCallback(
    (offsetX: number, offsetY: number) => {
      const { current: scale } = autoScale;

      const { x: translateX, y: translateY } = translatePos.current;

      const transformedX = (offsetX - translateX) / scale;
      const transformedY = (offsetY - translateY) / scale;

      return {
        x: transformedX,
        y: transformedY
      };
    },
    []
  );

  const getTransformLineWidth = useCallback(
    (w = 1) => {
      const width = w || lineWidth;
      return width / autoScale.current;
    },
    [lineWidth]
  );

  const drawLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      point: Point,
      options: {
        lineWidth: number;
        color: string;
        compositeOperation: 'source-over' | 'destination-out';
      }
    ) => {
      const { lineWidth, color, compositeOperation } = options;

      ctx.lineWidth = getTransformLineWidth(lineWidth);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = compositeOperation;

      const { x, y } = getTransformedPoint(point.x, point.y);

      ctx.lineTo(x, y);
      if (compositeOperation === 'source-over') {
        ctx.strokeStyle = color;
      }
      ctx.stroke();
    },
    [getTransformLineWidth]
  );

  const drawStroke = useCallback(
    (
      ctx: CanvasRenderingContext2D,
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

      stroke.forEach((point, i) => {
        const { x, y } = getTransformedPoint(point.x, point.y);
        ctx.lineWidth = getTransformLineWidth(point.lineWidth);
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
    },
    [getTransformLineWidth, getTransformedPoint]
  );

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) {
      return;
    }
    console.log(
      'Drawing:',
      isDrawing.current,
      currentStroke.current,
      strokesRef.current
    );
    if (!isDrawing.current || !mouseDownState.current) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const currentX = offsetX;
    const currentY = offsetY;
    console.log('currentStroke:', currentStroke.current);
    currentStroke.current.push({
      x: currentX,
      y: currentY,
      lineWidth
    });

    const ctx = overlayCanvasRef.current!.getContext('2d');

    ctx!.save();

    drawLine(
      ctx!,
      { x: currentX, y: currentY, lineWidth },
      { lineWidth, color: COLOR, compositeOperation: 'destination-out' }
    );
    drawLine(
      ctx!,
      { x: currentX, y: currentY, lineWidth },
      { lineWidth, color: COLOR, compositeOperation: 'source-over' }
    );

    ctx!.restore();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) {
      return;
    }

    isDrawing.current = true;

    currentStroke.current = [];
    const { offsetX, offsetY } = e.nativeEvent;

    const currentX = offsetX;
    const currentY = offsetY;

    currentStroke.current.push({
      x: currentX,
      y: currentY,
      lineWidth
    });

    const ctx = overlayCanvasRef.current!.getContext('2d');
    setTransform();
    const { x, y } = getTransformedPoint(currentX, currentY);
    ctx!.beginPath();
    ctx!.moveTo(x, y);

    draw(e);
  };

  const endDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) {
      return;
    }
    if (!isDrawing.current) {
      return;
    }

    console.log('End Drawing:', e);

    isDrawing.current = false;

    strokesRef.current.push(_.cloneDeep(currentStroke.current));

    currentStroke.current = [];

    saveImage();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) {
      return;
    }
    overlayCanvasRef.current!.style.cursor = 'none';
    cursorRef.current!.style.display = 'block';
    cursorRef.current!.style.top = `${e.clientY - (lineWidth / 2) * autoScale.current}px`;
    cursorRef.current!.style.left = `${e.clientX - (lineWidth / 2) * autoScale.current}px`;
  };

  const handleMouseLeave = () => {
    if (disabled) {
      return;
    }
    isDrawing.current = false;
    overlayCanvasRef.current!.style.cursor = 'default';
    cursorRef.current!.style.display = 'none';
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('mouse enter:', mouseDownState.current);
    if (disabled) {
      overlayCanvasRef.current!.style.cursor = 'default';
      return;
    }
    // if (mouseDownState.current) {
    //   isDrawing.current = true;
    // }
    overlayCanvasRef.current!.style.cursor = 'none';
    cursorRef.current!.style.display = 'block';
    cursorRef.current!.style.top = `${e.clientY - (lineWidth / 2) * autoScale.current}px`;
    cursorRef.current!.style.left = `${e.clientX - (lineWidth / 2) * autoScale.current}px`;
  };

  const clearOverlayCanvas = useCallback(() => {
    const ctx = overlayCanvasRef.current!.getContext('2d');
    const offCtx = offscreenCanvasRef.current?.getContext('2d');

    offCtx!.resetTransform();
    ctx!.resetTransform();
    ctx!.clearRect(
      0,
      0,
      overlayCanvasRef.current!.width,
      overlayCanvasRef.current!.height
    );
    offCtx!.clearRect(
      0,
      0,
      overlayCanvasRef.current!.width,
      overlayCanvasRef.current!.height
    );
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvasRef.current!.getContext('2d');
    const offCtx = offscreenCanvasRef.current?.getContext('2d');
    ctx!.resetTransform();
    ctx!.clearRect(0, 0, canvas.width, canvas.height);

    offCtx!.resetTransform();
    offCtx!.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current!;
    const overlayCanvas = overlayCanvasRef.current!;
    const offscreenCanvas = offscreenCanvasRef.current!;
    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    const offCtx = offscreenCanvasRef.current?.getContext('2d');

    autoScale.current = 1;
    baseScale.current = 1;
    translatePos.current = { x: 0, y: 0 };
    contentPos.current = { x: 0, y: 0 };

    canvas.style.transform = 'scale(1)';
    overlayCanvas.style.transform = 'scale(1)';
    offscreenCanvas.style.transform = 'scale(1)';

    cursorRef.current!.style.width = `${lineWidth}px`;
    cursorRef.current!.style.height = `${lineWidth}px`;

    ctx!.resetTransform();
    overlayCtx!.resetTransform();
    offCtx!.resetTransform();
  }, []);

  const fitView = () => {
    resetCanvas();
    autoScale.current = baseScale.current;
    translatePos.current = { x: 0, y: 0 };
    setTransform();
    overlayCanvasRef.current!.style.transform = `scale(${autoScale.current})`;
    canvasRef.current!.style.transform = `scale(${autoScale.current})`;
    offscreenCanvasRef.current!.style.transform = `scale(${autoScale.current})`;
  };

  return {
    canvasRef,
    overlayCanvasRef,
    offscreenCanvasRef,
    cursorRef,
    strokesRef,
    currentStroke,
    isDrawing,
    mouseDownState,
    autoScale,
    baseScale,
    maskStorkeRef,
    creatOffscreenCanvas,
    setMaskStrokes,
    fitView,
    setStrokes,
    resetCanvas,
    draw,
    getTransformLineWidth,
    getTransformedPoint,
    drawStroke,
    startDrawing,
    endDrawing,
    handleMouseMove,
    handleMouseLeave,
    handleMouseEnter,
    saveImage,
    generateMask,
    generateImage,
    setTransform,
    clearOverlayCanvas,
    clearCanvas
  };
}
