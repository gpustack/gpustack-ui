import EditorWrap from '@/components/editor-wrap';
import HighlightCode from '@/components/highlight-code';
import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Modal } from 'antd';
import React, { useEffect, useState } from 'react';

type ViewModalProps = {
  parameters: any;
  title: string;
  open: boolean;
  api: string;
  payload?: Record<string, any>;
  logcommand: Record<string, any>;
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
  { label: 'JavaScript', value: langMap.javascript }
];

const ViewCodeModal: React.FC<ViewModalProps> = (props) => {
  const {
    title,
    open,
    onCancel,
    payload,
    parameters = {},
    api,
    logcommand
  } = props || {};

  const intl = useIntl();
  const [codeValue, setCodeValue] = useState('');
  const [lang, setLang] = useState(langMap.shell);

  const BaseURL = `${window.location.origin}${api}`;

  const generateCode = () => {
    if (lang === langMap.shell) {
      const code = `curl ${window.location.origin}${api} \\\n-H "Content-Type: application/json" \\\n-H "Authorization: Bearer $\{YOUR_GPUSTACK_API_KEY}" \\\n-d '${JSON.stringify(
        {
          ...parameters,
          ...payload
        },
        null,
        2
      )}'`;
      setCodeValue(code);
    } else if (lang === langMap.javascript) {
      const data = {
        ...parameters,
        ...payload
      };
      const headers = {
        'Content-type': 'application/json',
        Authorization: `Bearer $\{YOUR_GPUSTACK_API_KEY}`
      };
      const code = `import axios from 'axios';\n\nconst url = "${BaseURL}";\n\nconst headers = ${JSON.stringify(headers, null, 2)};\n\nconst data = ${JSON.stringify(data, null, 2)};\n\naxios.post(url, data, { headers }).then((response) => {\n  console.log(response.${logcommand.node});\n});`;
      setCodeValue(code);
    } else if (lang === langMap.python) {
      const data = {
        ...parameters,
        ...payload
      };
      const headers = {
        'Content-type': 'application/json',
        Authorization: `Bearer $\{YOUR_GPUSTACK_API_KEY}`
      };
      const code = `import requests\n\nurl="${BaseURL}"\n\nheaders = ${JSON.stringify(headers, null, 2)}\n\ndata=${JSON.stringify(data, null, 2)}\n\nresponse = requests.post(url, headers=headers, json=data)\n\nprint(response.${logcommand.python})`;
      setCodeValue(code);
    }
  };

  const handleOnChangeLang = (value: string) => {
    setLang(value);
  };

  const handleClose = () => {
    setLang(langMap.shell);
    onCancel();
  };

  useEffect(() => {
    generateCode();
  }, [lang, parameters, payload]);

  return (
    <>
      <Modal
        title={title}
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

export default ViewCodeModal;
