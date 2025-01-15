import {
  DownloadOutlined,
  ExpandOutlined,
  FormatPainterOutlined,
  SyncOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Slider, Tooltip } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import IconFont from '../icon-font';
import './index.less';

type Point = { x: number; y: number; lineWidth: number };
type Stroke = Point[];

type CanvasImageEditorProps = {
  imageSrc: string;
  disabled?: boolean;
  imguid: string | number;
  onSave: (imageData: { mask: string; img: string }) => void;
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
  imguid,
  uploadButton
}) => {
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 8;
  const ZOOM_SPEED = 0.1;
  const intl = useIntl();
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
  const baseScale = useRef<number>(1);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const translatePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const contentPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationFrameIdRef = useRef<number | null>(null);
  const strokeCache = useRef<any>({});
  const preImguid = useRef<string | number>('');

  const getTransformedPoint = (offsetX: number, offsetY: number) => {
    const { current: scale } = autoScale;

    const { x: translateX, y: translateY } = translatePos.current;

    const transformedX = (offsetX + lineWidth / 2 - translateX) / scale;
    const transformedY = (offsetY + lineWidth / 2 - translateY) / scale;

    return {
      x: _.round(transformedX),
      y: _.round(transformedY)
    };
  };

  const getTransformLineWidth = (lineWidth: number) => {
    return lineWidth;
  };

  const setCanvasTransformOrigin = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (autoScale.current <= MIN_SCALE) {
      return;
    }

    if (autoScale.current >= MAX_SCALE) {
      return;
    }

    console.log('Setting transform origin:', autoScale.current);
    const rect = overlayCanvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const originX = mouseX / rect.width;
    const originY = mouseY / rect.height;

    overlayCanvasRef.current!.style.transformOrigin = `${originX * 100}% ${originY * 100}%`;
    canvasRef.current!.style.transformOrigin = `${originX * 100}% ${originY * 100}%`;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLCanvasElement>) => {
    overlayCanvasRef.current!.style.cursor = 'none';
    cursorRef.current!.style.display = 'block';
    cursorRef.current!.style.top = `${e.clientY}px`;
    cursorRef.current!.style.left = `${e.clientX}px`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    overlayCanvasRef.current!.style.cursor = 'none';
    cursorRef.current!.style.display = 'block';
    cursorRef.current!.style.top = `${e.clientY}px`;
    cursorRef.current!.style.left = `${e.clientX}px`;
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
    }
  };

  // update the canvas size
  const updateCanvasSize = useCallback(() => {
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

  const generateMask = useCallback(() => {
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

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        data[i] = 255; // Red
        data[i + 1] = 255; // Green
        data[i + 2] = 255; // Blue
        data[i + 3] = 255; // Alpha
      }
    }
    maskCtx.putImageData(imageData, 0, 0);

    maskCtx.globalCompositeOperation = 'destination-over';
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    return maskCanvas.toDataURL('image/png');
  }, []);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current!;
    return canvas.toDataURL('image/png');
  }, []);

  const saveImage = useCallback(() => {
    const mask = generateMask();
    const img = generateImage();
    onSave({ mask, img });
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
        lineWidth?: number;
        color: string;
        compositeOperation: 'source-over' | 'destination-out';
      }
    ) => {
      const { color, compositeOperation } = options;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = compositeOperation;

      ctx.beginPath();

      stroke.forEach((point, i) => {
        const { x, y } = getTransformedPoint(point.x, point.y);
        console.log('Drawing point:');
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
    [lineWidth]
  );

  const setTransform = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    const overlayCtx = overlayCanvasRef.current?.getContext('2d');

    if (!ctx || !overlayCtx) return;

    ctx!.resetTransform();
    overlayCtx!.resetTransform();

    const { current: scale } = autoScale;
    const { x: translateX, y: translateY } = translatePos.current;
    ctx!.setTransform(scale, 0, 0, scale, translateX, translateY);

    overlayCtx!.setTransform(scale, 0, 0, scale, translateX, translateY);
  }, []);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;

    const { offsetX, offsetY } = e.nativeEvent;
    currentStroke.current.push({
      x: offsetX,
      y: offsetY,
      lineWidth
    });

    const ctx = overlayCanvasRef.current!.getContext('2d');

    ctx!.save();

    drawLine(
      ctx!,
      { x: offsetX, y: offsetY, lineWidth },
      { lineWidth, color: COLOR, compositeOperation: 'destination-out' }
    );
    drawLine(
      ctx!,
      { x: offsetX, y: offsetY, lineWidth },
      { lineWidth, color: COLOR, compositeOperation: 'source-over' }
    );

    ctx!.restore();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;

    currentStroke.current = [];
    const { offsetX, offsetY } = e.nativeEvent;
    currentStroke.current.push({
      x: offsetX,
      y: offsetY,
      lineWidth
    });

    const ctx = overlayCanvasRef.current!.getContext('2d');
    setTransform();
    const { x, y } = getTransformedPoint(offsetX, offsetY);
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

    saveImage();
  };

  const clearOverlayCanvas = useCallback(() => {
    const ctx = overlayCanvasRef.current!.getContext('2d');
    ctx!.resetTransform();
    ctx!.clearRect(
      0,
      0,
      overlayCanvasRef.current!.width,
      overlayCanvasRef.current!.height
    );
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvasRef.current!.getContext('2d');
    ctx!.resetTransform();
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const clearOffscreenCanvas = useCallback(() => {
    const offscreenCanvas = offscreenCanvasRef.current!;
    const offscreenCtx = offscreenCanvas.getContext('2d')!;
    offscreenCtx.resetTransform();
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
    const { current: scale } = autoScale;
    const { x: translateX, y: translateY } = translatePos.current;
    offscreenCtx!.setTransform(scale, 0, 0, scale, translateX, translateY);
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

      setTransform();

      strokes?.forEach((stroke: Point[], index) => {
        overlayCtx.save();
        drawStroke(overlayCtx, stroke, {
          color: COLOR,
          compositeOperation: 'destination-out'
        });

        drawStroke(overlayCtx, stroke, {
          color: COLOR,
          compositeOperation: 'source-over'
        });
        overlayCtx.restore();
      });
    },
    [drawStroke]
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

  const drawImage = useCallback(async () => {
    if (!containerRef.current || !canvasRef.current) return;
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas!.getContext('2d');
        const container = containerRef.current;
        baseScale.current = Math.min(
          container!.offsetWidth / img.width,
          container!.offsetHeight / img.height,
          1
        );

        canvas!.width = img.width * baseScale.current;
        canvas!.height = img.height * baseScale.current;

        // fit the image to the container
        autoScale.current = autoScale.current || 1;
        updateCanvasSize();

        clearCanvas();

        ctx!.drawImage(img, 0, 0, canvas!.width, canvas!.height);
        resolve();
      };
    });
  }, [imageSrc, containerRef.current, canvasRef.current, updateCanvasSize]);

  const resetCanvas = useCallback(() => {
    const canvas = canvasRef.current!;
    const overlayCanvas = overlayCanvasRef.current!;
    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');

    autoScale.current = 1;
    baseScale.current = 1;
    translatePos.current = { x: 0, y: 0 };
    contentPos.current = { x: 0, y: 0 };
    canvas.style.transform = 'scale(1)';
    overlayCanvas.style.transform = 'scale(1)';

    cursorRef.current!.style.width = `${lineWidth}px`;
    cursorRef.current!.style.height = `${lineWidth}px`;

    ctx!.resetTransform();
    overlayCtx!.resetTransform();
  }, []);

  const initializeImage = useCallback(async () => {
    setImgLoaded(false);
    await drawImage();
    setImgLoaded(true);
    console.log('Image Loaded:', imageStatus, strokesRef.current);
    // if (strokeCache.current[imguid]) {
    //   strokesRef.current = strokeCache.current[imguid];
    // } else if (preImguid.current !== imguid) {
    //   strokeCache.current[preImguid.current] = strokesRef.current;
    //   onReset();
    //   resetCanvas();
    //   preImguid.current = imguid;
    // }

    if (imageStatus.isOriginal) {
      redrawStrokes(strokesRef.current, 'initialize');
    } else if (imageStatus.isResetNeeded) {
      onReset();
      resetCanvas();
    }
  }, [drawImage, onReset, redrawStrokes, imageStatus]);

  const updateZoom = (scaleChange: number, mouseX: number, mouseY: number) => {
    const newScale = _.round(autoScale.current + scaleChange, 2);

    if (newScale < MIN_SCALE || newScale > MAX_SCALE) return;

    const { current: oldScale } = autoScale;
    const { x: oldTranslateX, y: oldTranslateY } = translatePos.current;

    const centerX = (mouseX - oldTranslateX) / oldScale;
    const centerY = (mouseY - oldTranslateY) / oldScale;

    autoScale.current = newScale;

    const newTranslateX = mouseX - centerX * newScale;
    const newTranslateY = mouseY - centerY * newScale;

    translatePos.current = { x: newTranslateX, y: newTranslateY };
  };

  const handleZoom = (event: React.WheelEvent<HTMLCanvasElement>) => {
    const scaleChange = event.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;

    // current mouse position
    const canvas = overlayCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    setCanvasTransformOrigin(event);

    updateZoom(scaleChange, mouseX, mouseY);

    overlayCanvasRef.current!.style.transform = `scale(${autoScale.current})`;
    canvasRef.current!.style.transform = `scale(${autoScale.current})`;
  };

  const updateCursorSize = () => {
    cursorRef.current!.style.width = `${lineWidth * autoScale.current}px`;
    cursorRef.current!.style.height = `${lineWidth * autoScale.current}px`;
  };

  const handleOnWheel = (event: any) => {
    handleZoom(event);
    updateCursorSize();
    // redrawStrokes(strokesRef.current);
  };

  const handleFitView = () => {
    autoScale.current = baseScale.current;
    translatePos.current = { x: 0, y: 0 };
    setTransform();
    overlayCanvasRef.current!.style.transform = `scale(${autoScale.current})`;
    canvasRef.current!.style.transform = `scale(${autoScale.current})`;
    updateCursorSize();
    redrawStrokes(strokesRef.current);
  };

  const handleBrushSizeChange = (value: number) => {
    setLineWidth(value);
    cursorRef.current!.style.width = `${value * autoScale.current}px`;
    cursorRef.current!.style.height = `${value * autoScale.current}px`;
  };
  useEffect(() => {
    initializeImage();
  }, [initializeImage]);

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
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (disabled) {
      overlayCanvasRef.current!.style.pointerEvents = 'none';
    } else {
      overlayCanvasRef.current!.style.pointerEvents = 'auto';
    }
  }, [disabled]);

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
                <span className="text-secondary">
                  {intl.formatMessage({ id: 'playground.image.brushSize' })}
                </span>
                <Slider
                  disabled={disabled}
                  style={{ marginBlock: '4px 6px', marginLeft: 0, flex: 1 }}
                  vertical={false}
                  defaultValue={lineWidth}
                  min={10}
                  max={60}
                  onChange={handleBrushSizeChange}
                />
              </div>
            }
          >
            <Button size="middle" type="text">
              <FormatPainterOutlined className="font-size-14" />
            </Button>
          </Tooltip>
          <Tooltip title={intl.formatMessage({ id: 'common.button.undo' })}>
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
          <Tooltip title={intl.formatMessage({ id: 'common.button.reset' })}>
            <Button
              onClick={onReset}
              size="middle"
              type="text"
              disabled={disabled}
            >
              <SyncOutlined className="font-size-14" />
            </Button>
          </Tooltip>
          <Tooltip
            title={intl.formatMessage({ id: 'playground.image.fitview' })}
          >
            <Button
              onClick={handleFitView}
              size="middle"
              type="text"
              disabled={disabled}
            >
              <ExpandOutlined className="font-size-14" />
            </Button>
          </Tooltip>
        </div>
        <div className="tools">
          <Tooltip
            title={intl.formatMessage({ id: 'playground.image.saveMask' })}
          >
            <Button onClick={downloadMask} size="middle" type="text">
              <IconFont className="font-size-14" type="icon-save2"></IconFont>
            </Button>
          </Tooltip>
          <Tooltip
            title={intl.formatMessage({ id: 'playground.image.download' })}
          >
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
          className="overlay-canvas"
          style={{ position: 'absolute', zIndex: 10, cursor: 'none' }}
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseEnter={handleMouseEnter}
          onWheel={handleOnWheel}
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
            width: lineWidth * autoScale.current,
            height: lineWidth * autoScale.current,
            backgroundColor: COLOR,
            borderRadius: '50%',
            pointerEvents: 'none',
            cursor: 'none',
            zIndex: 5
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(CanvasImageEditor);
