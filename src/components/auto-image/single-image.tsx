import { CloseCircleOutlined } from '@ant-design/icons';
import { Progress } from 'antd';
import classNames from 'classnames';
import * as Vibrant from 'node-vibrant';
import ResizeObserver from 'rc-resize-observer';
import React from 'react';
import AutoImage from './index';
import './single-image.less';

interface SingleImageProps {
  loading?: boolean;
  width?: number;
  height?: number;
  progress?: number;
  maxHeight?: number;
  maxWidth?: number;
  dataUrl: string;
  uid: number;
  autoSize?: boolean;
  onDelete: (uid: number) => void;
  autoBgColor?: boolean;
  editable?: boolean;
}

const SingleImage: React.FC<SingleImageProps> = (props) => {
  const {
    editable,
    onDelete: handleOnDelete,
    autoSize,
    uid,
    loading,
    width,
    height,
    progress,
    maxHeight,
    maxWidth,
    dataUrl,
    autoBgColor
  } = props;

  const [color, setColor] = React.useState({});
  const imgWrapper = React.useRef<HTMLSpanElement>(null);
  const [imgSize, setImgSize] = React.useState({
    width: width,
    height: height
  });
  const [originSize, setOriginSize] = React.useState({
    width: width,
    height: height
  });

  const thumImgWrapStyle = React.useMemo(() => {
    return loading ? { width: '100%', height: '100%' } : {};
  }, [loading, imgSize]);

  const handleResize = React.useCallback(
    async (size: { width: number; height: number }) => {
      if (!autoSize || !dataUrl) return;

      const { width: containerWidth, height: containerHeight } = size;
      const { width: originalWidth, height: originalHeight } = props;

      console.log('size:', size, originalWidth, originalHeight);

      if (!originalWidth || !originalHeight) return;

      const imageAspectRatio = originalWidth / originalHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      let newWidth, newHeight;

      if (containerAspectRatio > imageAspectRatio) {
        newHeight = containerHeight;
        newWidth = containerHeight * imageAspectRatio;
      } else {
        newWidth = containerWidth;
        newHeight = containerWidth / imageAspectRatio;
      }

      setImgSize({
        width: newWidth,
        height: newHeight
      });
    },
    [autoSize, dataUrl, props]
  );

  const handleOnLoad = React.useCallback(async () => {
    if (!autoBgColor) {
      return;
    }

    const img = imgWrapper.current?.querySelector('img');
    if (!img) {
      return;
    }

    Vibrant.from(img.src).getPalette((err: any, palette: any) => {
      if (err) {
        console.error(err);
        return;
      }
      const color = palette?.Vibrant?.rgb;
      const mutedColor = palette?.Muted?.rgb;

      const startColor = color
        ? `rgba(${color[0]}, ${color[1]}, ${color[2]},0.7)`
        : '';
      const stopColor = mutedColor
        ? `rgba(${mutedColor[0]}, ${mutedColor[1]}, ${mutedColor[2]},0.5)`
        : '';
      setColor({
        backgroundImage: `linear-gradient(135deg, ${startColor}, ${stopColor})`
      });
    });
  }, [autoBgColor]);

  const getImgSize = (
    url: string
  ): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  };

  return (
    <ResizeObserver onResize={handleResize}>
      <div
        key={uid}
        className={classNames('single-image', {
          'auto-bg-color': autoBgColor,
          'auto-size': autoSize,
          loading: loading
        })}
      >
        {autoBgColor && (
          <div
            className="mask"
            style={{
              background: `url(${dataUrl}) center center / cover no-repeat`
            }}
          ></div>
        )}
        <span
          className="thumb-img"
          style={{
            ...thumImgWrapStyle
          }}
          ref={imgWrapper}
        >
          <>
            {loading ? (
              <span
                className="progress-wrap"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  border: '1px solid var(--ant-color-split)',
                  borderRadius: 'var(--border-radius-base)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '10px',
                  overflow: 'hidden'
                }}
              >
                <Progress
                  percent={progress}
                  type="dashboard"
                  steps={{ count: 50, gap: 2 }}
                  format={() => (
                    <span className="font-size-20">{progress}%</span>
                  )}
                  trailColor="var(--ant-color-fill-secondary)"
                />
              </span>
            ) : (
              <span
                className="img"
                style={{
                  maxHeight: `min(${maxHeight}, 100%)`,
                  maxWidth: `min(${maxWidth}, 100%)`
                }}
              >
                <AutoImage
                  autoSize={autoSize}
                  src={dataUrl}
                  width={imgSize.width || 100}
                  height={imgSize.height || 100}
                  onLoad={handleOnLoad}
                />
              </span>
            )}
          </>

          {editable && (
            <span className="del" onClick={() => handleOnDelete(uid)}>
              <CloseCircleOutlined />
            </span>
          )}
        </span>
      </div>
    </ResizeObserver>
  );
};

export default React.memo(SingleImage);
