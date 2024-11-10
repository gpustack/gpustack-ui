import AutoImage from '@/components/auto-image';
import { CloseCircleOutlined } from '@ant-design/icons';
import _ from 'lodash';
import React, { useCallback } from 'react';
import '../style/thumb-img.less';

const ThumbImg: React.FC<{
  dataList: any[];
  editable?: boolean;
  onDelete: (uid: number) => void;
}> = ({ dataList, editable, onDelete }) => {
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
              <AutoImage src={item.dataUrl} height={100} />
            </span>

            {editable && (
              <span className="del" onClick={() => handleOnDelete(item.uid)}>
                <CloseCircleOutlined />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default React.memo(ThumbImg);
