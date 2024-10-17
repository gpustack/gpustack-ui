import { Image as AntImage, ImageProps } from 'antd';
import { round } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';

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

  useEffect(() => {
    handleOnLoad();
  }, [handleOnLoad]);

  return <AntImage {...rest} height={height} width={width} />;
};

export default AutoImage;
