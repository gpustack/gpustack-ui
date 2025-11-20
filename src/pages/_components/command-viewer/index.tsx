import CopyButton from '@/components/copy-button';
import EditorWrap from '@/components/editor-wrap';
import HighlightCode from '@/components/highlight-code';
import SegmentLine from '@/components/segment-line';
import React from 'react';
import styled from 'styled-components';

interface ViewerProps {
  code: string;
  copyText?: string;
  options?: Global.BaseOption<string>[];
  defaultValue?: string;
  headerHeight?: number;
  showTitle?: boolean;
  height?: number;
  lang?: string;
  onChange?: (value: string | number) => void;
}

const Header = styled.div`
  width: 100%;
  padding-inline: 12px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--color-editor-header-bg);
`;

const CommandViewer: React.FC<ViewerProps> = (props) => {
  const {
    code,
    copyText = '',
    defaultValue,
    options = [],
    headerHeight = 40,
    height = 380,
    showTitle = false,
    lang,
    onChange
  } = props || {};

  const [value, setValue] = React.useState<string>(defaultValue || '');

  const handlOnChange = (value: string | number) => {
    setValue(value as string);
    onChange?.(value);
  };

  return (
    <EditorWrap
      header={
        <Header>
          <SegmentLine
            height={headerHeight}
            defaultValue={defaultValue}
            value={value}
            size="small"
            options={options}
            showTitle={showTitle}
            onChange={handlOnChange}
          ></SegmentLine>

          <CopyButton
            text={copyText || code}
            size="small"
            style={{
              color: 'rgba(255,255,255,.7)'
            }}
          />
        </Header>
      }
    >
      <HighlightCode
        height={height}
        theme="dark"
        code={code}
        lang={lang || value}
        copyable={false}
      ></HighlightCode>
    </EditorWrap>
  );
};

export default CommandViewer;
