import AlertBlockInfo from '@/components/alert-info/block';
import IconFont from '@/components/icon-font';
import ModalFooter from '@/components/modal-footer';
import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Form, Modal, Typography } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  backendOptionsMap,
  modelSourceMap,
  ollamaModelOptions
} from '../config';
import { FormData, ListItem } from '../config/types';
import AdvanceConfig from './advance-config';
import ColumnWrapper from './column-wrapper';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  updateFormInitials: {
    data?: ListItem;
    gpuOptions: any[];
    isGGUF: boolean;
  };
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const SEARCH_SOURCE = [
  modelSourceMap.huggingface_value,
  modelSourceMap.modelscope_value
];

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
    label: 'models.form.localPath',
    value: modelSourceMap.local_path_value,
    locale: true,
    key: 'local_path'
  }
];

const UpdateModal: React.FC<AddModalProps> = (props) => {
  const {
    title,
    action,
    open,
    onOk,
    onCancel,
    updateFormInitials: { gpuOptions, isGGUF, data: formData }
  } = props || {};
  const [form] = Form.useForm();
  const intl = useIntl();
  const localPathCache = useRef<string>('');
  const [warningStatus, setWarningStatus] = useState<{
    show: boolean;
    message: string;
  }>({
    show: false,
    message: ''
  });

  const handleSetGPUIds = (backend: string) => {
    if (backend === backendOptionsMap.llamaBox) {
      return;
    }
    const gpuids = form.getFieldValue(['gpu_selector', 'gpu_ids']);

    if (!gpuids?.length) {
      return;
    }
    if (gpuids.length > 1 && Array.isArray(gpuids[0])) {
      form.setFieldValue(['gpu_selector', 'gpu_ids'], [gpuids[0]]);
    }
  };

  const updateShowWarning = (backend: string) => {
    const localPath = form.getFieldValue?.('local_path');

    const isBlobFile = localPath?.split('/').pop()?.includes('sha256');

    if (isBlobFile) {
      setWarningStatus({
        show: false,
        message: ''
      });
      return;
    }

    if (formData?.source !== modelSourceMap.local_path_value || !localPath) {
      return;
    }

    if (localPath.endsWith('.gguf') && backend !== backendOptionsMap.llamaBox) {
      setWarningStatus({
        show: true,
        message: 'models.form.backend.warning'
      });
    } else if (
      !localPath.endsWith('.gguf') &&
      backend === backendOptionsMap.llamaBox
    ) {
      setWarningStatus({
        show: true,
        message: 'models.form.backend.warning.llamabox'
      });
    } else {
      setWarningStatus({
        show: false,
        message: ''
      });
    }
  };

  const handleBackendChange = (val: string) => {
    if (val === backendOptionsMap.llamaBox) {
      form.setFieldsValue({
        distributed_inference_across_workers: true,
        cpu_offloading: true
      });
    }
    form.setFieldValue('backend_version', '');
    handleSetGPUIds(val);
    updateShowWarning(val);
  };

  const handleOnFocus = () => {
    localPathCache.current = form.getFieldValue('local_path');
  };

  const handleLocalPathBlur = (e: any) => {
    const value = e.target.value;
    if (value === localPathCache.current && value) {
      return;
    }
    const isEndwithGGUF = _.endsWith(value, '.gguf');
    const isBlobFile = value.split('/').pop().includes('sha256');
    let backend = backendOptionsMap.llamaBox;
    if (!isEndwithGGUF || !isBlobFile) {
      backend = backendOptionsMap.vllm;
    }
    handleBackendChange?.(backend);
    form.setFieldValue('backend', backend);
  };

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
              disabled={false}
            ></SealInput.Input>
          </Form.Item>
        )}
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
            placeholder={intl.formatMessage({ id: 'model.form.ollamaholder' })}
            description={
              <span>
                <span>
                  {intl.formatMessage({ id: 'models.form.ollamalink' })}
                </span>
                <Typography.Link
                  className="flex-center"
                  href="https://www.ollama.com/library"
                  target="_blank"
                >
                  <IconFont
                    type="icon-external-link"
                    className="font-size-14"
                  ></IconFont>
                </Typography.Link>
              </span>
            }
            label={intl.formatMessage({ id: 'model.form.ollama.model' })}
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
            onBlur={handleLocalPathBlur}
            onFocus={handleOnFocus}
            disabled={false}
            label={intl.formatMessage({ id: 'models.form.filePath' })}
            required
          ></SealInput.Input>
        </Form.Item>
      </>
    );
  };

  const renderFieldsBySource = useMemo(() => {
    if (SEARCH_SOURCE.includes(formData?.source || '')) {
      return renderHuggingfaceFields();
    }

    if (formData?.source === modelSourceMap.ollama_library_value) {
      return renderOllamaModelFields();
    }

    if (formData?.source === modelSourceMap.local_path_value) {
      return renderLocalPathFields();
    }

    return null;
  }, [formData?.source, isGGUF, intl]);

  const handleSumit = () => {
    form.submit();
  };

  const generateGPUIds = (data: FormData) => {
    const gpu_ids = _.get(data, 'gpu_selector.gpu_ids', []);
    if (!gpu_ids.length) {
      return {};
    }

    const result = _.reduce(
      gpu_ids,
      (acc: string[], item: string | string[], index: number) => {
        if (Array.isArray(item)) {
          acc.push(item[1]);
        } else if (index === 1) {
          acc.push(item);
        }
        return acc;
      },
      []
    );

    if (result.length) {
      return {
        gpu_selector: {
          gpu_ids: result
        }
      };
    }
    return {};
  };

  const handleOk = (formdata: FormData) => {
    let obj = {};
    if (
      [backendOptionsMap.vllm, backendOptionsMap.voxBox].includes(
        formdata.backend
      )
    ) {
      obj = {
        distributed_inference_across_workers: false,
        cpu_offloading: false
      };
    }
    if (formdata.scheduleType === 'manual') {
      const gpuSelector = generateGPUIds(formdata);
      onOk({
        ..._.omit(formdata, ['scheduleType']),
        categories: formdata.categories ? [formdata.categories] : [],
        worker_selector: null,
        gpu_selector: formdata.gpu_selector?.gpu_ids?.length
          ? {
              gpu_ids: formdata.gpu_selector.gpu_ids
            }
          : null,
        ...obj,
        ...gpuSelector
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
    if (open && formData) {
      form.setFieldsValue(formData);
    }
    if (!open) {
      setWarningStatus({
        show: false,
        message: ''
      });
    }
  }, [open, formData]);

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
          padding: '0 0 16px 0'
        },
        header: {
          padding: 'var(--ant-modal-content-padding)',
          paddingBottom: '0'
        },
        body: {
          padding: '0'
        },
        footer: {
          padding: '16px 24px',
          margin: '0'
        }
      }}
      footer={
        <>
          <ModalFooter onCancel={onCancel} onOk={handleSumit}></ModalFooter>
        </>
      }
    >
      <ColumnWrapper
        maxHeight={550}
        paddingBottom={warningStatus.show ? 100 : 0}
        footer={
          <>
            {warningStatus.show && (
              <AlertBlockInfo
                ellipsis={false}
                message={
                  <span
                    dangerouslySetInnerHTML={{
                      __html: intl.formatMessage({
                        id: warningStatus.message
                      })
                    }}
                  ></span>
                }
                title={intl.formatMessage({
                  id: 'common.text.tips'
                })}
                type="warning"
              ></AlertBlockInfo>
            )}
          </>
        }
      >
        <Form
          name="addModalForm"
          form={form}
          onFinish={handleOk}
          preserve={false}
          clearOnDestroy={true}
          initialValues={{
            ...formData
          }}
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
          <Form.Item name="backend" rules={[{ required: true }]}>
            <SealSelect
              required
              onChange={handleBackendChange}
              label={intl.formatMessage({ id: 'models.form.backend' })}
              options={[
                {
                  label: `llama-box`,
                  value: backendOptionsMap.llamaBox,
                  disabled:
                    formData?.source === modelSourceMap.local_path_value
                      ? false
                      : !isGGUF
                },
                {
                  label: 'vLLM',
                  value: backendOptionsMap.vllm,
                  disabled:
                    formData?.source === modelSourceMap.local_path_value
                      ? false
                      : isGGUF
                },
                {
                  label: 'vox-box',
                  value: backendOptionsMap.voxBox,
                  disabled:
                    formData?.source === modelSourceMap.ollama_library_value ||
                    isGGUF
                }
              ]}
              disabled={
                action === PageAction.EDIT &&
                formData?.source !== modelSourceMap.local_path_value
              }
            ></SealSelect>
          </Form.Item>
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
              description={intl.formatMessage(
                {
                  id: 'models.form.replicas.tips'
                },
                { api: `${window.location.origin}/v1` }
              )}
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
            source={formData?.source || ''}
            isGGUF={formData?.backend === backendOptionsMap.llamaBox}
          ></AdvanceConfig>
        </Form>
      </ColumnWrapper>
    </Modal>
  );
};

export default UpdateModal;
