import { Select } from 'antd';
import React from 'react';
import CopyButton from '../copy-button';
import './index.less';

interface EditorwrapProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  showHeader?: boolean;
  copyText: string;
  defaultValue?: string;
  langOptions?: { label: string; value: string }[];
  onChangeLang?: (value: string) => void;
}
const EditorWrap: React.FC<EditorwrapProps> = ({
  header,
  children,
  copyText,
  langOptions,
  onChangeLang,
  defaultValue,
  showHeader = true
}) => {
  const handleChangeLang = (value: string) => {
    onChangeLang?.(value);
  };
  const renderHeader = () => {
    if (header) {
      return <div className="editor-header">{header}</div>;
    }
    if (showHeader) {
      return (
        <div className="editor-header">
          <Select
            defaultValue={defaultValue}
            style={{ width: 120 }}
            size="middle"
            variant="filled"
            options={langOptions}
            onChange={handleChangeLang}
          ></Select>
          <CopyButton
            text={copyText}
            size="small"
            style={{
              color: 'rgba(255,255,255,.7)'
            }}
          />
        </div>
      );
    }
    return null;
  };
  return (
    <div className="editor-wrap">
      {renderHeader()}
      <div className="editor-content">{children}</div>
    </div>
  );
};

export default React.memo(EditorWrap);
