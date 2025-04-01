import IconFont from '@/components/icon-font';
import ModalFooter from '@/components/modal-footer';
import SealAutoComplete from '@/components/seal-form/auto-complete';
import SealInput from '@/components/seal-form/seal-input';
import SealSelect from '@/components/seal-form/seal-select';
import TooltipList from '@/components/tooltip-list';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import useAppUtils from '@/hooks/use-app-utils';
import { useIntl } from '@umijs/max';
import { Button, Form, Modal, Typography } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  backendOptionsMap,
  backendTipsList,
  getSourceRepoConfigValue,
  localPathTipsList,
  modelSourceMap,
  ollamaModelOptions,
  sourceOptions
} from '../config';
import { FormData, ListItem } from '../config/types';
import { useCheckCompatibility } from '../hooks';
import AdvanceConfig from './advance-config';
import ColumnWrapper from './column-wrapper';
import CompatibilityAlert from './compatible-alert';

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

const UpdateModal: React.FC<AddModalProps> = (props) => {
  const {
    title,
    action,
    open,
    onOk,
    onCancel,
    updateFormInitials: { gpuOptions, isGGUF, data: formData }
  } = props || {};
  const {
    handleShowCompatibleAlert,
    handleUpdateWarning,
    setWarningStatus,
    handleEvaluate,
    generateGPUIds,
    handleOnValuesChange,
    checkTokenRef,
    warningStatus
  } = useCheckCompatibility();
  const { getRuleMessage } = useAppUtils();
  const [form] = Form.useForm();
  const intl = useIntl();
  const localPathCache = useRef<string>('');
  const submitAnyway = useRef<boolean>(false);

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

  // trigger from local_path change or backend change
  const handleBackendChangeHook = async () => {
    const localPath = form.getFieldValue?.('local_path');
    const backend = form.getFieldValue?.('backend');

    const res = handleUpdateWarning?.({
      backend,
      localPath: localPath,
      source: formData?.source as string
    });

    if (!res.show) {
      const values = form.getFieldsValue?.();
      const data = getSourceRepoConfigValue(formData?.source as string, values);
      const evalutionData = await handleEvaluate(
        _.omit(data.values, [
          'cpu_offloading',
          'distributed_inference_across_workers'
        ])
      );
      handleShowCompatibleAlert?.(evalutionData);
    } else {
      setWarningStatus?.(res);
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
    handleBackendChangeHook();
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
            description={<TooltipList list={localPathTipsList}></TooltipList>}
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

  const handleSubmitAnyway = async () => {
    submitAnyway.current = true;
    form.submit?.();
  };

  const handleOk = async (data: FormData) => {
    const formdata = getSourceRepoConfigValue(data.source, data).values;
    let obj = {};
    let submitData = {} as FormData;
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

    submitData = {
      ..._.omit(formdata, ['scheduleType']),
      categories: formdata.categories ? [formdata.categories] : [],
      worker_selector: null,
      ...obj,
      ...(formdata.scheduleType === 'manual'
        ? generateGPUIds(formdata)
        : { gpu_selector: null })
    };

    if (submitAnyway.current) {
      onOk(submitData);
      return;
    }

    const evalutionData = await handleEvaluate(submitData);
    handleShowCompatibleAlert?.(evalutionData);
    if (evalutionData?.compatible) {
      onOk(submitData);
    }
  };

  const onValuesChange = (changedValues: any, allValues: any) => {
    handleOnValuesChange({
      changedValues,
      allValues,
      source: formData?.source as string
    });
  };

  const handleOnClose = () => {
    onCancel?.();
  };

  useEffect(() => {
    if (open && formData) {
      form.setFieldsValue(formData);
    }
    if (!open) {
      checkTokenRef.current?.cancel?.();
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
          <ModalFooter
            onCancel={onCancel}
            onOk={handleSumit}
            showOkBtn={!warningStatus.show}
            extra={
              warningStatus.show && (
                <Button
                  type="primary"
                  onClick={handleSubmitAnyway}
                  style={{ width: '130px' }}
                >
                  {intl.formatMessage({
                    id: 'models.form.submit.anyway'
                  })}
                </Button>
              )
            }
          ></ModalFooter>
        </>
      }
    >
      <ColumnWrapper
        maxHeight={550}
        paddingBottom={
          warningStatus.show
            ? Array.isArray(warningStatus.message)
              ? 100
              : 70
            : 0
        }
        footer={
          <CompatibilityAlert
            showClose={true}
            onClose={() => {
              setWarningStatus({
                show: false,
                message: ''
              });
            }}
            warningStatus={warningStatus}
            contentStyle={{ paddingInline: 0 }}
          ></CompatibilityAlert>
        }
      >
        <Form
          name="addModalForm"
          form={form}
          onFinish={handleOk}
          onValuesChange={onValuesChange}
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
                message: getRuleMessage('input', 'common.table.name')
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
                message: getRuleMessage('select', 'models.form.source')
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
              description={<TooltipList list={backendTipsList}></TooltipList>}
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
                message: getRuleMessage('input', 'models.form.replicas')
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
