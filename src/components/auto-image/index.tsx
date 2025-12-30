import fallbackImg from '@/assets/images/img_fallback.png';
import {
  DownloadOutlined,
  EyeOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  SwapOutlined,
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';
import { Image as AntImage, ImageProps, Space } from 'antd';
import { round } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import './index.less';

const AutoImage: React.FC<
  ImageProps & {
    height: number | string;
    width?: number | string;
    autoSize?: boolean;
    preview?: boolean;
    onLoad?: () => void;
  }
> = (props) => {
  const { height = 100, width: w, autoSize, preview = true, ...rest } = props;
  const [width, setWidth] = useState(w || 0);
  const [isError, setIsError] = useState(false);

  const getImgRatio = useCallback((url: string): Promise<{ ratio: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ ratio: round(img.width / img.height, 2) });
      };
      img.onerror = () => {
        resolve({ ratio: 1 });
      };
      img.src = url;
    });
  }, []);

  const handleOnLoad = useCallback(async () => {
    if (autoSize) {
      return;
    }
    const { ratio } = await getImgRatio(props.src || '');

    if (typeof height === 'number') {
      setWidth(height * ratio);
    } else {
      throw new Error('Height must be a number');
    }
  }, [getImgRatio, height, props.src]);

  const onDownload = useCallback(() => {
    const url = props.src || '';
    const filename = Date.now() + '';

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [props.src]);

  const handleImgLoad = useCallback(() => {
    props.onLoad?.();
    setIsError(false);
  }, [props.onLoad]);

  const handleOnError = useCallback((e: any) => {
    setIsError(true);
    e.target.src = fallbackImg;
  }, []);

  useEffect(() => {
    handleOnLoad();
  }, [handleOnLoad]);

  useEffect(() => {
    setWidth(w || 0);
  }, [w]);

  return (
    <AntImage
      {...rest}
      height={isError ? 'auto' : height}
      width={isError ? '100%' : width}
      onError={handleOnError}
      onLoad={handleImgLoad}
      fallback={fallbackImg}
      crossOrigin="anonymous"
      preview={
        preview &&
        !isError && {
          mask: <EyeOutlined />,
          actionsRender: (
            _,
            {
              transform: { scale },
              actions: {
                onFlipY,
                onFlipX,
                onRotateLeft,
                onRotateRight,
                onZoomOut,
                onZoomIn,
                onReset
              }
            }
          ) => (
            <Space size={12} className="toolbar-wrapper">
              <DownloadOutlined onClick={onDownload} />
              <SwapOutlined rotate={90} onClick={onFlipY} />
              <SwapOutlined onClick={onFlipX} />
              <RotateLeftOutlined onClick={onRotateLeft} />
              <RotateRightOutlined onClick={onRotateRight} />
              <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
              <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
              <UndoOutlined onClick={onReset} />
            </Space>
          )
        }
      }
    />
  );
};

export default AutoImage;
