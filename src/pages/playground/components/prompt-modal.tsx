import { useIntl } from '@umijs/max';
import { Button, Modal, Typography } from 'antd';
import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import promptList from '../config/prompt';
import '../style/prompt-modal.less';

type ViewModalProps = {
  open: boolean;
  onCancel: () => void;
  onSelect: (list: { role: string; content: string }[]) => void;
};

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel } = props || {};
  const intl = useIntl();
  const handleSelect = (item: {
    title: string;
    data: { role: string; content: string }[];
  }) => {
    props.onSelect(item.data);
    onCancel();
  };

  return (
    <Modal
      title="Prompts"
      open={open}
      centered={true}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={660}
      styles={{
        content: {
          padding: '0'
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          marginBottom: '0'
        }
      }}
      footer={null}
    >
      <SimpleBar style={{ maxHeight: '550px' }}>
        <div className="prompt-wrapper">
          {promptList.map((item, index) => {
            return (
              <div key={index} className="prompt-item">
                <h3 className="title">
                  <span className="text">{item.title}</span>
                  <Button
                    size="middle"
                    type="default"
                    onClick={() => handleSelect(item)}
                  >
                    Apply
                  </Button>
                </h3>
                {item.data.map((data, i) => {
                  return (
                    <div key={i} className="data-item">
                      <span className="role">{data.role}</span>
                      <span className="prompt">
                        <Typography.Paragraph
                          style={{ margin: 0 }}
                          ellipsis={{
                            rows: 2,
                            expandable: true,
                            symbol: 'more'
                          }}
                        >
                          {data.content}
                        </Typography.Paragraph>
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </SimpleBar>
    </Modal>
  );
};

export default React.memo(AddWorker);
