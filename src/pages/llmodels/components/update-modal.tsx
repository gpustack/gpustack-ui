import ModalFooter from '@/components/modal-footer';
import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form, Modal } from 'antd';
import _ from 'lodash';
import React, { memo, useEffect, useMemo, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { queryGPUList } from '../apis';
import {
  backendOptionsMap,
  modelSourceMap,
  setSourceRepoConfigValue
} from '../config';
import { FormData, GPUListItem, ListItem } from '../config/types';
import AdvanceConfig from './advance-config';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  data?: ListItem;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const SEARCH_SOURCE = [
  modelSourceMap.huggingface_value,
  modelSourceMap.modelscope_value
];

const UpdateModal: React.FC<AddModalProps> = (props) => {
  console.log('addmodel====');
  const { title, action, open, onOk, onCancel } = props || {};
  const [form] = Form.useForm();
  const intl = useIntl();
  const [gpuOptions, setGpuOptions] = useState<any[]>([]);
  const [isGGUF, setIsGGUF] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);

  const getGPUList = async () => {
    const data = await queryGPUList();
    const list = _.map(data.items, (item: GPUListItem) => {
      return {
        ...item,
        label: item.name,
        value: `${item.worker_name}-${item.name}-${item.index}`
      };
    });
    setGpuOptions(list);
  };

  const sourceOptions = [
    {
      label: 'Hugging Face',
      value: modelSourceMap.huggingface_value,
      key: 'huggingface'
    },
    {
      label: 'Ollama Library',
      value: modelSourceMap.ollama_library_value,
      key: 'ollama_library'
    },
    {
      label: 'ModelScope',
      value: modelSourceMap.modelscope_value,
      key: 'model_scope'
    },
    {
      label: intl.formatMessage({ id: 'models.form.localPath' }),
      value: modelSourceMap.local_path_value,
      key: 'local_path'
    }
  ];

  useEffect(() => {
    if (action === PageAction.EDIT && open) {
      const result = setSourceRepoConfigValue(
        props.data?.source || '',
        props.data
      );

      const formData = {
        ...result.values,
        ..._.omit(props.data, result.omits),
        scheduleType: props.data?.gpu_selector ? 'manual' : 'auto',
        gpu_selector: props.data?.gpu_selector
          ? `${props.data?.gpu_selector.worker_name}-${props.data?.gpu_selector.gpu_name}-${props.data?.gpu_selector.gpu_index}`
          : null
      };
      form.setFieldsValue(formData);
    }
  }, [open]);

  useEffect(() => {
    setIsGGUF(props.data?.backend === backendOptionsMap.llamaBox);
  }, [props.data?.backend]);

  const renderHuggingfaceFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="repo_id"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.repoid' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({ id: 'models.form.repoid' })}
            required
            disabled={true}
          ></SealInput.Input>
        </Form.Item>
        {isGGUF && (
          <Form.Item<FormData>
            name="file_name"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.input'
                  },
                  { name: intl.formatMessage({ id: 'models.form.filename' }) }
                )
              }
            ]}
          >
            <SealAutoComplete
              filterOption
              label={intl.formatMessage({ id: 'models.form.filename' })}
              required
              options={[]}
              loading={loading}
              disabled={action === PageAction.EDIT}
            ></SealAutoComplete>
          </Form.Item>
        )}
      </>
    );
  };

  const renderS3Fields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="s3_address"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.s3address' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            label={intl.formatMessage({
              id: 'models.form.s3address'
            })}
            required
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderOllamaModelFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="ollama_library_model_name"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.table.name' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            disabled={action === PageAction.EDIT}
            label={intl.formatMessage({ id: 'model.form.ollama.model' })}
            placeholder={intl.formatMessage({ id: 'model.form.ollamaholder' })}
            required
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderLocalPathFields = () => {
    return (
      <>
        <Form.Item<FormData>
          name="local_path"
          key="local_path"
          rules={[
            {
              required: true,
              message: intl.formatMessage(
                {
                  id: 'common.form.rule.input'
                },
                { name: intl.formatMessage({ id: 'models.form.filePath' }) }
              )
            }
          ]}
        >
          <SealInput.Input
            disabled={action === PageAction.EDIT}
            label={intl.formatMessage({ id: 'models.form.filePath' })}
            required
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderFieldsBySource = useMemo(() => {
    if (SEARCH_SOURCE.includes(props.data?.source || '')) {
      return renderHuggingfaceFields();
    }

    if (props.data?.source === modelSourceMap.ollama_library_value) {
      return renderOllamaModelFields();
    }

    if (props.data?.source === modelSourceMap.s3_value) {
      return renderS3Fields();
    }

    if (props.data?.source === modelSourceMap.local_path_value) {
      return renderLocalPathFields();
    }

    return null;
  }, [props.data?.source, isGGUF, intl]);

  const handleSumit = () => {
    form.submit();
  };

  const handleOk = (formdata: FormData) => {
    if (formdata.scheduleType === 'manual') {
      const gpu = _.find(gpuOptions, (item: any) => {
        return item.value === formdata.gpu_selector;
      });

      onOk({
        ..._.omit(formdata, ['scheduleType']),
        worker_selector: null,
        gpu_selector: gpu
          ? {
              gpu_name: gpu.name,
              gpu_index: gpu.index,
              worker_name: gpu.worker_name
            }
          : null
      });
    } else {
      onOk({
        ..._.omit(formdata, ['scheduleType']),
        gpu_selector: null
      });
    }
  };

  const handleOnClose = () => {
    onCancel?.();
  };

  useEffect(() => {
    getGPUList();
  }, []);

  return (
    <Modal
      title={title}
      open={open}
      centered={true}
      onOk={handleSumit}
      onCancel={onCancel}
      onClose={handleOnClose}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{
        content: {
          padding: '0px'
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '0'
        },
        footer: {
          padding: '0 var(--ant-modal-content-padding)'
        }
      }}
      footer={
        <ModalFooter onCancel={onCancel} onOk={handleSumit}></ModalFooter>
      }
    >
      <SimpleBar
        style={{
          maxHeight: '550px'
        }}
      >
        <Form
          name="addModalForm"
          form={form}
          onFinish={handleOk}
          preserve={false}
          style={{
            padding: 'var(--ant-modal-content-padding)',
            paddingBlock: 0
          }}
        >
          <Form.Item<FormData>
            name="name"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.input'
                  },
                  { name: intl.formatMessage({ id: 'common.table.name' }) }
                )
              }
            ]}
          >
            <SealInput.Input
              label={intl.formatMessage({
                id: 'common.table.name'
              })}
              required
            ></SealInput.Input>
          </Form.Item>
          <Form.Item<FormData>
            name="source"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.select'
                  },
                  { name: intl.formatMessage({ id: 'models.form.source' }) }
                )
              }
            ]}
          >
            {action === PageAction.EDIT && (
              <SealSelect
                disabled={true}
                label={intl.formatMessage({
                  id: 'models.form.source'
                })}
                options={sourceOptions}
                required
              ></SealSelect>
            )}
          </Form.Item>
          {renderFieldsBySource}
          <Form.Item<FormData>
            name="replicas"
            rules={[
              {
                required: true,
                message: intl.formatMessage(
                  {
                    id: 'common.form.rule.input'
                  },
                  {
                    name: intl.formatMessage({ id: 'models.form.replicas' })
                  }
                )
              }
            ]}
          >
            <SealInput.Number
              style={{ width: '100%' }}
              label={intl.formatMessage({
                id: 'models.form.replicas'
              })}
              required
              min={0}
            ></SealInput.Number>
          </Form.Item>
          <Form.Item<FormData> name="description">
            <SealInput.TextArea
              label={intl.formatMessage({
                id: 'common.table.description'
              })}
            ></SealInput.TextArea>
          </Form.Item>

          <AdvanceConfig
            form={form}
            gpuOptions={gpuOptions}
            action={PageAction.EDIT}
            isGGUF={props.data?.backend === backendOptionsMap.llamaBox}
          ></AdvanceConfig>
        </Form>
      </SimpleBar>
    </Modal>
  );
};

export default memo(UpdateModal);
