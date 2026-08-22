import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import CompatibilityAlert from '@/pages/llmodels/components/compatible-alert';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { FormDrawer, ModalFooter, useSubmitLock } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Steps } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { ServiceModeValueMap } from '../config';
import {
  CacheProviderItem,
  FormData,
  ListItem,
  ServiceMode
} from '../config/types';

import ServiceForm, { ResourceCheckStatus } from '../forms';
import ProviderCatalog from './provider-catalog';

const ModalFooterStyle = {
  padding: '16px 24px 8px',
  display: 'flex',
  justifyContent: 'flex-end'
};

// sticks to the top of the drawer's scroll container, like the Add
// Cluster steps header
const StepWrapper = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  padding-block: 16px;
  background: var(--ant-color-bg-elevated);

  .ant-steps {
    .ant-steps-item {
      --steps-item-base-width: 20px;
    }
    .ant-steps-item-rail-wait {
      --steps-item-solid-line-color: var(--ant-color-split);
    }
    &:not(.ant-steps-panel) {
      .ant-steps-item-finish {
        --steps-item-icon-bg-color: var(--ant-color-primary);
      }
    }
  }
`;

const StepsStyles: Record<string, any> = {
  root: {
    '--ant-steps-description-max-width': 'auto'
  },
  item: {
    paddingBlock: 0
  },
  itemIcon: {
    fontSize: 0,
    width: 8,
    height: 8,
    marginInlineStart: 0
  },
  itemWrapper: {
    alignItems: 'center'
  },
  itemRail: {
    borderWidth: 1.5,
    borderRadius: 1,
    insetInlineStart: 10,
    insetInlineEnd: 2,
    '--steps-horizontal-rail-margin': '12px'
  }
};

type AddModalProps = {
  title: string; // Used when action is EDIT; CREATE titles follow the steps
  action: PageActionType;
  mode: ServiceMode; // Used when action is EDIT; CREATE takes it from the card
  providers: CacheProviderItem[];
  open: boolean;
  currentData?: ListItem; // Used when action is EDIT
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddService: React.FC<AddModalProps> = ({
  title,
  action,
  mode,
  providers,
  open,
  currentData,
  onOk,
  onCancel
}) => {
  const intl = useIntl();
  const form = useRef<any>(null);
  const { loading, guard, run, release } = useSubmitLock();
  const [checkStatus, setCheckStatus] = useState<ResourceCheckStatus>({
    show: false,
    message: ''
  });
  // an edited managed service holds config its instances do not run yet
  const [configChanged, setConfigChanged] = useState(false);

  const isCreate = action === PageAction.CREATE;
  // creation walks two steps: 0 picks the provider card, 1 configures;
  // editing opens straight on the form
  const [currentStep, setCurrentStep] = useState(0);
  const [selection, setSelection] = useState<{
    provider?: string;
    mode: ServiceMode;
  }>({
    provider: undefined,
    mode: ServiceModeValueMap.Managed as ServiceMode
  });

  const onProviderStep = isCreate && currentStep === 0;
  // the chosen card fixes both the provider and the mode of the form
  const formMode = isCreate ? selection.mode : mode;

  // a failed resource check is advisory: the primary button gives way to
  // "Submit Anyway", mirroring the deployment compatibility flow
  const showExtraButton = useMemo(() => {
    return checkStatus.show && checkStatus.type !== 'success';
  }, [checkStatus.show, checkStatus.type]);

  // edits are saved as-is and picked up on the next instance recreation;
  // the notice outranks the resource-check success message but yields to
  // its warnings, which drive the "Submit Anyway" footer
  const showUpdateTips =
    !showExtraButton &&
    configChanged &&
    action === PageAction.EDIT &&
    mode === ServiceModeValueMap.Managed;

  const alertStatus: ResourceCheckStatus = showUpdateTips
    ? {
        show: true,
        type: 'warning',
        message: intl.formatMessage({ id: 'kvCache.edit.recreate.tips' })
      }
    : checkStatus;

  useEffect(() => {
    setConfigChanged(false);
    if (open) {
      setCurrentStep(0);
      setSelection({
        provider: undefined,
        mode: ServiceModeValueMap.Managed as ServiceMode
      });
      setCheckStatus({ show: false, message: '' });
    }
  }, [open]);

  // mirrors cluster-create's handleSelectProvider: re-picking the same
  // provider keeps the entered values, a different one re-seeds the form
  const handleSelectProvider = (item: CacheProviderItem) => {
    if (item.name !== selection.provider) {
      form.current?.resetFields();
      setCheckStatus({ show: false, message: '' });
      setSelection({
        provider: item.name,
        mode: (item.supported_modes?.[0] ||
          ServiceModeValueMap.Managed) as ServiceMode
      });
    }
    setCurrentStep(1);
  };

  const handlePrevious = () => {
    setCurrentStep(0);
  };

  const handleSubmit = () => {
    guard(() => form.current?.submit());
  };

  const handleOnFinish = async (data: FormData) => {
    // antd preserves unmounted fields' values: stepping back from a
    // managed provider leaves config/restart defaults in the store, and
    // they must not ride into an external registration payload
    const payload: FormData = { ...data, mode: formMode };
    if (formMode !== ServiceModeValueMap.Managed) {
      delete payload.config;
      delete payload.restart_on_error;
      delete payload.provider_version;
      delete payload.worker_id;
      delete payload.worker_selector;
    }
    await run(() => onOk(payload));
  };

  const handleCancel = () => {
    form.current?.resetFields();
    setCheckStatus({ show: false, message: '' });
    onCancel();
  };

  const handleAlertClose = () => {
    if (showUpdateTips) {
      setConfigChanged(false);
    } else {
      setCheckStatus({ show: false, message: '' });
    }
  };

  // the chosen provider shows on the form's read-only provider field, so
  // the step title stays bare
  const stepItems = [
    {
      title: intl.formatMessage({ id: 'kvCache.providerSelect.title' })
    },
    {
      title: intl.formatMessage({ id: 'clusters.create.steps.configure' })
    }
  ];

  const drawerTitle = isCreate
    ? intl.formatMessage({ id: 'kvCache.button.add' })
    : title;

  return (
    <FormDrawer
      title={drawerTitle}
      open={open}
      onCancel={handleCancel}
      width={600}
      loading={loading}
      footer={
        onProviderStep ? (
          <ModalFooter
            onCancel={handleCancel}
            showOkBtn={false}
            style={ModalFooterStyle}
          ></ModalFooter>
        ) : (
          <>
            <CompatibilityAlert
              showClose={true}
              onClose={handleAlertClose}
              warningStatus={alertStatus}
              contentStyle={{ paddingInline: '0 6px' }}
            ></CompatibilityAlert>
            <ModalFooter
              onCancel={handleCancel}
              onOk={handleSubmit}
              loading={loading}
              showOkBtn={!showExtraButton}
              description={
                isCreate && (
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handlePrevious}
                    style={{ marginLeft: 24 }}
                  >
                    {intl.formatMessage({ id: 'common.button.prev' })}
                  </Button>
                )
              }
              extra={
                showExtraButton && (
                  <Button type="primary" onClick={handleSubmit}>
                    {intl.formatMessage({ id: 'models.form.submit.anyway' })}
                  </Button>
                )
              }
              style={ModalFooterStyle}
            ></ModalFooter>
          </>
        )
      }
    >
      {isCreate && (
        <StepWrapper>
          <Steps
            current={currentStep}
            items={stepItems}
            variant="filled"
            size="small"
            styles={StepsStyles}
          ></Steps>
        </StepWrapper>
      )}
      {onProviderStep && (
        <ProviderCatalog
          providers={providers}
          current={selection.provider}
          onSelect={handleSelectProvider}
        ></ProviderCatalog>
      )}
      {(!isCreate || selection.provider) && (
        // the form stays mounted while step 0 shows again, so stepping
        // back and re-picking the same provider keeps the entered values
        <div style={{ display: onProviderStep ? 'none' : 'block' }}>
          <ServiceForm
            ref={form}
            action={action}
            mode={formMode}
            provider={selection.provider}
            currentData={currentData}
            onFinish={handleOnFinish}
            onFinishFailed={release}
            onCheckStatusChange={setCheckStatus}
            onConfigChanged={setConfigChanged}
          />
        </div>
      )}
    </FormDrawer>
  );
};

export default AddService;
