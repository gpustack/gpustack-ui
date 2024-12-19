import {
  DownloadOutlined,
  FormatPainterOutlined,
  SyncOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { Button, Slider, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import IconFont from '../icon-font';
import './index.less';

type Point = { x: number; y: number };
type Stroke = Point[];

type CanvasImageEditorProps = {
  imageSrc: string;
  disabled?: boolean;
  onSave: (imageData: string) => void;
  uploadButton: React.ReactNode;
  imageStatus: {
    isOriginal: boolean;
    isResetNeeded: boolean;
  };
};

const COLOR = 'rgba(0, 0, 255, 0.3)';

const CanvasImageEditor: React.FC<CanvasImageEditorProps> = ({
  imageSrc,
  disabled,
  imageStatus,
  onSave,
  uploadButton
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineWidth, setLineWidth] = useState<number>(30);
  const isDrawing = useRef<boolean>(false);
  const currentStroke = useRef<Point[]>([]);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const autoScale = useRef<number>(1);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const getTransformedPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const overlayCanvas = overlayCanvasRef.current!;
    const rect = overlayCanvas.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const transformedX = x - overlayCanvas.width / 2;
    const transformedY = y - overlayCanvas.height / 2;

    console.log('Mouse Coordinates (Transformed):', transformedX, transformedY);

    return { x: transformedX, y: transformedY };
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    overlayCanvasRef.current!.style.cursor = 'none';
    cursorRef.current!.style.display = 'block';
    cursorRef.current!.style.top = `${e.clientY - lineWidth / 2}px`;
    cursorRef.current!.style.left = `${e.clientX - lineWidth / 2}px`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    overlayCanvasRef.current!.style.cursor = 'none';
    cursorRef.current!.style.display = 'block';
    cursorRef.current!.style.top = `${e.clientY - lineWidth / 2}px`;
    cursorRef.current!.style.left = `${e.clientX - lineWidth / 2}px`;
  };

  const handleMouseLeave = () => {
    overlayCanvasRef.current!.style.cursor = 'default';
    cursorRef.current!.style.display = 'none';
  };

  const createOffscreenCanvas = () => {
    if (offscreenCanvasRef.current === null) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = overlayCanvasRef.current!.width;
      offscreenCanvasRef.current.height = overlayCanvasRef.current!.height;
      const offscreenCtx = offscreenCanvasRef.current.getContext('2d')!;
      offscreenCtx.translate(
        overlayCanvasRef.current!.width / 2,
        overlayCanvasRef.current!.height / 2
      );
    }
  };

  const setCanvasCenter = useCallback(() => {
    if (!canvasRef.current || !overlayCanvasRef.current) return;

    const overlayCtx = overlayCanvasRef.current!.getContext('2d');
    const ctx = canvasRef.current!.getContext('2d');
    const offscreenCtx = offscreenCanvasRef.current!.getContext('2d');

    // Set the origin to the center
    overlayCtx!.translate(ctx!.canvas.width / 2, ctx!.canvas.height / 2);
    ctx!.translate(ctx!.canvas.width / 2, ctx!.canvas.height / 2);
    offscreenCtx!.translate(ctx!.canvas.width / 2, ctx!.canvas.height / 2);
  }, [canvasRef.current, overlayCanvasRef.current]);

  const scaleCanvasSize = useCallback(() => {
    const canvas = canvasRef.current!;
    const offscreenCanvas = offscreenCanvasRef.current!;
    const overlayCanvas = overlayCanvasRef.current!;

    overlayCanvas.width = canvas.width;
    overlayCanvas.height = canvas.height;

    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
  }, [canvasRef.current, overlayCanvasRef.current, offscreenCanvasRef.current]);

  const setStrokes = (strokes: Stroke[]) => {
    strokesRef.current = strokes;
  };

  const scaleLineWidth = useCallback(() => {
    // setLineWidth(lineWidth * autoScale.current);
  }, [lineWidth]);

  const generateMask = useCallback(() => {
    const overlayCanvas = overlayCanvasRef.current!;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = overlayCanvas.width;
    maskCanvas.height = overlayCanvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    // Create the transparent overlay
    maskCtx!.fillStyle = 'black';
    maskCtx!.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx!.globalCompositeOperation = 'destination-out';
    maskCtx!.drawImage(overlayCanvas, 0, 0);

    return maskCanvas.toDataURL('image/png');
  }, []);

  const saveMask = useCallback(() => {
    const mask = generateMask();
    onSave(mask);
  }, [onSave, generateMask]);

  const downloadMask = useCallback(() => {
    const mask = generateMask();

    const link = document.createElement('a');
    link.download = 'mask.png';
    link.href = mask;
    link.click();
  }, [generateMask]);

  const drawStroke = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      stroke: Stroke | Point[],
      options: {
        lineWidth: number;
        color: string;
        compositeOperation: 'source-over' | 'destination-out';
      }
    ) => {
      const { lineWidth, color, compositeOperation } = options;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = compositeOperation;

      ctx.beginPath();

      stroke.forEach((point, i) => {
        console.log('Drawing Point:', point);
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      if (compositeOperation === 'source-over') {
        ctx.strokeStyle = color;
      }
      ctx.stroke();
    },
    []
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

      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = compositeOperation;

      ctx.lineTo(point.x, point.y);
      if (compositeOperation === 'source-over') {
        ctx.strokeStyle = color;
      }
      ctx.stroke();
    },
    [lineWidth]
  );

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;

    const { x, y } = getTransformedPoint(e);
    console.log('Drawing:', e.nativeEvent, { x, y });
    currentStroke.current.push({
      x,
      y
    });

    const ctx = overlayCanvasRef.current!.getContext('2d');

    ctx!.save();

    drawLine(
      ctx!,
      { x, y },
      { lineWidth, color: COLOR, compositeOperation: 'destination-out' }
    );
    drawLine(
      ctx!,
      { x, y },
      { lineWidth, color: COLOR, compositeOperation: 'source-over' }
    );

    ctx!.restore();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;

    currentStroke.current = [];
    const { x, y } = getTransformedPoint(e);
    currentStroke.current.push({
      x,
      y
    });

    const ctx = overlayCanvasRef.current!.getContext('2d');
    ctx!.beginPath();
    ctx!.moveTo(x, y);

    draw(e);
  };

  const endDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('End Drawing:', e);
    if (!isDrawing.current) {
      return;
    }

    isDrawing.current = false;

    strokesRef.current.push(_.cloneDeep(currentStroke.current));

    currentStroke.current = [];

    saveMask();
  };

  const clearOverlayCanvas = useCallback(() => {
    const ctx = overlayCanvasRef.current!.getContext('2d');
    ctx!.clearRect(
      -overlayCanvasRef.current!.width / 2,
      -overlayCanvasRef.current!.height / 2,
      overlayCanvasRef.current!.width,
      overlayCanvasRef.current!.height
    );
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvasRef.current!.getContext('2d');
    ctx!.clearRect(
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );
  }, []);

  const clearOffscreenCanvas = useCallback(() => {
    const offscreenCanvas = offscreenCanvasRef.current!;
    const offscreenCtx = offscreenCanvas.getContext('2d')!;

    offscreenCtx.clearRect(
      -offscreenCanvas.width / 2,
      -offscreenCanvas.height / 2,
      offscreenCanvas.width,
      offscreenCanvas.height
    );
  }, []);

  const onReset = useCallback(() => {
    clearOverlayCanvas();
    console.log('Resetting strokes');
    setStrokes([]);
    currentStroke.current = [];
  }, []);

  const redrawStrokes = useCallback(
    (strokes: Stroke[], type?: string) => {
      console.log('Redrawing strokes:', strokes, type);
      if (!offscreenCanvasRef.current) {
        createOffscreenCanvas();
      }
      if (!strokes.length) {
        clearOverlayCanvas();
        return;
      }

      const offscreenCanvas = offscreenCanvasRef.current!;
      const overlayCanvas = overlayCanvasRef.current!;
      const offscreenCtx = offscreenCanvas.getContext('2d')!;
      const overlayCtx = overlayCanvas!.getContext('2d')!;

      offscreenCanvas.width = overlayCanvas!.width;
      offscreenCanvas.height = overlayCanvas!.height;

      // clear offscreen canvas

      clearOverlayCanvas();

      strokes?.forEach((stroke: Point[], index) => {
        overlayCtx.save();
        drawStroke(overlayCtx, stroke, {
          lineWidth,
          color: COLOR,
          compositeOperation: 'destination-out'
        });

        drawStroke(overlayCtx, stroke, {
          lineWidth,
          color: COLOR,
          compositeOperation: 'source-over'
        });
        overlayCtx.restore();
      });
    },
    [lineWidth, drawStroke]
  );

  const undo = () => {
    if (strokesRef.current.length === 0) return;

    const newStrokes = strokesRef.current.slice(0, -1);
    console.log('New strokes:', newStrokes, strokesRef.current);
    setStrokes(newStrokes);

    redrawStrokes(newStrokes);
  };

  const download = () => {
    const canvas = canvasRef.current!;
    const link = document.createElement('a');
    link.download = 'image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    link.remove();
  };

  const scaleStrokes = (scale: number): Stroke[] => {
    const strokes: Stroke[] = _.cloneDeep(strokesRef.current);
    const newStrokes = strokes.map((stroke) => {
      return stroke.map((point) => {
        return {
          x: point.x * scale,
          y: point.y * scale
        };
      });
    });
    setStrokes(newStrokes);
    return newStrokes;
  };

  const drawImage = useCallback(async () => {
    if (!containerRef.current || !canvasRef.current) return;
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas!.getContext('2d');
        const container = containerRef.current;
        const scale = Math.min(
          container!.offsetWidth / img.width,
          container!.offsetHeight / img.height,
          1
        );

        canvas!.width = img.width * scale;
        canvas!.height = img.height * scale;

        autoScale.current = scale / autoScale.current;

        scaleLineWidth();
        scaleCanvasSize();
        setCanvasCenter();

        clearCanvas();

        ctx!.drawImage(
          img,
          -canvas.width / 2,
          -canvas.height / 2,
          canvas!.width,
          canvas!.height
        );
        resolve();
      };
    });
  }, [
    imageSrc,
    containerRef.current,
    canvasRef.current,
    scaleCanvasSize,
    setCanvasCenter,
    scaleLineWidth
  ]);

  const handleResize = useCallback(
    async (entries: ResizeObserverEntry[]) => {
      const contentRect = entries[0].contentRect;
      if (!contentRect.width || !contentRect.height || !imgLoaded) return;
      await drawImage();
      console.log('Image Loaded:', imageStatus, strokesRef.current);
      if (imageStatus.isOriginal) {
        redrawStrokes(strokesRef.current, 'resize');
      }
    },
    [drawImage, scaleStrokes, redrawStrokes, onReset, imageStatus, imgLoaded]
  );

  const initializeImage = useCallback(async () => {
    setImgLoaded(false);
    await drawImage();
    setImgLoaded(true);
    console.log('Image Loaded:', imageStatus, strokesRef.current);
    if (imageStatus.isOriginal) {
      redrawStrokes(strokesRef.current, 'initialize');
    } else if (imageStatus.isResetNeeded) {
      onReset();
    }
  }, [drawImage, onReset, redrawStrokes, imageStatus]);

  useEffect(() => {
    initializeImage();
  }, [initializeImage]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (container) {
      resizeObserver.current = new ResizeObserver(
        _.throttle(handleResize, 100)
      );
      resizeObserver.current.observe(container);
    }

    return () => {
      resizeObserver.current?.disconnect();
    };
  }, [handleResize, containerRef.current]);

  useEffect(() => {
    createOffscreenCanvas();
    const handleUndoShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
      }
    };

    window.addEventListener('keydown', handleUndoShortcut);
    return () => {
      window.removeEventListener('keydown', handleUndoShortcut);
    };
  }, []);

  return (
    <div className="editor-wrapper">
      <div className="flex-between">
        <div className="tools">
          <Tooltip
            placement="bottomLeft"
            arrow={false}
            overlayInnerStyle={{
              background: 'var(--color-white-1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: 160
            }}
            title={
              <div className="flex-column" style={{ width: '100%' }}>
                <span className="text-secondary">Brush Size</span>
                <Slider
                  disabled={disabled}
                  style={{ marginBlock: '4px 6px', marginLeft: 0, flex: 1 }}
                  vertical={false}
                  defaultValue={lineWidth}
                  min={1}
                  max={60}
                  onChange={(value) => setLineWidth(value)}
                />
              </div>
            }
          >
            <Button size="middle" type="text">
              <FormatPainterOutlined className="font-size-14" />
            </Button>
          </Tooltip>
          <Tooltip title="Undo">
            <Button
              onClick={undo}
              size="middle"
              type="text"
              disabled={disabled}
            >
              <UndoOutlined className="font-size-14" />
            </Button>
          </Tooltip>
          {uploadButton}
          <Tooltip title="Reset">
            <Button
              onClick={onReset}
              size="middle"
              type="text"
              disabled={disabled}
            >
              <SyncOutlined className="font-size-14" />
            </Button>
          </Tooltip>
        </div>
        <div className="tools">
          <Tooltip title="Save Mask">
            <Button onClick={downloadMask} size="middle" type="text">
              <IconFont className="font-size-14" type="icon-save1"></IconFont>
            </Button>
          </Tooltip>
          <Tooltip title="Download">
            <Button onClick={download} size="middle" type="text">
              <DownloadOutlined className="font-size-14" />
            </Button>
          </Tooltip>
        </div>
      </div>
      <div
        className="editor-content"
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          flex: 1
        }}
      >
        <canvas ref={canvasRef} style={{ position: 'absolute', zIndex: 1 }} />
        <canvas
          ref={overlayCanvasRef}
          style={{ position: 'absolute', zIndex: 2 }}
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseEnter={handleMouseEnter}
          onMouseMove={(e) => {
            handleMouseMove(e);
            draw(e);
          }}
          onMouseLeave={(e) => {
            handleMouseLeave();
            endDrawing(e);
          }}
        />
        <div
          ref={cursorRef}
          style={{
            display: 'none',
            position: 'fixed',
            width: lineWidth,
            height: lineWidth,
            backgroundColor: COLOR,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 3
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(CanvasImageEditor);
