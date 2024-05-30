import EditorWrap from '@/components/editor-wrap';
import Editor from '@monaco-editor/react';
import { Modal } from 'antd';
import React, { useRef, useState } from 'react';

type ViewModalProps = {
  title: string;
  open: boolean;
  onCancel: () => void;
};

const ViewCodeModal: React.FC<ViewModalProps> = (props) => {
  const { title, open, onCancel } = props || {};
  if (!open) {
    return null;
  }
  const editorRef = useRef(null);
  const [codeValue, setCodeValue] = useState('');
  const [lang, setLang] = useState('json');

  const langOptions = [
    { label: 'curl', value: 'curl' },
    { label: 'JSON', value: 'json' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'Python', value: 'python' }
  ];

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
  };

  const handleOnChangeLang = (value: string) => {
    setLang(value);
  };
  const editorConfig = {
    minimap: {
      enabled: false
    },
    scrollbar: {
      verticalSliderSize: 8
    }
  };
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      style={{ top: '80px' }}
      footer={null}
    >
      <div style={{ marginBottom: '10px' }}>
        You can use the following code to start integrating your current prompt
        and settings into your application.
      </div>
      <EditorWrap
        copyText={codeValue}
        langOptions={langOptions}
        onChangeLang={handleOnChangeLang}
      >
        <Editor
          height="400px"
          theme="vs-dark"
          className="monaco-editor"
          defaultLanguage="javascript"
          defaultValue="// some comment"
          language={lang}
          options={editorConfig}
          onMount={handleEditorDidMount}
        />
      </EditorWrap>
      <div style={{ marginTop: '10px' }}>
        our API Key can be foundhere You should use environment variables or a
        secret management tool to expose your key to your applications.
      </div>
    </Modal>
  );
};

export default ViewCodeModal;
