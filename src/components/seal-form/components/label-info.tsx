import { InfoCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React from 'react';
import './label-info.less';

interface NoteInfoProps {
  required?: boolean;
  label: React.ReactNode;
  description?: React.ReactNode;
}
const NoteInfo: React.FC<NoteInfoProps> = (props) => {
  const { required, description, label } = props || {};
  if (!label) return null;

  return (
    <span className="label-text">
      {description ? (
        <Tooltip title={description}>
          <span>{label}</span>
          <span className="note-info">
            {required && (
              <span style={{ color: 'red' }} className="star">
                *
              </span>
            )}
            <span
              style={{ marginLeft: required ? 5 : 0, color: 'gray' }}
              className="desc"
            >
              <InfoCircleOutlined />
            </span>
          </span>
        </Tooltip>
      ) : (
        <>
          <span>{label}</span>
          <span className="note-info">
            {required && (
              <span style={{ color: 'red' }} className="star">
                *
              </span>
            )}
          </span>
        </>
      )}
    </span>
  );
};

export default NoteInfo;
