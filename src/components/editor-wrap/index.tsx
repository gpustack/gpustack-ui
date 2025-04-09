import React from 'react';
import styled from 'styled-components';
import CopyButton from '../copy-button';
import SegmentLine from '../segment-line';
import './index.less';

const Wrapper = styled.div<{ $height: number }>`
  height: ${(props) => props.$height}px;
`;

interface EditorwrapProps {
  headerHeight?: number;
  header?: React.ReactNode;
  children: React.ReactNode;
  showHeader?: boolean;
  copyText: string;
  defaultValue?: string;
  langOptions?: Global.BaseOption<string | number>[];
  styles?: {
    wrapper?: React.CSSProperties;
    header?: React.CSSProperties;
    content?: React.CSSProperties;
  };
  onChangeLang?: (value: string | number) => void;
}
const EditorWrap: React.FC<EditorwrapProps> = ({
  headerHeight = 40,
  header,
  children,
  copyText,
  langOptions = [],
  onChangeLang,
  defaultValue,
  styles = {},
  showHeader = true
}) => {
  const handleChangeLang = (value: string | number) => {
    onChangeLang?.(value);
  };
  const renderHeader = () => {
    if (header) {
      return <div className="editor-header">{header}</div>;
    }
    if (showHeader) {
      return (
        <Wrapper className="editor-header" $height={headerHeight}>
          <SegmentLine
            height={headerHeight}
            defaultValue={defaultValue}
            size="small"
            options={langOptions}
            onChange={handleChangeLang}
          ></SegmentLine>
          <CopyButton
            text={copyText}
            size="small"
            style={{
              color: 'rgba(255,255,255,.7)'
            }}
          />
        </Wrapper>
      );
    }
    return null;
  };
  return (
    <div className="editor-wrap" style={{ ...styles.wrapper }}>
      {renderHeader()}
      <div className="editor-content">{children}</div>
    </div>
  );
};

export default React.memo(EditorWrap);
