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
  handleUpdateImageList: (fileList: any[]) => void;
  handleUpdateMaskList: (fileList: any[]) => void;
  uploadButton?: React.ReactNode;
  accept?: string;
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
      maskUpload,
      accept,
      onSave,
      onScaleImageSize,
      handleUpdateImageList,
      handleUpdateMaskList
    },
    ref
  ) => {
    const invertWorkerRef = useRef<any>(null);
    const loadMaksWorkerRef = useRef<any>(null);
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
      isLoadingMaskRef,
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
      baseScale,
      isLoadingMaskRef
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

    const onReset = useCallback(() => {
      clearOverlayCanvas();
      setStrokes([]);
      setMaskStrokes([]);
      saveImage();
      currentStroke.current = [];
      console.log('Resetting strokes', currentStroke.current);
    }, []);

    const loadMaskPixs = (maskStrokes: Stroke[], mainStrokes?: Stroke[]) => {
      try {
        if (!maskStrokes.length && !mainStrokes?.length) {
          return;
        }

        isLoadingMaskRef.current = true;

        const offscreenCanvas = new OffscreenCanvas(
          overlayCanvasRef.current!.width,
          overlayCanvasRef.current!.height
        );

        if (!loadMaksWorkerRef.current) {
          loadMaksWorkerRef.current = new Worker(
            new URL('./offscreen-worker.ts', import.meta.url),
            {
              type: 'module'
            }
          );
        }

        loadMaksWorkerRef.current!.onmessage = (event: any) => {
          if (event.data.type === 'done' && event.data.imageData) {
            console.log('load mask done');
            // draw the data to the overlay canvas
            const ctx = overlayCanvasRef.current!.getContext('2d')!;
            ctx.putImageData(event.data.imageData, 0, 0);

            isLoadingMaskRef.current = false;
            saveImage();
          }
        };

        // send offscreen canvas to worker
        loadMaksWorkerRef.current?.postMessage(
          { canvas: offscreenCanvas, type: 'init' },
          [offscreenCanvas]
        );

        // send draw data to worker
        loadMaksWorkerRef.current?.postMessage({
          type: 'draw',
          maskStrokes: maskStrokes,
          strokes: mainStrokes || []
        });
      } catch (error) {
        console.log('error---', error);
      }
    };

    const redrawStrokes = async (strokes: Stroke[]) => {
      if (!strokes.length && !maskStorkeRef.current.length) {
        clearOverlayCanvas();
        return;
      }

      loadMaskPixs(maskStorkeRef.current, strokes);
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

        const offscreenCanvas = new OffscreenCanvas(
          overlayCanvasRef.current!.width,
          overlayCanvasRef.current!.height
        );

        if (!invertWorkerRef.current) {
          invertWorkerRef.current = new Worker(
            new URL('./invert-worker.ts', import.meta.url),
            {
              type: 'module'
            }
          );
        }

        invertWorkerRef.current.onmessage = (event: any) => {
          if (event.data.type === 'done' && event.data.imageData) {
            // draw the data to the overlay canvas
            const ctx = overlayCanvasRef.current!.getContext('2d')!;
            ctx.putImageData(event.data.imageData, 0, 0);

            isLoadingMaskRef.current = false;
            saveImage();
          }
        };

        // send offscreen canvas to worker
        invertWorkerRef.current?.postMessage(
          { canvas: offscreenCanvas, type: 'init' },
          [offscreenCanvas]
        );

        // send draw data to worker
        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        invertWorkerRef.current?.postMessage({
          type: 'draw',
          width: imageData.width,
          height: imageData.height,
          strokes: strokesRef.current,
          maskStrokes: maskStorkeRef.current
        });
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

      if (imageStatus.isResetNeeded) {
        onReset();
        resetCanvas();
      } else if (
        (strokesRef.current.length || maskStorkeRef.current.length) &&
        imageStatus.isOriginal &&
        !negativeMaskRef.current
      ) {
        redrawStrokes(strokesRef.current);
      } else if (
        (strokesRef.current.length || maskStorkeRef.current.length) &&
        imageStatus.isOriginal &&
        negativeMaskRef.current
      ) {
        invertPainting(true);
      }
      console.log('Image status:', imageStatus, negativeMaskRef.current);

      updateCursorSize();
    }, [drawImage, imageStatus.isOriginal, imageStatus.isResetNeeded]);

    const handleFitView = () => {
      fitView();
      setActiveScale(autoScale.current);
      updateCursorSize();
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
    };

    useEffect(() => {
      initializeImage();
    }, [initializeImage]);

    useEffect(() => {
      const handleUndoShortcut = (e: KeyboardEvent) => {
        if (
          (e.ctrlKey || e.metaKey) &&
          e.key === 'z' &&
          !negativeMaskRef.current
        ) {
          undo();
        }
      };
      window.addEventListener('keydown', handleUndoShortcut);

      return () => {
        window.removeEventListener('keydown', handleUndoShortcut);
      };
    }, []);

    useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
        mouseDownState.current = true;
      };

      const handleMouseUp = (e: MouseEvent) => {
        mouseDownState.current = false;
      };

      // mouse down
      window.addEventListener('mousedown', handleMouseDown);

      // mouse up
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        clearTimeout(timer.current);

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
        loadMaskPixs(strokes);
      }
    }));

    useEffect(() => {
      invertWorkerRef.current = new Worker(
        new URL('./invert-worker.ts', import.meta.url),
        {
          type: 'module'
        }
      );

      loadMaksWorkerRef.current = new Worker(
        new URL('./offscreen-worker.ts', import.meta.url),
        {
          type: 'module'
        }
      );

      return () => {
        invertWorkerRef.current?.terminate();
        loadMaksWorkerRef.current?.terminate();
      };
    }, []);

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
            onClear={onReset}
            handleFitView={handleFitView}
            handleUpdateImageList={handleUpdateImageList}
            handleUpdateMaskList={handleUpdateMaskList}
            disabled={disabled}
            lineWidth={lineWidth}
            invertMask={invertMask}
            loading={loading}
            accept={accept}
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
              if (isLoadingMaskRef.current) {
                return;
              }
              mouseDownState.current = true;
              startDrawing(event);
            }}
            onMouseUp={(event) => {
              if (isLoadingMaskRef.current) {
                return;
              }
              mouseDownState.current = false;
              endDrawing(event);
            }}
            onMouseEnter={handleMouseEnter}
            onWheel={handleOnWheel}
            onMouseMove={(e) => {
              if (isLoadingMaskRef.current) {
                return;
              }
              handleMouseMove(e);
              draw(e);
            }}
            onMouseLeave={(e) => {
              if (isLoadingMaskRef.current) {
                return;
              }
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
