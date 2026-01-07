import useUserSettings from '@/hooks/use-user-settings';
import { ImportOutlined } from '@ant-design/icons';
import { loader } from '@monaco-editor/react';
import { useIntl } from '@umijs/max';
import { Button, message, Typography, Upload } from 'antd';
import { RcFile } from 'antd/lib/upload';
import * as monaco from 'monaco-editor';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import styled from 'styled-components';
import EditorInner from './editor';

const { Text } = Typography;

loader.config({ monaco });

const Container = styled.div<{ $minHeight: string | number }>`
  min-height: ${({ $minHeight }) =>
    typeof $minHeight === 'number' ? `${$minHeight}px` : $minHeight};
  position: relative;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  .monaco-editor .scroll-decoration {
    box-shadow: none;
  }
`;

const ErrorText = styled(Text)`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 4px 6px;
  background-color: var(--ant-color-bg-elevated);
  border-radius: 0 0 var(--ant-border-radius) var(--ant-border-radius);
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding-inline: 10px;
  font-size: 14px;
  border-bottom: 1px solid var(--ant-color-border);
  background-color: var(--ant-color-fill-quaternary);
`;

interface ViewerProps {
  ref?: any;
  title?: React.ReactNode;
  defaultLang?: string;
  config?: any;
  value: string;
  height?: string | number;
  placeholder?: string;
  variant?: 'bordered' | 'borderless';
  validateMessage?: React.ReactNode;
  schema?: any;
  onUpload?: (content: string) => void;
}

const YamlEditor: React.FC<ViewerProps> = forwardRef((props, ref) => {
  const {
    value,
    height = 380,
    variant = 'borderless',
    schema,
    placeholder,
    validateMessage,
    title,
    onUpload
  } = props;

  const intl = useIntl();
  const { userSettings } = useUserSettings();

  const editorRef = useRef<any>(null);

  const setContent = (val: string) => {
    editorRef.current?.setValue?.(val);
  };

  const beforeUpload = (file: RcFile) => {
    const isYaml =
      file.type === 'application/x-yaml' ||
      file.type === 'text/yaml' ||
      file.name.endsWith('.yaml') ||
      file.name.endsWith('.yml');
    if (!isYaml) {
      message.error('You can only upload YAML file!');
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onUpload?.(content);
        setContent(content);
      } else {
        message.error('Failed to read file content!');
      }
    };
    reader.readAsText(file);
    // Prevent upload
    return false;
  };

  const renderHeader = () => {
    return (
      <Header>
        <span className="title">{title || 'YAML'}</span>
        <Upload
          name="file"
          multiple={false}
          beforeUpload={beforeUpload}
          showUploadList={false}
          accept=".yaml,.yml,text/yaml,application/x-yaml"
        >
          <Button icon={<ImportOutlined />} type="text" size="small">
            {intl.formatMessage({ id: 'common.button.import' })}
          </Button>
        </Upload>
      </Header>
    );
  };

  useImperativeHandle(ref, () => ({
    format: () => {
      editorRef.current?.format();
    },
    getValue: () => {
      return editorRef.current?.getValue?.();
    },
    setValue: (val: string) => {
      editorRef.current?.setValue?.(val);
    },
    dispose: () => {
      editorRef.current?.dispose?.();
    },
    validate() {
      return editorRef.current?.validate();
    },
    editor: editorRef.current
  }));

  useEffect(() => {
    editorRef.current?.format();
  }, [value]);

  return (
    <Container $minHeight={height}>
      <EditorInner
        ref={editorRef}
        header={renderHeader()}
        variant={variant}
        height={height}
        theme={userSettings?.isDarkTheme ? 'vs-dark' : 'vs-light'}
        value={value}
        placeholder={placeholder}
        schema={schema}
      />
      {validateMessage && (
        <ErrorText type="danger">{validateMessage}</ErrorText>
      )}
    </Container>
  );
});

export default YamlEditor;
