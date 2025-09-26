import EditorWrap from '@/components/editor-wrap';
import { LoadingOutlined } from '@ant-design/icons';
import Editor, { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import schema from '../config/schema.json';

loader.config({ monaco });

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

const path = 'inmemory://model/config.yaml';

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
  const monacoRef = useRef<any>(null);
  const monacoYamlRef = useRef<any>(null);

  const handleBeforeMount = (monaco: any) => {
    const yamlUri = monaco.Uri.parse(path);

    configureMonacoYaml(monaco, {
      schemas: [
        {
          uri: 'http://example.com/schema-name.json',
          fileMatch: [yamlUri.toString()],
          schema
        }
      ]
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    const uri = monaco.Uri.parse(path);

    // monaco.editor.onDidChangeMarkers((uris: string[]) => {
    //   if (!uris.some((u) => u.toString() === uri.toString())) return;

    //   const model = monaco.editor.getModel(uri);
    //   if (!model) return;
    //   console.log('Markers changed:', uris);
    //   const markers = monaco.editor.getModelMarkers({ resource: uri });
    //   const adjusted = markers.map((m: any) => {
    //     if (m._adjusted) return m;
    //     return {
    //       ...m,
    //       _adjusted: true,
    //       severity: monaco.MarkerSeverity.ErrorText
    //     };
    //   });

    //   monaco.editor.setModelMarkers(
    //     monaco.editor.getModel(uri),
    //     'yaml',
    //     adjusted
    //   );
    // });
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

  const getMarkers = () => {
    const uri = editorRef.current?.getModel()?.uri;
    const markers = monacoRef.current?.editor.getModelMarkers({
      resource: uri
    });
    console.log('Validation markers:', uri, markers);
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
