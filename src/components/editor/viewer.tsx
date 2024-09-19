import Editor from '@monaco-editor/react';
import React, { useEffect, useRef, useState } from 'react';
import EditorWrap from '../editor-wrap';

interface ViewerProps {
  lang: string;
  defaultLang?: string;
  langOptions?: Global.BaseOption<string>[];
  config?: any;
  value: string;
  height?: string | number;
  theme?: string;
  showHeader?: boolean;
}

const ViewerEditor: React.FC<ViewerProps> = (props) => {
  const editorRef = useRef<any>(null);
  const {
    lang,
    value,
    config,
    langOptions,
    defaultLang,
    height = 380,
    showHeader
  } = props;
  const [langType, setLangType] = useState(defaultLang);

  const handleBeforeMount = (monaco: any) => {
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [80001]
    });
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    console.log('loaded====', editor, monaco);
  };

  const handleOnChangeLang = (value: string) => {
    setLangType(value);
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

  useEffect(() => {
    formatCode();
    setTimeout(() => {
      const lineCount = editorRef.current?.getModel().getLineCount(); // 获取总行数
      editorRef.current?.revealLine(lineCount); // 滚动到最后一行
    }, 100); // 可以调整延时，确保编辑器完全加载
  }, [value]);

  return (
    <EditorWrap
      copyText={value}
      langOptions={langOptions}
      defaultValue={lang}
      showHeader={showHeader}
      onChangeLang={handleOnChangeLang}
    >
      <Editor
        height={height}
        theme="vs-dark"
        className="monaco-editor"
        defaultLanguage={defaultLang}
        language={langType}
        value={value}
        options={config}
        beforeMount={handleBeforeMount}
        onMount={handleEditorDidMount}
      />
    </EditorWrap>
  );
};

export default React.memo(ViewerEditor);
