import EditorWrap from '@/components/editor-wrap';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
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
import createSchema from '../config/schema/create.json';
import updateBuiltinSchema from '../config/schema/update-builtin.json';
import udpateCustomSchema from '../config/schema/update-custom.json';

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
  actionStatus: {
    action: PageActionType;
    isBuiltIn: boolean;
  };
}

const path = 'inmemory://model/config.yaml';

const ViewerEditor: React.FC<ViewerProps> = forwardRef((props, ref) => {
  const {
    value,
    height = 380,
    theme = 'vs-dark',
    header,
    variant = 'borderless',
    actionStatus,
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
          schema:
            actionStatus.action === PageAction.CREATE
              ? createSchema
              : actionStatus.isBuiltIn
                ? updateBuiltinSchema
                : udpateCustomSchema
        }
      ]
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    const uri = monaco.Uri.parse(path);
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
