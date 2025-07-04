import _ from 'lodash';
import React, { MutableRefObject, useState } from 'react';

export default function useZoom(props: {
  overlayCanvasRef: any;
  canvasRef: any;
  offscreenCanvasRef: any;
  cursorRef: any;
  lineWidth: number;
  autoScale: MutableRefObject<number>;
  baseScale: MutableRefObject<number>;
  translatePos: MutableRefObject<{ x: number; y: number }>;
  isLoadingMaskRef: MutableRefObject<boolean>;
}) {
  const MIN_SCALE = 0.2;
  const MAX_SCALE = 8;
  const ZOOM_SPEED = 0.1;
  const {
    overlayCanvasRef,
    canvasRef,
    offscreenCanvasRef,
    cursorRef,
    lineWidth,
    translatePos,
    autoScale,
    baseScale,
    isLoadingMaskRef
  } = props;

  const [activeScale, setActiveScale] = useState<number>(1);

  const setCanvasTransformOrigin = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (autoScale.current <= MIN_SCALE) {
      return;
    }

    if (autoScale.current >= MAX_SCALE) {
      return;
    }

    const rect = overlayCanvasRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const originX = mouseX / rect.width;
    const originY = mouseY / rect.height;

    overlayCanvasRef.current!.style.transformOrigin = `${originX * 100}% ${originY * 100}%`;
    canvasRef.current!.style.transformOrigin = `${originX * 100}% ${originY * 100}%`;
    offscreenCanvasRef.current!.style.transformOrigin = `${originX * 100}% ${originY * 100}%`;
  };

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

  const applyCanvasTransform = () => {
    const scale = autoScale.current;
    const transform = `scale(${scale})`;

    overlayCanvasRef.current!.style.transform = transform;
    canvasRef.current!.style.transform = transform;
    offscreenCanvasRef.current!.style.transform = transform;
  };

  const handleZoom = (event: React.WheelEvent<HTMLCanvasElement>) => {
    const scaleChange = event.deltaY > 0 ? -ZOOM_SPEED : ZOOM_SPEED;

    // current mouse position
    const canvas = overlayCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    applyCanvasTransform();

    setCanvasTransformOrigin(event);
    updateZoom(scaleChange, mouseX, mouseY);
  };

  const updateCursorSize = () => {
    cursorRef.current!.style.width = `${lineWidth * autoScale.current}px`;
    cursorRef.current!.style.height = `${lineWidth * autoScale.current}px`;
  };

  const updateCursorPosOnZoom = (e: any) => {
    cursorRef.current!.style.top = `${e.clientY - (lineWidth / 2) * autoScale.current}px`;
    cursorRef.current!.style.left = `${e.clientX - (lineWidth / 2) * autoScale.current}px`;
  };

  const handleOnWheel = (event: any) => {
    if (isLoadingMaskRef.current) {
      return;
    }
    // stop
    handleZoom(event);
    updateCursorSize();
    updateCursorPosOnZoom(event);
    setActiveScale(autoScale.current);
  };

  const throttleHandleOnWheel = _.throttle((event: any) => {
    handleOnWheel(event);
  }, 16);

  return {
    handleOnWheel: handleOnWheel,
    setActiveScale,
    activeScale,
    autoScale,
    baseScale
  };
}
