import { CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Progress, ProgressProps, Spin } from 'antd';
import classNames from 'classnames';
import { round } from 'lodash';
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
  label?: React.ReactNode;
  uid: number;
  preview?: boolean;
  autoSize?: boolean;
  onDelete: (uid: number) => void;
  onClick?: (item: any) => void;
  autoBgColor?: boolean;
  editable?: boolean;
  style?: React.CSSProperties;
  loadingSize?: ProgressProps['size'];
  progressType?: 'line' | 'circle' | 'dashboard';
  progressColor?: string;
  progressWidth?: number;
}

const SingleImage: React.FC<SingleImageProps> = (props) => {
  const {
    editable,
    onDelete: handleOnDelete,
    onClick,
    autoSize,
    uid,
    loading,
    width,
    height,
    progress,
    maxHeight,
    maxWidth,
    dataUrl = '',
    label,
    style,
    autoBgColor,
    preview = true,
    loadingSize = 'default'
  } = props;

  const imgWrapper = React.useRef<HTMLSpanElement>(null);
  const [imgSize, setImgSize] = React.useState({
    width: width,
    height: height
  });

  const thumImgWrapStyle = React.useMemo(() => {
    return loading ? { width: '100%', height: '100%' } : {};
  }, [loading, imgSize]);

  const handleOnClick = useCallback(() => {
    onClick?.(props);
  }, [onClick, props]);

  const handleResize = useCallback(
    (size: { width: number; height: number }) => {
      if (!autoSize || !size.width || !size.height) return;

      const { width: containerWidth, height: containerHeight } = size;
      const { width: originalWidth, height: originalHeight } = props;

      if (!originalWidth || !originalHeight) return;

      const widthRatio = containerWidth / originalWidth;
      const heightRatio = containerHeight / originalHeight;

      const scale = Math.min(widthRatio, heightRatio, 1);

      const newWidth = originalWidth * scale;
      const newHeight = originalHeight * scale;

      if (newWidth === imgSize.width && newHeight === imgSize.height) {
        return;
      }
      setImgSize({
        width: newWidth,
        height: newHeight
      });
    },
    [autoSize, props.width, props.height]
  );

  const handleOnLoad = React.useCallback(async () => {}, []);

  const renderProgress = () => {
    <Progress
      percent={round(progress, 0)}
      type="dashboard"
      size={loadingSize}
      steps={{ count: 50, gap: 2 }}
      format={() => <span className="font-size-20">{round(progress, 0)}%</span>}
      railColor="var(--ant-color-fill-secondary)"
    />;
  };

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
          style={{ ...thumImgWrapStyle }}
          ref={imgWrapper}
        >
          <>
            {label && <div className="label">{label}</div>}
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
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
                />
              </span>
            ) : (
              <span
                onClick={handleOnClick}
                className="img"
                style={{
                  maxHeight: `min(${maxHeight}, 100%)`,
                  maxWidth: `min(${maxWidth}, 100%)`
                }}
              >
                <AutoImage
                  style={{ objectFit: 'cover' }}
                  preview={preview}
                  autoSize={autoSize}
                  src={dataUrl}
                  width={imgSize.width || '100%'}
                  height={imgSize.height || 100}
                  onLoad={handleOnLoad}
                />
                {progress && progress < 100 && (
                  <span className="small-progress-wrap">
                    <Progress
                      percent={round(progress, 0)}
                      type="dashboard"
                      size="small"
                      steps={{ count: 25, gap: 3 }}
                      format={() => (
                        <span className="font-size-12">
                          {round(progress, 0)}%
                        </span>
                      )}
                      strokeColor="var(--color-white-secondary)"
                      railColor="var(--ant-color-fill-secondary)"
                    />
                  </span>
                )}
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

export default SingleImage;
