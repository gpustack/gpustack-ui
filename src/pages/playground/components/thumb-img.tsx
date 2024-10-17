import AutoImage from '@/components/auto-image';
import { CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import _ from 'lodash';
import React, { useCallback } from 'react';
import '../style/thumb-img.less';

const ThumbImg: React.FC<{
  dataList: any[];
  onDelete: (uid: number) => void;
}> = ({ dataList, onDelete }) => {
  const handleOnDelete = useCallback(
    (uid: number) => {
      onDelete(uid);
    },
    [onDelete]
  );

  if (_.isEmpty(dataList)) {
    return null;
  }

  return (
    <div className="thumb-list-wrap">
      {_.map(dataList, (item: any) => {
        return (
          <span
            key={item.uid}
            className="thumb-img"
            style={{
              width: item.width,
              height: item.height
            }}
          >
            <span className="img">
              <AutoImage
                src={item.dataUrl}
                height={100}
                preview={{
                  mask: <EyeOutlined />
                }}
              />
            </span>

            <span className="del" onClick={() => handleOnDelete(item.uid)}>
              <CloseCircleOutlined />
            </span>
          </span>
        );
      })}
    </div>
  );
};

export default React.memo(ThumbImg);
