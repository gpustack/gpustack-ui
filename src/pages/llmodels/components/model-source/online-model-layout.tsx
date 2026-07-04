import useWindowResize from '@/hooks/use-window-resize';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Separator from '../separator';
import s from './online-model-layout.module.less';
import { OnlineModelStepContext } from './online-model-step-context';

export type OnlineModelMobileStep = 'search' | 'detail' | 'config';

type OnlineModelLayoutProps = {
  open: boolean;
  showOnlinePanels: boolean;
  searchPanel: React.ReactNode;
  detailPanel: React.ReactNode;
  formPanel: React.ReactNode;
  hasSelectedModel: boolean;
  canProceedFromDetail: boolean;
};

const OnlineModelLayout: React.FC<OnlineModelLayoutProps> = ({
  open,
  showOnlinePanels,
  searchPanel,
  detailPanel,
  formPanel,
  hasSelectedModel,
  canProceedFromDetail
}) => {
  const intl = useIntl();
  const { isMobile } = useWindowResize();
  const [step, setStep] = useState<OnlineModelMobileStep>('search');

  const goToDetail = useCallback(() => {
    setStep('detail');
  }, []);

  const stepContextValue = useMemo(
    () => ({
      isMobileWizard: isMobile && showOnlinePanels,
      step,
      goToDetail
    }),
    [goToDetail, isMobile, showOnlinePanels, step]
  );

  useEffect(() => {
    if (!open) {
      setStep('search');
    }
  }, [open]);

  const renderStepFooter = () => {
    if (step === 'search') {
      return (
        <div className={s.mobileStepFooter}>
          <Button
            type="primary"
            disabled={!hasSelectedModel}
            onClick={() => setStep('detail')}
          >
            {intl.formatMessage({ id: 'common.button.next' })}
          </Button>
        </div>
      );
    }

    if (step === 'detail') {
      return (
        <div className={s.mobileStepFooter}>
          <Button onClick={() => setStep('search')}>
            {intl.formatMessage({ id: 'common.button.prev' })}
          </Button>
          <Button
            type="primary"
            disabled={!canProceedFromDetail}
            onClick={() => setStep('config')}
          >
            {intl.formatMessage({ id: 'common.button.next' })}
          </Button>
        </div>
      );
    }

    return null;
  };

  const renderContent = () => {
    if (!showOnlinePanels) {
      return <div className={s.formCol}>{formPanel}</div>;
    }

    if (!isMobile) {
      return (
        <div className={s.container}>
          <div className={s.col}>
            {searchPanel}
            <Separator />
          </div>
          <div className={s.col}>
            {detailPanel}
            <Separator />
          </div>
          <div className={s.formCol}>{formPanel}</div>
        </div>
      );
    }

    return (
      <div className={s.mobileStep}>
        <div className={s.mobileStepContent}>
          <div
            className={step === 'search' ? s.mobilePanelActive : s.mobilePanel}
          >
            {searchPanel}
          </div>
          <div
            className={step === 'detail' ? s.mobilePanelActive : s.mobilePanel}
          >
            {detailPanel}
          </div>
          <div
            className={step === 'config' ? s.mobilePanelActive : s.mobilePanel}
          >
            {formPanel}
          </div>
        </div>
        {renderStepFooter()}
      </div>
    );
  };

  return (
    <OnlineModelStepContext.Provider value={stepContextValue}>
      {renderContent()}
    </OnlineModelStepContext.Provider>
  );
};

export default OnlineModelLayout;
