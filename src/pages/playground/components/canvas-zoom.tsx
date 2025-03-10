import { useEffect, useRef, useState } from 'react';

const ImageCanvas = ({ imageUrl }) => {
  const canvasRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState(null);
  const requestRef = useRef();

  // 加载图片
  useEffect(() => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [imageUrl]);

  // 绘制图片
  const drawImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
      ctx.save();
      ctx.translate(offset.x, offset.y);
      ctx.scale(scale, scale);
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    }

    // 请求下一帧绘制
    requestRef.current = requestAnimationFrame(drawImage);
  };

  // 启动动画循环
  useEffect(() => {
    requestRef.current = requestAnimationFrame(drawImage);
    return () => cancelAnimationFrame(requestRef.current);
  }, [image, scale, offset]);

  // 处理滚轮事件
  const handleWheel = (event) => {
    event.preventDefault();
    const { deltaY, clientX, clientY } = event;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const zoomFactor = deltaY > 0 ? 0.9 : 1.1; // 缩小或放大
    const newScale = scale * zoomFactor;

    // 计算新的偏移量，确保以鼠标位置为中心缩放
    const newOffsetX = mouseX - (mouseX - offset.x) * zoomFactor;
    const newOffsetY = mouseY - (mouseY - offset.y) * zoomFactor;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onWheel={handleWheel}
      style={{ border: '1px solid black' }}
    />
  );
};

export default ImageCanvas;
