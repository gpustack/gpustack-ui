import EditorWrap from '@/components/editor-wrap';
import HighlightCode from '@/components/highlight-code';
import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Modal } from 'antd';
import React, { useMemo, useState } from 'react';

type ViewModalProps = {
  title?: string;
  open: boolean;
  viewCodeContent: {
    curlCode: string;
    pythonCode: string;
    nodeJsCode: string;
  };
  onCancel: () => void;
};

const langMap = {
  shell: 'bash',
  python: 'python',
  javascript: 'javascript'
};

const langOptions = [
  { label: 'Curl', value: langMap.shell },
  { label: 'Python', value: langMap.python },
  { label: 'Nodejs', value: langMap.javascript }
];

const ViewCodeModal: React.FC<ViewModalProps> = (props) => {
  const { title, open, onCancel, viewCodeContent } = props || {};

  const intl = useIntl();
  const [lang, setLang] = useState<string>(langMap.shell);

  const codeValue = useMemo(() => {
    if (lang === langMap.shell) {
      return viewCodeContent?.curlCode;
    }
    if (lang === langMap.javascript) {
      return viewCodeContent?.nodeJsCode;
    }
    if (lang === langMap.python) {
      return viewCodeContent?.pythonCode;
    }
    return '';
  }, [lang, viewCodeContent]);

  const handleOnChangeLang = (value: string | number) => {
    setLang(value as string);
  };

  const handleClose = () => {
    setLang(langMap.shell);
    onCancel();
  };

  return (
    <>
      <Modal
        title={title || intl.formatMessage({ id: 'playground.viewcode' })}
        open={open}
        centered={true}
        onCancel={handleClose}
        destroyOnClose={true}
        closeIcon={true}
        maskClosable={false}
        keyboard={false}
        width={600}
        footer={null}
      >
        <div style={{ marginBottom: '10px' }}>
          {intl.formatMessage({ id: 'playground.viewcode.info' })}
        </div>
        <div>
          <EditorWrap
            copyText={codeValue}
            langOptions={langOptions}
            defaultValue={langMap.shell}
            showHeader={true}
            onChangeLang={handleOnChangeLang}
            styles={{
              wrapper: {
                backgroundColor: 'var(--color-editor-dark)'
              }
            }}
          >
            <HighlightCode
              height={380}
              theme="dark"
              code={codeValue}
              lang={lang}
              copyable={false}
            ></HighlightCode>
          </EditorWrap>
          <div
            style={{ marginTop: 10, display: 'flex', alignItems: 'baseline' }}
          >
            <BulbOutlined className="m-r-8" />
            <span>
              {intl.formatMessage(
                { id: 'playground.viewcode.tips' },
                {
                  here: (
                    <Button
                      type="link"
                      size="small"
                      href="#/api-keys"
                      target="_blank"
                      style={{ paddingInline: 2 }}
                    >
                      <span>
                        {' '}
                        {intl.formatMessage({
                          id: 'playground.viewcode.here'
                        })}
                      </span>
                    </Button>
                  )
                }
              )}
            </span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default React.memo(ViewCodeModal);
