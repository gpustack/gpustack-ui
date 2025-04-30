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
  backendLabelMap,
  backendOptionsMap,
  backendTipsList,
  updateExcludeFields as excludeFields,
  getSourceRepoConfigValue,
  localPathTipsList,
  modelSourceMap,
  ollamaModelOptions,
  sourceOptions
} from '../config';
import { FormContext } from '../config/form-context';
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
  const intl = useIntl();
  const {
    setWarningStatus,
    generateGPUIds,
    handleBackendChangeBefore,
    checkTokenRef,
    warningStatus
  } = useCheckCompatibility();

  const { getRuleMessage } = useAppUtils();
  const [form] = Form.useForm();
  const localPathCache = useRef<string>('');
  const submitAnyway = useRef<boolean>(false);
  const originFormData = useRef<any>(null);
  const timer0 = useRef<any>(null);

  const setOriginalFormData = () => {
    if (!originFormData.current) {
      clearTimeout(timer0.current);
      timer0.current = setTimeout(() => {
        originFormData.current = form.getFieldsValue?.();
      }, 200);
    }
  };

  const customizer = (val1: any, val2: any) => {
    if ((val1 === null && val2 === '') || (val1 === '' && val2 === null)) {
      return true;
    }
    return undefined;
  };

  const handleOnValuesChange = (data: any) => {
    const formdata = form.getFieldsValue?.();

    let alldata = {};
    if (formdata.scheduleType === 'manual') {
      alldata = {
        ..._.omit(formdata, ['worker_selector']),
        env: formdata.env || {},
        gpu_selector:
          formdata.gpu_selector?.gpu_ids?.length > 0
            ? originFormData.current?.gpu_selector
            : null
      };
    } else {
      alldata = {
        ..._.omit(formdata, ['gpu_selector']),
        env: formdata.env || {},
        worker_selector:
          formdata.worker_selector ||
          originFormData.current?.worker_selector ||
          null
      };
    }

    const originalData = _.pick(originFormData.current, Object.keys(alldata));

    const isEqual = _.isEqualWith(alldata, originalData, customizer);
    if (isEqual) {
      setWarningStatus({
        show: false,
        message: ''
      });
    } else {
      setWarningStatus({
        show: true,
        isDefault: true,
        message: intl.formatMessage({
          id: 'models.form.update.tips'
        })
      });
    }
  };

  // voxbox is not support multi gpu
  const handleSetGPUIds = (backend: string) => {
    const gpuids = form.getFieldValue(['gpu_selector', 'gpu_ids']) || [];

    if (backend === backendOptionsMap.voxBox && gpuids.length > 0) {
      form.setFieldValue(['gpu_selector', 'gpu_ids'], [gpuids[0]]);
    }
  };

  const handleBackendChange = (backend: string) => {
    const updates = {
      backend_version: ''
    };
    if (backend === backendOptionsMap.llamaBox) {
      Object.assign(updates, {
        distributed_inference_across_workers: true,
        cpu_offloading: true
      });
    }
    form.setFieldsValue({ ...updates, backend_parameters: [], env: null });
    handleSetGPUIds(backend);

    const data = form.getFieldsValue?.();
    const res = handleBackendChangeBefore(data);
    if (res.show) {
      return;
    }
    if (data.local_path || data.source !== modelSourceMap.local_path_value) {
      handleOnValuesChange?.({
        changedValues: {},
        allValues:
          backend === backendOptionsMap.llamaBox
            ? data
            : _.omit(data, [
                'cpu_offloading',
                'distributed_inference_across_workers'
              ]),
        source: data.source
      });
    }
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
    let backend = form.getFieldValue('backend');

    if (
      !isEndwithGGUF &&
      !isBlobFile &&
      backend === backendOptionsMap.llamaBox
    ) {
      backend = backendOptionsMap.vllm;
    } else if (isEndwithGGUF || isBlobFile) {
      backend = backendOptionsMap.llamaBox;
    }
    form.setFieldValue('backend', backend);
    handleBackendChange?.(backend);
  };

  const handleOnBlur = (e: any) => {
    const value = e.target.value;
    if (value) {
      handleOnValuesChange?.({
        changedValues: {},
        allValues: {
          ...form.getFieldsValue?.()
        },
        source: formData?.source
      });
    }
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
            onBlur={handleOnBlur}
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
              onBlur={handleOnBlur}
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
            onBlur={handleOnBlur}
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

    let submitData = {} as FormData;
    const isVoxBox = [backendOptionsMap.voxBox].includes(formdata.backend);

    submitData = {
      ..._.omit(formdata, ['scheduleType']),
      categories: formdata.categories ? [formdata.categories] : [],
      worker_selector:
        formdata.scheduleType === 'manual' ? null : formdata.worker_selector,
      ...(isVoxBox
        ? {
            distributed_inference_across_workers: false,
            cpu_offloading: false
          }
        : {}),
      ...generateGPUIds(formdata)
    };
    onOk(submitData);
  };

  const onValuesChange = (changedValues: any, allValues: any) => {
    const fieldName = Object.keys(changedValues)[0];
    if (excludeFields.includes(fieldName)) {
      return;
    }
    handleOnValuesChange({
      changedValues,
      allValues,
      source: formData?.source as string
    });
  };

  const handleManulOnValuesChange = (changedValues: any, allValues: any) => {
    handleOnValuesChange({
      changedValues,
      allValues,
      source: formData?.source as string
    });
  };

  const handleOnClose = () => {
    onCancel?.();
  };

  const showExtraButton = useMemo(() => {
    return (
      warningStatus.show &&
      warningStatus.type !== 'success' &&
      !warningStatus.isDefault
    );
  }, [warningStatus.show, warningStatus.type, warningStatus.isDefault]);

  const isVllmOrAscend = useMemo(() => {
    return (
      formData?.backend === backendOptionsMap.vllm ||
      formData?.backend === backendOptionsMap.ascendMindie
    );
  }, [formData?.backend]);

  useEffect(() => {
    if (open && formData) {
      setOriginalFormData();
    }
    if (!open) {
      checkTokenRef.current?.cancel?.();
      originFormData.current = null;
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
            showOkBtn={!showExtraButton}
            extra={
              showExtraButton && (
                <Button type="primary" onClick={handleSubmitAnyway}>
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
          warningStatus.show ? (warningStatus.isDefault ? 50 : 100) : 0
        }
        footer={
          <>
            <CompatibilityAlert
              showClose={false}
              onClose={() => {
                setWarningStatus({
                  show: false,
                  message: ''
                });
              }}
              warningStatus={warningStatus}
              contentStyle={{ paddingInline: 0 }}
            ></CompatibilityAlert>
          </>
        }
      >
        <FormContext.Provider
          value={{
            onValuesChange: handleManulOnValuesChange
          }}
        >
          <Form
            name="updateModalForm"
            form={form}
            onFinish={handleOk}
            onValuesChange={onValuesChange}
            scrollToFirstError={true}
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
                    label: backendLabelMap[backendOptionsMap.llamaBox],
                    value: backendOptionsMap.llamaBox,
                    disabled:
                      formData?.source === modelSourceMap.local_path_value
                        ? false
                        : !isGGUF
                  },
                  {
                    label: backendLabelMap[backendOptionsMap.vllm],
                    value: backendOptionsMap.vllm,
                    disabled:
                      formData?.source === modelSourceMap.local_path_value ||
                      isVllmOrAscend
                        ? false
                        : isGGUF
                  },
                  {
                    label: backendLabelMap[backendOptionsMap.ascendMindie],
                    value: backendOptionsMap.ascendMindie,
                    disabled:
                      formData?.source === modelSourceMap.local_path_value ||
                      isVllmOrAscend
                        ? false
                        : isGGUF
                  },
                  {
                    label: backendLabelMap[backendOptionsMap.voxBox],
                    value: backendOptionsMap.voxBox,
                    disabled:
                      formData?.source !== modelSourceMap.local_path_value ||
                      !isVllmOrAscend
                  }
                ]}
                disabled={
                  action === PageAction.EDIT &&
                  formData?.source !== modelSourceMap.local_path_value &&
                  !isVllmOrAscend
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
                scaleSize={true}
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
        </FormContext.Provider>
      </ColumnWrapper>
    </Modal>
  );
};

export default UpdateModal;
