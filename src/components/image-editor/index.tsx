import { Spin } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import useDrawing from './hooks/use-drawing';
import useZoom from './hooks/use-zoom';
import './index.less';
import { ImageActionsBar, ToolsBar } from './tools-bar';

const LoadWrapper = styled.div<{ width?: number; height?: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: ${(props) => `${props.width}px` || '100%'};
  z-index: 100;
`;
const Loading = (props: { width: number; height: number }) => {
  const { width, height } = props;
  return (
    <LoadWrapper width={width} height={height}>
      <Spin spinning></Spin>
    </LoadWrapper>
  );
};

type Point = { x: number; y: number; lineWidth: number };
type Stroke = Point[];

type CanvasImageEditorProps = {
  ref?: any;
  loading: boolean;
  imageSrc: string;
  disabled?: boolean;
  imguid: string | number;
  maskUpload?: any[];
  clearUploadMask?: () => void;
  onSave: (imageData: { mask: string | null; img: string }) => void;
  onScaleImageSize?: (data: { width: number; height: number }) => void;
  uploadButton: React.ReactNode;
  imageStatus: {
    isOriginal: boolean;
    isResetNeeded: boolean;
    width: number;
    height: number;
  };
};

const COLOR = 'rgba(0, 0, 255, 0.3)';

const CanvasImageEditor: React.FC<CanvasImageEditorProps> = forwardRef(
  (
    {
      loading,
      imageSrc,
      disabled: isDisabled,
      imageStatus,
      onSave,
      onScaleImageSize,
      uploadButton,
      maskUpload
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lineWidth, setLineWidth] = useState<number>(60);
    const translatePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const negativeMaskRef = useRef<boolean>(false);
    const [invertMask, setInvertMask] = useState<boolean>(false);
    const timer = useRef<any>(null);
    const [loadingSize, setLoadingSize] = useState({
      width: 0,
      height: 0,
      loading: false
    });

    const {
      canvasRef,
      overlayCanvasRef,
      offscreenCanvasRef,
      cursorRef,
      strokesRef,
      currentStroke,
      mouseDownState,
      autoScale,
      baseScale,
      maskStorkeRef,
      setMaskStrokes,
      draw,
      drawStroke,
      startDrawing,
      endDrawing,
      handleMouseMove,
      handleMouseLeave,
      handleMouseEnter,
      saveImage,
      resetCanvas,
      creatOffscreenCanvas,
      generateMask,
      getTransformLineWidth,
      getTransformedPoint,
      setStrokes,
      setTransform,
      clearOverlayCanvas,
      clearCanvas,
      fitView
    } = useDrawing({
      lineWidth: lineWidth,
      translatePos: translatePos,
      isDisabled: isDisabled,
      invertMask,
      maskUpload,
      onSave: onSave
    });

    const { handleOnWheel, setActiveScale, activeScale } = useZoom({
      overlayCanvasRef,
      canvasRef,
      offscreenCanvasRef,
      cursorRef,
      lineWidth,
      translatePos,
      autoScale,
      baseScale
    });

    const disabled = useMemo(() => {
      return isDisabled || invertMask || !!maskUpload?.length;
    }, [isDisabled, invertMask, maskUpload]);

    // update the canvas size
    const updateCanvasSize = useCallback(() => {
      const canvas = canvasRef.current!;
      const overlayCanvas = overlayCanvasRef.current!;
      const offscreenCanvas = offscreenCanvasRef.current!;

      overlayCanvas.width = canvas.width;
      overlayCanvas.height = canvas.height;
      offscreenCanvas.width = canvas.width;
      offscreenCanvas.height = canvas.height;
    }, []);

    const downloadMask = useCallback(() => {
      const mask = generateMask();

      const link = document.createElement('a');
      link.download = `mask_${dayjs().format('YYYYMMDDHHmmss')}.png`;
      link.href = mask || '';
      link.click();
    }, [generateMask]);

    const drawFillRect = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        stroke: Stroke | Point[],
        options: {
          lineWidth?: number;
          color: string;
          isInitial?: boolean;
        }
      ) => {
        const { color, isInitial } = options;

        stroke.forEach((point) => {
          const { x, y } = getTransformedPoint(point.x, point.y);
          const width = getTransformLineWidth(point.lineWidth);
          if (isInitial) {
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillRect(x - width / 2, y - width / 2, width, width);
            ctx.restore();
          }

          // draw the new stroke
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = color;
          ctx.fillRect(x - width / 2, y - width / 2, width, width);
        });
      },
      [getTransformLineWidth, getTransformedPoint]
    );

    const onReset = useCallback(() => {
      clearOverlayCanvas();
      setStrokes([]);
      saveImage();
      currentStroke.current = [];
      console.log('Resetting strokes', currentStroke.current);
    }, []);

    const loadMaskPixs = async (strokes: Stroke[], isInitial?: boolean) => {
      if (!strokes.length) {
        return;
      }

      const overlayCanvas = overlayCanvasRef.current!;
      const overlayCtx = overlayCanvas.getContext('2d')!;

      strokes.forEach((stroke: Point[]) => {
        drawFillRect(overlayCtx, stroke, {
          color: COLOR,
          isInitial: isInitial
        });
      });
    };

    const redrawStrokes = (strokes: Stroke[]) => {
      clearOverlayCanvas();
      setTransform();
      console.log(
        'Redrawing strokes:',
        strokes.length,
        maskStorkeRef.current.length
      );
      if (!strokes.length && !maskStorkeRef.current.length) {
        return;
      }

      const overlayCanvas = overlayCanvasRef.current!;

      const overlayCtx = overlayCanvas!.getContext('2d')!;

      // clear offscreen canvas

      loadMaskPixs(maskStorkeRef.current);

      strokes?.forEach((stroke: Point[], index) => {
        drawStroke(overlayCtx, stroke, {
          color: COLOR,
          compositeOperation: 'destination-out'
        });

        drawStroke(overlayCtx, stroke, {
          color: COLOR,
          compositeOperation: 'source-over'
        });
      });
    };

    const undo = useCallback(() => {
      if (
        strokesRef.current.length === 0 &&
        maskStorkeRef.current.length === 0
      ) {
        clearOverlayCanvas();
        return;
      }

      const lastlength = strokesRef.current.length;

      const newStrokes = strokesRef.current.slice(0, -1);
      setStrokes(newStrokes);

      if (
        !newStrokes.length &&
        lastlength === 0 &&
        maskStorkeRef.current.length
      ) {
        setMaskStrokes([]);
      }
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        redrawStrokes(newStrokes);
      }, 100);
    }, []);

    const downloadOriginImage = () => {
      const canvas = canvasRef.current!;
      const link = document.createElement('a');
      link.download = `image_${dayjs().format('YYYYMMDDHHmmss')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      link.remove();
    };

    const downloadNewImage = () => {
      if (!imageSrc) return;

      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imageStatus.width;
        canvas.height = imageStatus.height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const url = canvas.toDataURL('image/png');
        const filename = `${canvas.width}x${canvas.height}_${dayjs().format('YYYYMMDDHHmmss')}.png`;

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
      };
    };

    const download = () => {
      if (imageStatus.isOriginal) {
        downloadOriginImage();
      } else {
        downloadNewImage();
      }
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

          // if need to fit the image to the container, show * baseScale.current
          canvas!.width = img.width;
          canvas!.height = img.height;

          // fit the image to the container
          autoScale.current = 1;
          creatOffscreenCanvas();
          updateCanvasSize();
          clearCanvas();

          ctx!.drawImage(img, 0, 0, canvas!.width, canvas!.height);
          resolve();
        };
      });
    }, [imageSrc]);

    const invertPainting = (isChecked: boolean) => {
      const ctx = overlayCanvasRef.current!.getContext('2d');

      if (!ctx) return;

      if (isChecked) {
        const canvasWidth = overlayCanvasRef.current!.width;
        const canvasHeight = overlayCanvasRef.current!.height;

        clearOverlayCanvas();

        ctx.fillStyle = COLOR;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        setTransform();
        ctx.globalCompositeOperation = 'destination-out';

        [...strokesRef.current, ...maskStorkeRef.current].forEach((stroke) => {
          stroke.forEach((point: Point) => {
            const { x, y } = getTransformedPoint(point.x, point.y);
            const lineWidth = getTransformLineWidth(point.lineWidth);
            ctx.fillStyle = 'rgba(0,0,0,1)';
            ctx.beginPath();
            ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
          });
        });
        ctx.globalCompositeOperation = 'source-out';
      } else {
        redrawStrokes(strokesRef.current);
      }
    };

    const updateCursorSize = () => {
      cursorRef.current!.style.width = `${lineWidth * autoScale.current}px`;
      cursorRef.current!.style.height = `${lineWidth * autoScale.current}px`;
    };

    const initializeImage = useCallback(async () => {
      await drawImage();
      onScaleImageSize?.({
        width: canvasRef.current!.width,
        height: canvasRef.current!.height
      });

      console.log('Image status:', imageStatus, invertMask);

      if (imageStatus.isResetNeeded) {
        onReset();
        resetCanvas();
      } else if (
        (strokesRef.current.length || maskStorkeRef.current.length) &&
        imageStatus.isOriginal &&
        !invertMask
      ) {
        redrawStrokes(strokesRef.current);
        saveImage();
      } else if (
        (strokesRef.current.length || maskStorkeRef.current.length) &&
        imageStatus.isOriginal &&
        invertMask
      ) {
        invertPainting(true);
        saveImage();
      }

      updateCursorSize();
    }, [
      drawImage,
      imageStatus.isOriginal,
      imageStatus.isResetNeeded,
      invertMask
    ]);

    const handleFitView = () => {
      fitView();
      setActiveScale(autoScale.current);
      updateCursorSize();
      redrawStrokes(strokesRef.current);
    };

    const handleBrushSizeChange = (value: number) => {
      setLineWidth(value);
      cursorRef.current!.style.width = `${value}px`;
      cursorRef.current!.style.height = `${value}px`;
    };

    const handleOnChangeMask = (e: any) => {
      negativeMaskRef.current = e.target.checked;
      invertPainting(e.target.checked);
      setInvertMask(e.target.checked);
      saveImage();
    };

    useEffect(() => {
      initializeImage();
    }, [initializeImage]);

    useEffect(() => {
      const handleUndoShortcut = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          undo();
        }
      };

      const handleMouseDown = (e: MouseEvent) => {
        mouseDownState.current = true;
      };

      const handleMouseUp = (e: MouseEvent) => {
        mouseDownState.current = false;
      };

      window.addEventListener('keydown', handleUndoShortcut);
      // mouse down
      window.addEventListener('mousedown', handleMouseDown);

      // mouse up
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        clearTimeout(timer.current);
        window.removeEventListener('keydown', handleUndoShortcut);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, []);

    const handleDeleteMask = () => {
      setInvertMask(false);
      redrawStrokes(strokesRef.current);
      saveImage();
    };

    useImperativeHandle(ref, () => ({
      clearMask: handleDeleteMask,
      loadMaskPixs: async function (strokes: Stroke[]) {
        setMaskStrokes(strokes);
        setStrokes([]);
        setTransform();
        clearOverlayCanvas();
        loadMaskPixs(strokes, true);
      }
    }));

    useEffect(() => {
      if (maskUpload?.length) {
        // clear the overlay canvas
        clearOverlayCanvas();
      }
    }, [maskUpload]);

    useEffect(() => {
      if (disabled && cursorRef.current) {
        cursorRef.current!.style.display = 'none';
      }
    }, [disabled]);

    return (
      <div className="editor-wrapper">
        <div className="flex-between">
          <ToolsBar
            handleBrushSizeChange={handleBrushSizeChange}
            undo={undo}
            onReset={onReset}
            uploadButton={uploadButton}
            handleFitView={handleFitView}
            disabled={disabled}
            lineWidth={lineWidth}
            loading={loading}
          ></ToolsBar>

          <ImageActionsBar
            handleOnChangeMask={handleOnChangeMask}
            invertMask={invertMask}
            downloadMask={downloadMask}
            download={download}
            isOriginal={imageStatus.isOriginal}
            disabled={isDisabled || !!maskUpload?.length}
            maskUpload={maskUpload}
          ></ImageActionsBar>
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
          {loadingSize.loading && (
            <Loading
              width={loadingSize.width}
              height={loadingSize.height}
            ></Loading>
          )}
          <canvas ref={canvasRef} style={{ position: 'absolute', zIndex: 1 }} />
          <canvas
            ref={overlayCanvasRef}
            className={classNames('overlay-canvas', {
              'overlay-canvas--disabled': disabled
            })}
            style={{ position: 'absolute', zIndex: 10, cursor: 'none' }}
            onMouseDown={(event) => {
              mouseDownState.current = true;
              startDrawing(event);
            }}
            onMouseUp={(event) => {
              mouseDownState.current = false;
              endDrawing(event);
            }}
            onMouseEnter={handleMouseEnter}
            onWheel={handleOnWheel}
            onMouseMove={(e) => {
              handleMouseMove(e);
              draw(e);
            }}
            onMouseLeave={(e) => {
              endDrawing(e);
              handleMouseLeave();
            }}
          />
          <div
            ref={cursorRef}
            style={{
              display: 'none',
              position: 'fixed',
              width: lineWidth * activeScale,
              height: lineWidth * activeScale,
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
  }
);

export default React.memo(CanvasImageEditor);
