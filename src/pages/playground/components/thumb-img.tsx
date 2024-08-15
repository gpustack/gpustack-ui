import { CloseCircleOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import _ from 'lodash';
import React from 'react';
import '../style/thumb-img.less';

const ThumbImg: React.FC<{
  dataList: any[];
  onDelete: (uid: number) => void;
}> = ({ dataList, onDelete }) => {
  const handleOnDelete = (uid: number) => {
    onDelete(uid);
  };

  return (
    <Space wrap size={10} className="thumb-list-wrap">
      {_.map(dataList, (item: any) => {
        return (
          <span key={item.uid} className="thumb-img">
            <span
              style={{ backgroundImage: `url(${item.dataUrl})` }}
              className="img"
            ></span>
            <span className="del" onClick={() => handleOnDelete(item.uid)}>
              <CloseCircleOutlined />
            </span>
          </span>
        );
      })}
    </Space>
  );
};

export default ThumbImg;
