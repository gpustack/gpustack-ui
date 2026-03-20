import IconFont from '@/components/icon-font';
import { PageContainerInner } from '@/pages/_components/page-box';
import { useIntl } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import { Segmented, Tabs } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DeploymentsContext } from './config/deploments-context';
import ModelView from './deployments';
import useFormInitialValues from './hooks/use-form-initial-values';
import InstanceView from './instance-view';

const TabsValueMap = {
  ModelView: 'modelView',
  InstanceView: 'instanceView'
};

const LLModels: React.FC = () => {
  const intl = useIntl();
  const {
    generateFormValues,
    clusterList,
    getClusterList,
    getWorkerList,
    workerList
  } = useFormInitialValues();
  const [activeKey, setActiveKey] = useState(TabsValueMap.ModelView);
  const modelViewRef = useRef<any>(null);
  const instanceViewRef = useRef<any>(null);

  useEffect(() => {
    const getData = async () => {
      await Promise.all([getClusterList(), getWorkerList()]);
    };
    getData();
  }, []);

  const handleTabChange = useMemoizedFn((key: string) => {
    if (key === TabsValueMap.ModelView) {
      modelViewRef.current?.resumeRequestsOnPageActive();
      instanceViewRef.current?.cancelRequestsOnPageInactive();
    }
    if (key === TabsValueMap.InstanceView) {
      instanceViewRef.current?.resumeRequestsOnPageActive();
      modelViewRef.current?.cancelRequestsOnPageInactive();
    }
    setActiveKey(key);
  });

  const header = useMemo(() => {
    return {
      title: (
        <div className="flex items-center">
          <span className="font-600">
            {intl.formatMessage({ id: 'menu.models.deployment' })}
          </span>
          <Segmented
            options={[
              {
                label: intl.formatMessage({ id: 'models.table.modelView' }),
                value: TabsValueMap.ModelView,
                icon: <IconFont type={'icon-models'}></IconFont>
              },
              {
                label: intl.formatMessage({ id: 'models.table.instanceView' }),
                value: TabsValueMap.InstanceView,
                icon: <IconFont type={'icon-instance-outline'}></IconFont>
              }
            ]}
            size="middle"
            className="m-l-24 font-600"
            value={activeKey}
            onChange={handleTabChange}
          ></Segmented>
        </div>
      )
    };
  }, [activeKey, intl]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        if (activeKey === TabsValueMap.ModelView) {
          modelViewRef.current?.resumeRequestsOnPageActive();
        }
        if (activeKey === TabsValueMap.InstanceView) {
          instanceViewRef.current?.resumeRequestsOnPageActive();
        }
      } else {
        if (activeKey === TabsValueMap.ModelView) {
          modelViewRef.current?.cancelRequestsOnPageInactive();
        }
        if (activeKey === TabsValueMap.InstanceView) {
          instanceViewRef.current?.cancelRequestsOnPageInactive();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeKey]);

  return (
    <PageContainerInner header={header}>
      <DeploymentsContext.Provider
        value={{
          generateFormValues,
          clusterList,
          workerList
        }}
      >
        <Tabs
          renderTabBar={() => <></>}
          items={[
            {
              key: TabsValueMap.ModelView,
              label: intl.formatMessage({ id: 'models.table.modelView' }),
              children: <ModelView ref={modelViewRef}></ModelView>
            },
            {
              key: TabsValueMap.InstanceView,
              label: intl.formatMessage({ id: 'models.table.instanceView' }),
              children: <InstanceView ref={instanceViewRef}></InstanceView>
            }
          ]}
          activeKey={activeKey}
        ></Tabs>
      </DeploymentsContext.Provider>
    </PageContainerInner>
  );
};

export default LLModels;
