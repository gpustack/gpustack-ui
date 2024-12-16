import {
  DownloadOutlined,
  FormatPainterOutlined,
  SaveOutlined,
  SyncOutlined,
  UndoOutlined
} from '@ant-design/icons';
import { Button, Slider, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.less';

type Point = { x: number; y: number };
type Stroke = { start: Point; end: Point };

type CanvasImageEditorProps = {
  imageSrc: string;
  disabled?: boolean;
  onSave: (imageData: string) => void;
  uploadButton: React.ReactNode;
};

const CanvasImageEditor: React.FC<CanvasImageEditorProps> = ({
  imageSrc,
  disabled,
  onSave,
  uploadButton
}) => {
  const COLOR = 'rgba(0, 0, 255, 0.3)';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineWidth, setLineWidth] = useState<number>(30);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const isDrawing = useRef<boolean>(false);
  const lastPoint = useRef<Point | null>(null);
  const imgLoaded = useRef<boolean>(false);
  const currentPoint = useRef<Point | null>(null);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);

  useEffect(() => {
    console.log('Image src:', imageSrc);
    if (!containerRef.current || !canvasRef.current) return;
    imgLoaded.current = false;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const ctx = canvas!.getContext('2d');

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const container = containerRef.current;
      const scale = Math.min(
        container!.offsetWidth / img.width,
        container!.offsetHeight / img.height,
        1
      );
      canvas!.width = img.width * scale;
      canvas!.height = img.height * scale;
      overlayCanvas!.width = canvas!.width;
      overlayCanvas!.height = canvas!.height;

      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0, canvas!.width, canvas!.height);
      imgLoaded.current = true;
    };
  }, [imageSrc, containerRef.current, canvasRef.current]);

  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (
      !container ||
      !canvas ||
      !overlayCanvas ||
      !overlayCanvas.width ||
      !overlayCanvas.height
    )
      return;
    console.log(
      'disconnect:',
      container,
      canvas,
      overlayCanvas,
      overlayCanvas.width,
      overlayCanvas.height
    );

    // Save current overlay content
    const imgData = overlayCanvas
      .getContext('2d')!
      .getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);

    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      // Recalculate scale
      const scale = Math.min(
        container.offsetWidth / img.width,
        container.offsetHeight / img.height,
        1
      );

      // Update canvas dimensions
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      overlayCanvas.width = canvas.width;
      overlayCanvas.height = canvas.height;

      // Redraw background image
      const ctx = canvas.getContext('2d');
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Restore overlay content
      overlayCanvas.getContext('2d')!.putImageData(imgData, 0, 0);
    };
  }, [imageSrc, containerRef.current, canvasRef.current]);

  const handleMouseEnter = () => {
    setCursorVisible(true);
  };

  const mapMousePosition = (
    e: React.MouseEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setCursorPosition({ x: offsetX, y: offsetY });
  };

  const handleMouseLeave = () => {
    setCursorVisible(false);
    setCursorPosition(null);
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    const container = containerRef.current;
    if (container) resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize, strokes, containerRef.current]);

  const generateMask = useCallback(() => {
    const canvas = overlayCanvasRef.current!;
    const finalImage = document.createElement('canvas');
    finalImage.width = canvas.width;
    finalImage.height = canvas.height;
    const finalCtx = finalImage.getContext('2d');

    // Create the transparent overlay
    finalCtx!.fillStyle = 'black';
    finalCtx!.fillRect(0, 0, finalImage.width, finalImage.height);
    finalCtx!.globalCompositeOperation = 'destination-out';
    finalCtx!.drawImage(canvas, 0, 0);

    onSave(finalImage.toDataURL('image/png'));
  }, [onSave]);

  const downloadMask = useCallback(() => {
    const canvas = overlayCanvasRef.current!;
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext('2d');

    // set the background to black
    maskCtx!.fillStyle = 'black';
    maskCtx!.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    maskCtx!.globalCompositeOperation = 'destination-out';
    maskCtx!.drawImage(canvas, 0, 0);

    const link = document.createElement('a');
    link.download = 'mask.png';
    link.href = maskCanvas.toDataURL('image/png');
    link.click();
  }, []);

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current || !currentPoint.current)
      return;

    const { offsetX, offsetY } = e.nativeEvent;
    currentPoint.current = { x: offsetX, y: offsetY };
    const ctx = overlayCanvasRef.current!.getContext('2d');

    ctx!.save(); // 保存当前状态

    // 1. 清除当前路径重叠的部分
    ctx!.globalCompositeOperation = 'destination-out';
    ctx!.lineWidth = lineWidth;
    ctx!.lineCap = 'round';
    ctx!.lineJoin = 'round';

    ctx!.beginPath();
    ctx!.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx!.lineTo(offsetX, offsetY);
    ctx!.stroke();

    // 2. 重新绘制带颜色的路径
    ctx!.globalCompositeOperation = 'source-over';
    ctx!.strokeStyle = COLOR;
    ctx!.beginPath();
    ctx!.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx!.lineTo(offsetX, offsetY);
    ctx!.stroke();

    ctx!.restore(); // 恢复状态
    // lastPoint.current = { x: offsetX, y: offsetY };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    lastPoint.current = null;
    currentPoint.current = null;
    const { offsetX, offsetY } = e.nativeEvent;
    console.log('Start Drawing:', { x: offsetX, y: offsetY });
    lastPoint.current = { x: offsetX, y: offsetY };
    currentPoint.current = { x: offsetX, y: offsetY };
    draw(e);
  };

  const endDrawing = () => {
    console.log('End Drawing:', lastPoint.current);
    if (!lastPoint.current || !currentPoint.current) return;

    isDrawing.current = false;
    const copyLastPoint = { ...lastPoint.current };
    const copyCurrentPoint = { ...currentPoint.current };
    setStrokes((prevStrokes) => [
      ...prevStrokes,
      {
        start: { x: copyLastPoint!.x, y: copyLastPoint!.y },
        end: { x: copyCurrentPoint!.x, y: copyCurrentPoint!.y }
      }
    ]);
    lastPoint.current = null;
    currentPoint.current = null;

    generateMask();
  };

  const onClear = () => {
    const ctx = overlayCanvasRef.current!.getContext('2d');
    ctx!.clearRect(
      0,
      0,
      overlayCanvasRef.current!.width,
      overlayCanvasRef.current!.height
    );
    setStrokes([]);
    lastPoint.current = null;
  };

  const undo = () => {
    if (strokes.length === 0) return;

    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);

    const ctx = overlayCanvasRef.current!.getContext('2d');
    ctx!.clearRect(
      0,
      0,
      overlayCanvasRef.current!.width,
      overlayCanvasRef.current!.height
    );

    newStrokes.forEach((stroke) => {
      ctx!.globalCompositeOperation = 'source-over';
      ctx!.strokeStyle = COLOR;
      ctx!.lineWidth = lineWidth;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';

      ctx!.beginPath();
      ctx!.moveTo(stroke.start.x, stroke.start.y);
      ctx!.lineTo(stroke.end.x, stroke.end.y);
      ctx!.stroke();
    });
  };

  const download = () => {
    // download the canvasRef as an image
    const canvas = canvasRef.current!;
    const link = document.createElement('a');
    link.download = 'image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    link.remove();
  };

  useEffect(() => {
    const handleUndoShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        undo();
      }
    };

    window.addEventListener('keydown', handleUndoShortcut);
    return () => {
      window.removeEventListener('keydown', handleUndoShortcut);
    };
  }, [strokes]);

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
              onClick={onClear}
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
              <SaveOutlined className="font-size-14" />
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
        style={{ position: 'relative', width: '100%', height: '100%', flex: 1 }}
      >
        <canvas ref={canvasRef} style={{ position: 'absolute', zIndex: 1 }} />
        <canvas
          ref={overlayCanvasRef}
          style={{ position: 'absolute', zIndex: 2 }}
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseMove={(e) => {
            draw(e);
          }}
          onMouseLeave={(e) => {
            endDrawing();
          }}
        />
        {cursorVisible && (
          <div
            style={{
              position: 'absolute',
              top: cursorPosition?.y,
              left: cursorPosition?.x,
              width: lineWidth,
              height: lineWidth,
              backgroundColor: COLOR,
              borderRadius: '50%',
              pointerEvents: 'none',
              zIndex: 3
            }}
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(CanvasImageEditor);
