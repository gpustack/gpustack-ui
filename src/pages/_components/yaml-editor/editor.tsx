import EditorWrap from '@/components/editor-wrap';
import { LoadingOutlined } from '@ant-design/icons';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { yamlDefaults } from 'monaco-yaml';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';

loader.config({
  monaco
});

interface ViewerProps {
  ref?: any;
  defaultLang?: string;
  config?: any;
  value: string;
  height?: string | number;
  theme?: string;
  header?: React.ReactNode;
  placeholder?: string;
  variant?: 'bordered' | 'borderless';
  schema?: any;
}

const path = 'inmemory://model/config.yaml';

const EditorInner: React.FC<ViewerProps> = forwardRef((props, ref) => {
  const {
    value,
    height = 380,
    theme = 'vs-dark',
    header,
    variant = 'borderless',
    schema,
    placeholder
  } = props;

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const monacoYamlRef = useRef<any>(null);

  const handleBeforeMount = (monaco: any) => {
    const yamlUri = monaco.Uri.parse(path);

    yamlDefaults.setDiagnosticsOptions({
      validate: false,
      enableSchemaRequest: true,
      hover: false,
      schemas: [
        {
          uri: 'http://example.com/schema-name.json',
          fileMatch: [yamlUri.toString()],
          schema: schema
        }
      ]
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  const formatCode = () => {
    if (editorRef.current) {
      setTimeout(() => {
        editorRef.current
          ?.getAction?.('editor.action.formatDocument')
          ?.run()
          .then(() => {
            console.log('format success');
          });
      }, 100);
    }
  };

  // Currently, do not use this function, but keep it for future validation needs
  const getMarkers = () => {
    const uri = editorRef.current?.getModel()?.uri;
    const markers = monacoRef.current?.editor.getModelMarkers({
      resource: uri
    });
    return markers;
  };

  useImperativeHandle(ref, () => ({
    format: () => {
      formatCode();
    },
    getValue: () => {
      return editorRef.current?.getValue?.();
    },
    setValue: (val: string) => {
      editorRef.current?.setValue?.(val);
    },
    dispose: () => {
      editorRef.current?.dispose?.();
      monacoYamlRef.current?.dispose?.();
    },
    validate() {
      return getMarkers();
    },
    editor: editorRef.current
  }));

  useEffect(() => {
    formatCode();
  }, [value]);

  return (
    <EditorWrap header={header} variant={variant}>
      <Editor
        path={path}
        defaultPath={path}
        height={height}
        theme={theme}
        className="monaco-editor"
        defaultLanguage={'yaml'}
        language={'yaml'}
        value={value}
        options={{
          minimap: { enabled: false },
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          fontSize: 14,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6
          }
        }}
        loading={<LoadingOutlined style={{ fontSize: 24 }}></LoadingOutlined>}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
      />
    </EditorWrap>
  );
});

export default EditorInner;
