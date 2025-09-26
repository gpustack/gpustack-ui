import { LoadingOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import EditorWrap from '../editor-wrap';
interface ViewerProps {
  ref?: any;
  lang: string;
  defaultLang?: string;
  config?: any;
  value: string;
  height?: string | number;
  theme?: string;
  header?: React.ReactNode;
  placeholder?: string;
  variant?: 'bordered' | 'borderless';
}

const ViewerEditor: React.FC<ViewerProps> = forwardRef((props, ref) => {
  const {
    lang,
    value,
    config,
    defaultLang,
    height = 380,
    theme = 'vs-dark',
    header,
    variant = 'borderless',
    placeholder
  } = props;

  const editorRef = useRef<any>(null);

  const handleBeforeMount = (monaco: any) => {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [80001]
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
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
    editor: editorRef.current
  }));

  useEffect(() => {
    formatCode();
    setTimeout(() => {
      const lineCount = editorRef.current?.getModel().getLineCount();
      editorRef.current?.revealLine(lineCount);
    }, 100);
  }, [value]);

  return (
    <EditorWrap header={header} variant={variant}>
      <Editor
        height={height}
        theme={theme}
        className="monaco-editor"
        defaultLanguage={defaultLang}
        language={lang}
        value={value}
        options={{
          minimap: { enabled: false },
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6
          },
          placeholder: placeholder
        }}
        loading={<LoadingOutlined style={{ fontSize: 24 }}></LoadingOutlined>}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
      />
    </EditorWrap>
  );
});

export default ViewerEditor;
