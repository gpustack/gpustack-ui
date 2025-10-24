import ModalFooter from '@/components/modal-footer';
import GSDrawer from '@/components/scroller-modal/gs-drawer';
import { PageActionType } from '@/config/types';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef } from 'react';
import ColumnWrapper from '../../_components/column-wrapper';
import {
  deployFormKeyMap,
  ScheduleValueMap,
  updateIgnoreFields
} from '../config';
import { backendOptionsMap } from '../config/backend-parameters';
import { FormData } from '../config/types';
import { generateGPUSelector } from '../config/utils';
import DataForm from '../forms';
import { useCheckCompatibility } from '../hooks';
import CompatibilityAlert from './compatible-alert';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  updateFormInitials: {
    data: FormData;
    isGGUF: boolean;
  };
  clusterList: Global.BaseOption<
    number,
    { provider: string; state: string | number }
  >[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const ModalFooterStyle = {
  padding: '16px 24px',
  display: 'flex',
  justifyContent: 'flex-end'
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

  const handleBackendChange = (backend: string) => {
    const data = formRef.current?.getFieldsValue?.();
    const res = handleBackendChangeBefore(data);
    if (res.show) {
      return;
    }
    handleOnValuesChange?.({
      changedValues: {},
      allValues: data,
      source: data.source
    });
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
        formRef.current?.getBackendOptions?.({
          cluster_id: formData.cluster_id
        });
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
    <GSDrawer
      title={title}
      open={open}
      onClose={handleOnClose}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{
        body: {
          height: 'calc(100vh - 57px)',
          padding: '16px 0',
          overflowX: 'hidden'
        },
        content: {
          borderRadius: '6px 0 0 6px'
        }
      }}
      footer={false}
    >
      <ColumnWrapper
        styles={{
          container: {
            paddingTop: 0
          }
        }}
        paddingBottom={warningStatus.show ? 100 : 50}
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
            <ModalFooter
              style={ModalFooterStyle}
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
        <DataForm
          formKey={deployFormKeyMap.deployment}
          initialValues={formData}
          source={formData.source || ''}
          action={action}
          clusterList={clusterList}
          onOk={handleOk}
          ref={formRef}
          isGGUF={isGGUF}
          onBackendChange={handleAsyncBackendChange}
          onValuesChange={handleManulOnValuesChange}
        ></DataForm>
      </ColumnWrapper>
    </GSDrawer>
  );
};

export default UpdateModal;
