import IconFont from '@/components/icon-font';
import ModalFooter from '@/components/modal-footer';
import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form, Modal, Tooltip, Typography } from 'antd';
import _ from 'lodash';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { queryGPUList } from '../apis';
import {
  backendOptionsMap,
  modelSourceMap,
  ollamaModelOptions,
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
        title: '',
        label: ` ${item.name}(${item.worker_name})[
            ${intl.formatMessage({ id: 'resources.table.index' })}:${item.index}]`,
        value: item.id
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
        categories: props.data?.categories?.length
          ? props.data.categories[0]
          : null,
        scheduleType: props.data?.gpu_selector ? 'manual' : 'auto',
        gpu_selector: props.data?.gpu_selector || {
          gpu_ids: []
        }
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
            disabled={false}
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
            <SealInput.Input
              label={intl.formatMessage({ id: 'models.form.filename' })}
              required
              loading={loading}
              disabled={false}
            ></SealInput.Input>
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
          <SealAutoComplete
            filterOption
            defaultActiveFirstOption
            disabled={false}
            options={ollamaModelOptions}
            label={intl.formatMessage({ id: 'model.form.ollama.model' })}
            placeholder={intl.formatMessage({ id: 'model.form.ollamaholder' })}
            addAfter={
              <Typography.Link
                href="https://www.ollama.com/library"
                target="_blank"
              >
                <Tooltip
                  title={intl.formatMessage({ id: 'models.form.ollamalink' })}
                  placement="topRight"
                >
                  <IconFont
                    type="icon-external-link"
                    className="font-size-14"
                  ></IconFont>
                </Tooltip>
              </Typography.Link>
            }
            required
          ></SealAutoComplete>
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
            disabled={false}
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

  const handleBackendChange = useCallback((val: string) => {
    if (val === backendOptionsMap.llamaBox) {
      form.setFieldsValue({
        distributed_inference_across_workers: true,
        cpu_offloading: true
      });
    }
    form.setFieldValue('backend_version', '');
  }, []);

  const handleOk = (formdata: FormData) => {
    let obj = {};
    if (formdata.backend === backendOptionsMap.vllm) {
      obj = {
        distributed_inference_across_workers: false,
        cpu_offloading: false
      };
    }
    if (formdata.scheduleType === 'manual') {
      onOk({
        ..._.omit(formdata, ['scheduleType']),
        categories: formdata.categories ? [formdata.categories] : [],
        worker_selector: null,
        gpu_selector: formdata.gpu_selector?.gpu_ids?.length
          ? {
              gpu_ids: formdata.gpu_selector.gpu_ids
            }
          : null,
        ...obj
      });
    } else {
      onOk({
        ..._.omit(formdata, ['scheduleType']),
        categories: formdata.categories ? [formdata.categories] : [],
        gpu_selector: null,
        ...obj
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
          <Form.Item name="backend">
            <SealSelect
              onChange={handleBackendChange}
              label={intl.formatMessage({ id: 'models.form.backend' })}
              options={[
                {
                  label: `llama-box`,
                  value: backendOptionsMap.llamaBox,
                  disabled:
                    props.data?.source === modelSourceMap.local_path_value
                      ? false
                      : !isGGUF
                },
                {
                  label: 'vLLM',
                  value: backendOptionsMap.vllm,
                  disabled:
                    props.data?.source === modelSourceMap.local_path_value
                      ? false
                      : isGGUF
                },
                {
                  label: 'vox-box',
                  value: backendOptionsMap.voxBox,
                  disabled:
                    props.data?.source === modelSourceMap.ollama_library_value
                }
              ]}
              disabled={
                action === PageAction.EDIT &&
                props.data?.source !== modelSourceMap.local_path_value
              }
            ></SealSelect>
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
            source={props.data?.source || ''}
            isGGUF={props.data?.backend === backendOptionsMap.llamaBox}
          ></AdvanceConfig>
        </Form>
      </SimpleBar>
    </Modal>
  );
};

export default memo(UpdateModal);
