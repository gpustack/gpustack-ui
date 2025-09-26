import PageTools from '@/components/page-tools';
import { PageActionType } from '@/config/types';
import { PlusOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, FormInstance } from 'antd';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import { FormData } from '../config/types';
import VersionsConfig from '../forms/versions-config';

const PoolContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const PoolFormWrapper = styled.div`
  flex: 1;
  margin-bottom: 16px;
`;

const Title = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 700;
  font-size: 16px;
  .text {
    font-size: 20px;
  }
`;
interface WorkerPoolsFormProps {
  action: PageActionType;
  currentData?: any;
}

const WorkerPoolsForm = forwardRef((props: WorkerPoolsFormProps, ref) => {
  const intl = useIntl();
  const { action, currentData } = props;
  const countRef = useRef(0);
  const formRefs = useRef<Record<number, FormInstance<any> | null>>({});
  const [activeKey, setActiveKey] = useState<Set<number>>(new Set([0]));
  const [versionConfigs, setVersionConfigs] = useState<Map<number, FormData>>(
    new Map([
      [
        0,
        {
          version_name: '',
          image_name: '',
          run_command: ''
        }
      ]
    ]) as Map<number, FormData>
  );

  const handleOnFinish = (values: any) => {};

  const updateCount = () => {
    countRef.current += 1;
    return countRef.current;
  };

  const handleAddPool = () => {
    const newId = updateCount();
    setVersionConfigs((prev) =>
      new Map(prev).set(newId, {
        name: ``
      } as FormData)
    );

    requestAnimationFrame(() => {
      setActiveKey((prev) => new Set([newId]));
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    });
  };

  const handleRemovePool = (id: number) => {
    if (versionConfigs.size === 1) {
      return;
    }

    setVersionConfigs((prev) => {
      const newList = new Map(prev);
      newList.delete(id);
      return newList;
    });
    formRefs.current[id] = null;
  };

  const gatherFormValues = (results: PromiseSettledResult<any>[]) => {
    const resultList = results.map((result: PromiseSettledResult<any>) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      if (result.status === 'rejected') {
        return result.reason?.values || {};
      }
      return {};
    });
    console.log('gatherFormValues========', resultList);
    return resultList.filter((item) => item);
  };

  const validateFields = async () => {
    const promises = Array.from(Object.values(formRefs.current)).map((form) =>
      form?.validateFields()
    );
    const results = await Promise.allSettled(promises);
    console.log('results========0', promises, results);
    if (results.some((result) => result.status === 'rejected')) {
      return Promise.reject({
        values: {
          worker_pools: gatherFormValues(results)
        }
      });
    }
    return Promise.resolve({
      worker_pools: gatherFormValues(results)
    });
  };

  const setFieldsValue = (data: any) => {
    const worker_pools = data.worker_pools || [];
    const newWorkerPools = worker_pools.map(
      (poolData: FormData, index: number) => [index, poolData]
    );
    console.log('newWorkerPools========', newWorkerPools);
    setVersionConfigs(new Map(newWorkerPools));
  };

  const getFieldsValue = () => {
    const values = Object.values(formRefs.current).map((form) =>
      form?.getFieldsValue()
    );
    console.log('getFieldsValue========', values);
    return {
      worker_pools: values
    };
  };

  const handleOnToggle = (open: boolean, key: number) => {
    console.log('Active keys changed:', key);
    if (open) {
      setActiveKey((prev) => new Set([key]));
    } else {
      setActiveKey((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  useImperativeHandle(ref, () => ({
    submit: () => {},
    validateFields: validateFields,
    getFieldsValue: getFieldsValue
  }));

  useEffect(() => {
    if (currentData) {
      console.log('currentData===========1=', currentData);
      setFieldsValue(currentData);
    }
  }, [currentData]);

  return (
    <div>
      <PageTools
        marginBottom={22}
        marginTop={0}
        left={
          <span className="flex-center gap-16">
            <Title>Backend Versions</Title>
          </span>
        }
        right={
          <Button
            onClick={handleAddPool}
            variant="filled"
            color="default"
            icon={<PlusOutlined />}
          >
            Add Version
          </Button>
        }
      ></PageTools>

      {Array.from(versionConfigs.keys()).map((key, index) => (
        <PoolContainer key={key}>
          <PoolFormWrapper>
            <VersionsConfig
              name={`versionForm_${key}`}
              action={action}
              ref={(el: any) => {
                if (el) {
                  formRefs.current[key] = el;
                }
              }}
              collapseProps={{
                collapsible: true,
                open: activeKey.has(key),
                defaultOpen: activeKey.has(key),
                onToggle: (open: boolean) => handleOnToggle(open, key)
              }}
              showDelete={versionConfigs.size > 1}
              onFinish={handleOnFinish}
              currentData={versionConfigs.get(key)}
              onDelete={() => handleRemovePool(key)}
            ></VersionsConfig>
          </PoolFormWrapper>
        </PoolContainer>
      ))}
    </div>
  );
});

export default WorkerPoolsForm;
