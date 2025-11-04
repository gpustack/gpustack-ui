import { PageAction } from '@/config';
import { PageActionType } from '@/config/types';
import PageBreadcrumb from '@/pages/_components/page-breadcrumb';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { PageContainerInner } from '../_components/page-box';
import { createCluster, queryClusterToken, queryCredentialList } from './apis';
import ClusterSteps from './components/cluster-steps';
import FooterButtons from './components/footer-buttons';
import ProviderCatalog from './components/provider-catalog';
import { ProviderType, ProviderValueMap } from './config';
import providerList from './config/providers';
import { ClusterFormData } from './config/types';
import { moduleMap, moduleRegistry } from './step-forms/module-registry';
import useStepList from './step-forms/use-step-list';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Nav = styled.div`
  display: flex;
  align-items: center;
  font-weight: 400;
  font-size: 20px;
  color: var(--ant-color-text-tertiary);
  .level-2 {
    color: var(--ant-color-text);
    font-weight: 600;
  }
`;

const Content = styled.div`
  width: 600px;
`;

const HeaderContainer = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  padding-inline: var(--layout-content-header-inlinepadding);
  .text {
    margin-right: 16px;
    padding-right: 16px;
    border-right: 1px solid var(--ant-color-split);
    font-weight: 600;
    font-size: 20px;
    margin-right: 32px;
  }
`;

const ClusterCreate = () => {
  const intl = useIntl();
  const startStep = 0;
  const stepList = useStepList();
  const [searchParams] = useSearchParams();
  const action =
    (searchParams.get('action') as PageActionType) || PageAction.CREATE;
  const navigate = useNavigate();
  const [credentialList, setCredentialList] = useState<
    Global.BaseOption<number, { provider: ProviderType }>[]
  >([]);
  const [currentStep, setCurrentStep] = useState<number>(startStep);
  const [registrationInfo, setRegistrationInfo] = useState<{
    token: string;
    image: string;
    server_url: string;
    cluster_id: number;
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

  const handleStepChange = (newStep: number) => {
    setCurrentStep(newStep);
    console.log('step========', newStep);
  };

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

      console.log('results========', results);

      const resultsMap = new Map<string, any>();
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const values = result.reason?.values || {};
          resultsMap.set(formKeys[index], values);
        } else if (result.status === 'fulfilled') {
          resultsMap.set(formKeys[index], result.value);
        }
      });
      const newValues = _.merge(formValues, Object.fromEntries(resultsMap));

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
      console.log('results========2', result);
      if (result) {
        await callback?.(result as ClusterFormData);
        const step = steps[currentStep];
        step.beforeNext?.();
        setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      }
    } catch (error) {
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
      const res = await queryCredentialList({ page: 1, perPage: 100 });
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
      console.log('renderForms key========', key, formValues);
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
          registrationInfo={registrationInfo}
          provider={extraData.provider}
        />
      ) : null;
    });
  };

  const showButtons = useMemo(() => {
    const step = steps[currentStep];
    return step?.showButtons ? step?.showButtons(extraData.provider) : {};
  }, [currentStep, steps, extraData.provider]);

  const submit = async (values: ClusterFormData) => {
    const data = {
      ...extraData,
      ...(typeof values === 'object' ? values : {})
    };
    const res = await createCluster({ data });
    const info = await queryClusterToken({ id: res.id });
    setRegistrationInfo({
      ...info,
      cluster_id: res.id
    });
    return true;
  };

  const handleSubmit = async () => {
    onNext(submit);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const breadcrumbItems = [
    {
      title: <a>{intl.formatMessage({ id: 'clusters.title' })}</a>,
      onClick: () => navigate(-1)
    },
    {
      title: intl.formatMessage({ id: 'common.button.create' })
    }
  ];

  return (
    <PageContainerInner
      footer={[
        <FooterButtons
          key="buttons"
          onPrevious={onPrevious}
          onNext={onNext}
          handleCancel={handleCancel}
          handleSubmit={handleSubmit}
          showButtons={showButtons}
        />
      ]}
      header={{
        title: <PageBreadcrumb items={breadcrumbItems} />
      }}
    >
      <ClusterSteps
        steps={steps}
        currentStep={currentStep}
        onChange={handleStepChange}
      ></ClusterSteps>
      {currentStep === startStep && (
        <ProviderCatalog
          dataList={providerList}
          height={70}
          onSelect={handleSelectProvider}
          clickable={true}
          current={extraData.provider}
        />
      )}
      {renderModules()}
      <Container>
        <Content>{renderForms()}</Content>
      </Container>
    </PageContainerInner>
  );
};

export default ClusterCreate;
