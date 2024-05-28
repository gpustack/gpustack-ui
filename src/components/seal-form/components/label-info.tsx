import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React from 'react';
import './label-info.less';

interface NoteInfoProps {
  required?: boolean;
  label: string;
  description?: React.ReactNode;
}
const NoteInfo: React.FC<NoteInfoProps> = (props) => {
  const { required, description, label } = props || {};
  return (
    <span className="label-text">
      <span>{label}</span>
      <span className="note-info">
        {required && (
          <span style={{ color: 'red' }} className="star">
            *
          </span>
        )}
        {description && (
          <span style={{ marginLeft: 5, color: 'gray' }} className="desc">
            <Tooltip title={description}>
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        )}
      </span>
    </span>
  );
};

export default NoteInfo;
