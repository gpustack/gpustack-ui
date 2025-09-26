import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useUserSettings from '@/hooks/use-user-settings';
import { ImportOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, message, Typography, Upload } from 'antd';
import { RcFile } from 'antd/lib/upload';
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { yamlTemplate } from '../config';
import YamlEditor from './yaml-editor';

const { Text } = Typography;

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
  border-bottom: 1px solid var(--ant-color-border);
  background-color: var(--ant-color-fill-tertiary);
`;

const Container = styled.div`
  position: relative;
  border: 1px solid var(--ant-color-border);
  border-radius: var(--ant-border-radius);
  .monaco-editor .scroll-decoration {
    box-shadow: none;
  }
`;

interface ImportYAMLProps {
  ref?: any;
  action: PageActionType;
  content?: string;
  onSubmit?: (content: string) => void;
}

const ImportYAML: React.FC<ImportYAMLProps> = forwardRef(
  ({ action, content = '' }, ref) => {
    const intl = useIntl();
    const { userSettings } = useUserSettings();
    const editorRef = useRef<any>(null);
    const [fileContent, setFileContent] = useState<string>(
      action === PageAction.CREATE ? yamlTemplate : content
    );
    const [error, setError] = useState<string>('');

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
          setFileContent(content);
        } else {
          message.error('Failed to read file content!');
        }
      };
      reader.readAsText(file);
      // Prevent upload
      return false;
    };

    const validate = () => {
      const markers = editorRef.current?.validate();
      if (markers && markers.length > 0) {
        setError(markers[0].message);
      }
      return markers.length === 0;
    };

    const renderHeader = () => {
      return (
        <Header>
          <span className="title">YAML Editor</span>
          <Upload
            name="file"
            multiple={false}
            beforeUpload={beforeUpload}
            showUploadList={false}
            accept=".yaml,.yml,text/yaml,application/x-yaml"
          >
            <Button icon={<ImportOutlined />} type="text" size="small">
              Import
            </Button>
          </Upload>
        </Header>
      );
    };

    useImperativeHandle(ref, () => ({
      getContent: () => {
        return editorRef.current?.getValue();
      },
      setContent: (val: string) => {
        editorRef.current?.setValue?.(val);
      },
      validate() {
        return validate();
      }
    }));

    return (
      <Container>
        <YamlEditor
          ref={editorRef}
          lang="yaml"
          theme={userSettings?.isDarkTheme ? 'vs-dark' : 'vs-light'}
          value={fileContent}
          height={'calc(100vh - 255px)'}
          header={renderHeader()}
        ></YamlEditor>
        {error && <ErrorText type="danger">{error}</ErrorText>}
      </Container>
    );
  }
);

export default ImportYAML;
