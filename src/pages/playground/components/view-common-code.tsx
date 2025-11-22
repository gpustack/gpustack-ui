import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import CommandViewer from '../../_components/command-viewer';

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
  { label: 'Node.js', value: langMap.javascript }
];

const ViewCodeModal: React.FC<ViewModalProps> = (props) => {
  const { title, open, onCancel, viewCodeContent } = props || {};

  const intl = useIntl();
  const [codeValue, setCodeValue] = useState<string>(viewCodeContent?.curlCode);

  const handleOnChangeLang = (value: string | number) => {
    if (value === langMap.shell) {
      setCodeValue(viewCodeContent?.curlCode);
    }
    if (value === langMap.javascript) {
      setCodeValue(viewCodeContent?.nodeJsCode);
    }
    if (value === langMap.python) {
      setCodeValue(viewCodeContent?.pythonCode);
    }
  };

  const handleClose = () => {
    onCancel();
  };

  useEffect(() => {
    if (open) {
      setCodeValue(viewCodeContent?.curlCode);
    }
  }, [open]);

  return (
    <>
      <Modal
        title={title || intl.formatMessage({ id: 'playground.viewcode' })}
        open={open}
        centered={true}
        onCancel={handleClose}
        destroyOnHidden={true}
        closeIcon={true}
        maskClosable={false}
        keyboard={false}
        width={600}
        footer={null}
      >
        <div style={{ marginBottom: '8px' }}>
          {intl.formatMessage({ id: 'playground.viewcode.info' })}
        </div>
        <div>
          <CommandViewer
            code={codeValue}
            copyText={codeValue}
            options={langOptions}
            defaultValue={langMap.shell}
            onChange={handleOnChangeLang}
          ></CommandViewer>
          <div
            style={{ marginTop: 8, display: 'flex', alignItems: 'baseline' }}
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
