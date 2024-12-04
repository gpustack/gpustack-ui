import { CloseCircleOutlined } from '@ant-design/icons';
import { Progress } from 'antd';
import classNames from 'classnames';
import ResizeObserver from 'rc-resize-observer';
import React, { useCallback } from 'react';
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
  style?: React.CSSProperties;
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
    style,
    autoBgColor
  } = props;

  const [color, setColor] = React.useState({});
  const imgWrapper = React.useRef<HTMLSpanElement>(null);
  const [imgSize, setImgSize] = React.useState({
    width: width,
    height: height
  });

  const thumImgWrapStyle = React.useMemo(() => {
    return loading ? { width: '100%', height: '100%' } : {};
  }, [loading, imgSize]);

  const handleResize = useCallback(
    (size: { width: number; height: number }) => {
      if (!autoSize) return;

      const { width: containerWidth, height: containerHeight } = size;
      const { width: originalWidth, height: originalHeight } = props;

      if (!originalWidth || !originalHeight) return;

      const widthRatio = containerWidth / originalWidth;
      const heightRatio = containerHeight / originalHeight;

      const scale = Math.min(widthRatio, heightRatio, 1);

      const newWidth = originalWidth * scale;
      const newHeight = originalHeight * scale;

      setImgSize({
        width: newWidth,
        height: newHeight
      });
    },
    [autoSize, props.width, props.height]
  );

  const handleOnLoad = React.useCallback(async () => {}, []);

  return (
    <ResizeObserver onResize={handleResize}>
      <div
        style={{ ...style }}
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
