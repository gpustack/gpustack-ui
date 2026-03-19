import IconFont from '@/components/icon-font';
import { PageContainerInner } from '@/pages/_components/page-box';
import { useIntl } from '@umijs/max';
import { Segmented, Tabs } from 'antd';
import { useMemo, useState } from 'react';
import ModelView from './index';
import InstanceView from './instance-view';

const TabsValueMap = {
  ModelView: 'modelView',
  InstanceView: 'instanceView'
};

const Playground: React.FC = () => {
  const intl = useIntl();
  const [activeKey, setActiveKey] = useState(TabsValueMap.ModelView);

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
                label: 'Model View',
                value: TabsValueMap.ModelView,
                icon: <IconFont type={'icon-models'}></IconFont>
              },
              {
                label: 'Instance View',
                value: TabsValueMap.InstanceView,
                icon: <IconFont type={'icon-database'}></IconFont>
              }
            ]}
            size="middle"
            className="m-l-24 font-600"
            value={activeKey}
            onChange={(key) => setActiveKey(key)}
          ></Segmented>
        </div>
      )
    };
  }, [activeKey, intl]);

  return (
    <PageContainerInner header={header}>
      <Tabs
        renderTabBar={() => <></>}
        items={[
          {
            key: TabsValueMap.ModelView,
            label: 'Model View',
            children: <ModelView></ModelView>
          },
          {
            key: TabsValueMap.InstanceView,
            label: 'Instance View',
            children: <InstanceView></InstanceView>
          }
        ]}
        activeKey={activeKey}
      ></Tabs>
    </PageContainerInner>
  );
};

export default Playground;
