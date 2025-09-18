import ModalFooter from '@/components/modal-footer';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Button, Modal } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  deployFormKeyMap,
  modelSourceMap,
  ScheduleValueMap,
  updateIgnoreFields
} from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { BackendOption, FormData } from '../config/types';
import { generateGPUSelector } from '../config/utils';
import { useCheckCompatibility } from '../hooks';
import ColumnWrapper from './column-wrapper';
import CompatibilityAlert from './compatible-alert';
import DataForm from './data-form';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  updateFormInitials: {
    data: FormData;
    isGGUF: boolean;
  };
  backendOptions: BackendOption[];
  clusterList: Global.BaseOption<
    number,
    { provider: string; state: string | number }
  >[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const UpdateModal: React.FC<AddModalProps> = (props) => {
  const {
    title,
    action,
    open,
    onOk,
    onCancel,
    clusterList,
    updateFormInitials: { isGGUF, data: formData }
  } = props || {};
  const intl = useIntl();
  const {
    setWarningStatus,
    handleBackendChangeBefore,
    checkTokenRef,
    warningStatus
  } = useCheckCompatibility();

  const formRef = useRef<any>(null);
  const submitAnyway = useRef<boolean>(false);
  const originFormData = useRef<any>(null);

  const setOriginalFormData = () => {
    if (!originFormData.current) {
      originFormData.current = _.cloneDeep(formData);
    }
  };

  const customizer = (val1: any, val2: any) => {
    if (
      (val1 === null && val2 === '') ||
      (val1 === '' && val2 === null) ||
      (_.isEmpty(val1) && val2 === null) ||
      (_.isEmpty(val2) && val1 === null)
    ) {
      return true;
    }
    return undefined;
  };

  const handleOnValuesChange = _.debounce((data: any) => {
    const formdata = formRef.current?.getFieldsValue?.();
    console.log('handleOnValuesChange:', formdata);

    let alldata = {};
    if (formdata.scheduleType === ScheduleValueMap.Manual) {
      alldata = {
        ..._.omit(formdata, ['worker_selector']),
        env: formdata.env || originFormData.current?.env || null,
        gpu_selector: formdata.gpu_selector
      };
    } else {
      alldata = {
        ..._.omit(formdata, ['gpu_selector']),
        env: formdata.env || originFormData.current?.env || null,
        worker_selector:
          formdata.worker_selector ||
          originFormData.current?.worker_selector ||
          null
      };
    }

    const originalData = _.pick(originFormData.current, Object.keys(alldata));
    console.log('alldata:', formdata, alldata, originalData);

    const isEqual = _.isEqualWith(
      _.omit(alldata, updateIgnoreFields),
      _.omit(originalData, updateIgnoreFields),
      customizer
    );
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
  }, 100);

  // voxbox is not support multi gpu
  const handleSetGPUIds = (backend: string) => {
    const gpuids =
      formRef.current?.getFieldValue(['gpu_selector', 'gpu_ids']) || [];

    if (backend === backendOptionsMap.voxBox && gpuids.length > 0) {
      formRef.current?.setFieldValue(['gpu_selector', 'gpu_ids'], [gpuids[0]]);
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
    formRef.current?.setFieldsValue({
      ...updates,
      backend_parameters: [],
      env: null
    });
    handleSetGPUIds(backend);

    const data = formRef.current?.getFieldsValue?.();
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

  const handleAsyncBackendChange = (backend: string) => {
    setTimeout(() => {
      handleBackendChange(backend);
    }, 100);
  };

  const handleSumit = () => {
    formRef.current?.submit();
  };

  const handleSubmitAnyway = async () => {
    submitAnyway.current = true;
    formRef.current?.submit?.();
  };

  const handleOk = async (formdata: FormData) => {
    let submitData = {} as FormData;
    const isVoxBox = [backendOptionsMap.voxBox].includes(formdata.backend);

    submitData = {
      ..._.omit(formdata, ['scheduleType']),
      worker_selector:
        formdata.scheduleType === ScheduleValueMap.Manual
          ? null
          : formdata.worker_selector,
      ...(isVoxBox
        ? {
            distributed_inference_across_workers: false,
            cpu_offloading: false
          }
        : {})
    };
    onOk(submitData);
  };

  const handleManulOnValuesChange = (changedValues: any, allValues: any) => {
    console.log('handleManulOnValuesChange:', { changedValues, allValues });
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

  useEffect(() => {
    const initGPUSelector = async () => {
      const gpuOptions = await formRef.current?.getGPUOptionList({
        clusterId: formData.cluster_id
      });
      const gpuSelector = generateGPUSelector(formData, gpuOptions);
      formRef.current?.setFieldsValue(gpuSelector);
    };

    if (open && formData) {
      setTimeout(() => {
        setOriginalFormData();
        initGPUSelector();
      }, 100);
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
      onCancel={handleOnClose}
      destroyOnHidden={true}
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
        <DataForm
          formKey={deployFormKeyMap.deployment}
          initialValues={formData}
          source={formData.source || ''}
          action={action}
          clusterList={clusterList}
          onOk={handleOk}
          ref={formRef}
          isGGUF={isGGUF}
          backendOptions={props.backendOptions}
          onBackendChange={handleAsyncBackendChange}
          onValuesChange={handleManulOnValuesChange}
        ></DataForm>
      </ColumnWrapper>
    </Modal>
  );
};

export default UpdateModal;
