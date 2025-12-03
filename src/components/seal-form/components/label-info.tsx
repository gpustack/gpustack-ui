import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React from 'react';
import './label-info.less';

interface NoteInfoProps {
  required?: boolean;
  label: React.ReactNode;
  description?: React.ReactNode;
  labelExtra?: React.ReactNode;
}
const NoteInfo: React.FC<NoteInfoProps> = (props) => {
  const { required, description, label, labelExtra } = props || {};
  if (!label) return null;
  const renderRequiredStar = required ? (
    <span className="star" style={{ color: 'red' }}>
      ﹡
    </span>
  ) : null;

  const renderQuestionIcon = description ? (
    <span
      className="desc desc-icon"
      style={{ marginLeft: required ? 5 : 0, color: 'gray' }}
    >
      <QuestionCircleOutlined />
    </span>
  ) : null;

  const labelContent = (
    <>
      <span>{label}</span>
      {(required || description) && (
        <span className="note-info">
          {renderRequiredStar}
          {renderQuestionIcon}
        </span>
      )}
    </>
  );

  return (
    <span className="label-text">
      <Tooltip title={description || false}>{labelContent}</Tooltip>
      {labelExtra}
    </span>
  );
};

export default NoteInfo;
