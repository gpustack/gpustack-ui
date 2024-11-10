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

const AutoImage: React.FC<ImageProps & { height: number }> = (props) => {
  const { height = 100, ...rest } = props;
  const [width, setWidth] = useState(0);

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
    const { ratio } = await getImgRatio(props.src || '');
    setWidth(height * ratio);
  }, [getImgRatio, height, props.src]);

  const onDownload = () => {
    const url = props.src || '';
    const filename = Date.now() + '';

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  useEffect(() => {
    handleOnLoad();
  }, [handleOnLoad]);

  return (
    <AntImage
      {...rest}
      height={height}
      width={width}
      preview={{
        mask: <EyeOutlined />,
        toolbarRender: (
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
      }}
    />
  );
};

export default AutoImage;
