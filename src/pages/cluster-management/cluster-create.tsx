import { systemConfigAtom } from '@/atoms/system';
import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import ColumnWrapper from '@/pages/_components/column-wrapper';
import { useIntl } from '@umijs/max';
import { useAtom } from 'jotai';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  createCluster,
  queryClusterList,
  queryClusterToken,
  queryCredentialList,
  setDefaultCluster
} from './apis';
import {
  DockerStepsFromCluster,
  K8sStepsFromCluter
} from './components/add-worker/config';
import ClusterSteps from './components/cluster-steps';
import FooterButtons from './components/footer-buttons';
import ProviderCatalog from './components/provider-catalog';
import { ProviderType, ProviderValueMap } from './config';
import providerList from './config/providers';
import { StepsContext } from './config/steps-context';
import { ClusterFormData } from './config/types';
import { moduleMap, moduleRegistry } from './step-forms/module-registry';
import useStepList from './step-forms/use-step-list';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Content = styled.div`
  width: 100%;
`;

const StepWrapper = styled.div`
  position: sticky;
  top: 0;
  background: var(--ant-color-bg-elevated);
  z-index: 10;
  padding: 16px 24px;
`;

const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ClusterCreate: React.FC<{
  action: PageActionType;
  setCurrentTitle?: (title: string) => void;
  onClose?: () => void;
}> = ({ onClose, action, setCurrentTitle }) => {
  const startStep = 0;
  const stepList = useStepList();
  const [systemConfigState] = useAtom(systemConfigAtom);
  const intl = useIntl();
  const [credentialList, setCredentialList] = useState<
    Global.BaseOption<number, { provider: ProviderType }>[]
  >([]);
  const [currentStep, setCurrentStep] = useState<number>(startStep);
  const [registrationInfo, setRegistrationInfo] = useState<{
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
    [key: string]: any;
  }>({
    token: '',
    image: '',
    server_url: '',
    cluster_id: 0
  });
  const [extraData, setExtraData] = useState<ClusterFormData>({
    provider: ProviderValueMap.Docker
  } as ClusterFormData);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [isAddWorkerStep, setIsAddWorkerStep] = useState<boolean>(false);

  const formRefs: Record<string, any> = {
    [moduleMap.BasicForm]: useRef<any>(null),
    [moduleMap.WorkerPoolForm]: useRef<any>(null)
  };

  const availableCredentials = useMemo(
    () => credentialList.filter((item) => item.provider === extraData.provider),
    [credentialList, extraData.provider]
  );

  const steps = useMemo(() => {
    if (!extraData.provider) {
      return stepList.filter((step) => step.defaultShow);
    }

    return stepList
      .filter((step) =>
        step.providers?.length
          ? step.providers.includes(extraData.provider as never)
          : true
      )
      .map((step, index) => ({
        ...step,
        disabled: action === PageAction.CREATE
      }));
  }, [action, extraData.provider, stepList]);

  // before moving to the next step, get all form values
  const getFormFieldsValue = () => {
    setFormValues((prev) => {
      const newFormValues = _.cloneDeep(prev);
      for (const [formKey, formRef] of Object.entries(formRefs)) {
        const formValues = formRef?.current?.getFieldsValue?.();
        if (formValues) {
          newFormValues[formKey] = formValues;
        }
      }
      return newFormValues;
    });
  };

  const onPrevious = () => {
    getFormFieldsValue();
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const validateForms = async () => {
    const step = steps[currentStep];
    const formKeys = step?.showForms || [];
    if (formKeys?.length > 0) {
      const results = await Promise.allSettled(
        formKeys.map((key) => formRefs[key].current?.validateFields())
      );

      const resultsMap = new Map<string, any>();
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const values = result.reason?.values || {};
          resultsMap.set(formKeys[index], values);
        } else if (result.status === 'fulfilled') {
          resultsMap.set(formKeys[index], result.value);
        }
      });
      const newValues = { ...formValues };

      // update form values by the key from resultsMap
      for (const [key, value] of resultsMap.entries()) {
        newValues[key] = value;
      }

      setFormValues(newValues);

      const isValid = results.every((result) => result.status === 'fulfilled');
      if (!isValid) {
        return false;
      }
      return Object.assign({}, ...Object.values(newValues));
    }
    return true;
  };

  const onNext = async (callback?: (values: ClusterFormData) => void) => {
    try {
      const result = await validateForms();
      if (result) {
        await callback?.(result as ClusterFormData);
        const step = steps[currentStep];
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      }
    } catch (error) {
      setSubmitLoading(false);
      console.log('next error:', error);
    }
  };

  const resetForm = () => {
    setFormValues({});
    for (const [formKey, formRef] of Object.entries(formRefs)) {
      formRefs[formKey] = React.createRef();
    }
  };

  const handleSelectProvider = (value: string) => {
    if (value === extraData.provider) {
      onNext();
      return;
    }
    setExtraData({
      provider: value
    } as ClusterFormData);
    resetForm();
    onNext();
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await queryCredentialList({ page: -1 });
      const list = res.items?.map((item) => ({
        label: item.name,
        value: item.id,
        provider: item.provider
      }));
      setCredentialList(list);
    };
    fetchData();
  }, []);

  const renderForms = () => {
    const step = steps[currentStep];
    const formKeys = step?.showForms || [];
    if (formKeys.length === 0) {
      return null;
    }

    return formKeys.map((key) => {
      const FormComponent = moduleRegistry[key];
      return FormComponent ? (
        <FormComponent
          key={key}
          ref={formRefs[key]}
          action={action}
          provider={extraData.provider}
          credentialList={availableCredentials}
          currentData={formValues[key]}
        />
      ) : null;
    });
  };

  // add worker or cluster registration step
  const handleAddWorker = () => {
    const currentTitle =
      extraData.provider === ProviderValueMap.Docker
        ? 'resources.button.create'
        : 'clusters.button.register';
    setIsAddWorkerStep(true);
    setCurrentTitle?.(intl.formatMessage({ id: currentTitle }));
    onNext();
  };

  /**
   * this function is used to render the modules in the current step, they are not forms
   * @returns
   */
  const renderModules = () => {
    const step = steps[currentStep];
    const moduleKeys = step?.showModules || [];
    if (moduleKeys.length === 0) {
      return null;
    }
    return moduleKeys.map((key) => {
      const ModuleComponent = moduleRegistry[key];
      return ModuleComponent ? (
        <ModuleComponent
          key={key}
          actionSource={'page'}
          stepList={
            extraData.provider === ProviderValueMap.Docker
              ? DockerStepsFromCluster
              : K8sStepsFromCluter
          }
          registrationInfo={registrationInfo}
          provider={extraData.provider}
          onSkip={onClose}
          onAddWorker={handleAddWorker}
        />
      ) : null;
    });
  };

  const showButtons = useMemo(() => {
    const step = steps[currentStep];
    return step?.showButtons ? step?.showButtons(extraData.provider) : {};
  }, [currentStep, steps, extraData.provider]);

  const checkDefaultCluster = async () => {
    try {
      const res = await queryClusterList({ page: 1, perPage: 10 });
      if (res.items.length === 1) {
        const cluster = res.items[0];
        if (!cluster.is_default) {
          await setDefaultCluster({
            id: cluster.id
          });
        }
      }
    } catch (error) {}
  };

  const submit = async (values: ClusterFormData) => {
    const data = {
      ...extraData,
      ...(typeof values === 'object' ? values : {})
    };
    setSubmitLoading(true);
    const res = await createCluster({ data });
    const info = await queryClusterToken({ id: res.id });
    setSubmitLoading(false);
    setRegistrationInfo({
      ...info,
      cluster_id: res.id
    });
    checkDefaultCluster();
    if (extraData.provider === ProviderValueMap.DigitalOcean) {
      onClose?.();
    }
    return true;
  };

  const handleSubmit = async () => {
    onNext(submit);
  };

  const handleCancel = () => {
    onClose?.();
  };

  return (
    <MainWrapper>
      {!isAddWorkerStep && (
        <StepWrapper>
          <ClusterSteps steps={steps} currentStep={currentStep}></ClusterSteps>
        </StepWrapper>
      )}
      <ColumnWrapper
        maxHeight={
          isAddWorkerStep ? 'calc(100vh - 200px)' : 'calc(100vh - 150px)'
        }
        styles={{
          container: { paddingTop: 16, paddingBottom: 16 }
        }}
        footer={
          <FooterButtons
            key="buttons"
            onPrevious={onPrevious}
            onNext={onNext}
            handleCancel={handleCancel}
            handleSubmit={handleSubmit}
            showButtons={showButtons}
            loading={submitLoading}
          />
        }
      >
        <div style={{ flex: 1 }}>
          {currentStep === startStep && (
            <ProviderCatalog
              cols={2}
              dataList={providerList}
              height={70}
              onSelect={handleSelectProvider}
              clickable={true}
              current={extraData.provider}
            />
          )}
          <StepsContext.Provider
            value={{
              formValues: formValues,
              systemConfig: systemConfigState
            }}
          >
            {renderModules()}
            <Container>
              <Content>{renderForms()}</Content>
            </Container>
          </StepsContext.Provider>
        </div>
      </ColumnWrapper>
    </MainWrapper>
  );
};

export default ClusterCreate;
