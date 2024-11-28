import { CloseCircleOutlined } from '@ant-design/icons';
import { Progress } from 'antd';
import classNames from 'classnames';
import * as Vibrant from 'node-vibrant';
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

  const [color, setColor] = React.useState<string>('');
  const imgWrapper = React.useRef<HTMLSpanElement>(null);

  const thumImgWrapStyle = React.useMemo(() => {
    return loading ? { width: width, height: height } : {};
  }, [loading, width, height]);

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
      const rgba = color
        ? `rgba(${color[0]}, ${color[1]}, ${color[2]},0.7)`
        : '';
      setColor(rgba);
    });
  }, []);

  return (
    <div
      key={uid}
      className={classNames('single-image', { 'auto-bg-color': false })}
    >
      {/* {autoBgColor && (
        <div
          className="mask"
          style={{
            background: `url(${dataUrl}) center center / cover no-repeat`
          }}
        ></div>
       */}
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
              <Progress percent={progress} type="circle" />
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
                width={width || 100}
                height={height || 100}
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
  );
};

export default React.memo(SingleImage);
