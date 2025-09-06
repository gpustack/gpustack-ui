import PageTools from '@/components/page-tools';
import { PageActionType } from '@/config/types';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, FormInstance } from 'antd';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import styled from 'styled-components';
import WorkerPoolForm from '../components/pool-form';
import { ProviderType } from '../config';
import { NodePoolFormData } from '../config/types';

const PoolContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`;

const PoolFormWrapper = styled.div`
  flex: 1;
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
  provider: ProviderType;
  action: PageActionType;
  currentData?: any;
}

const WorkerPoolsForm = forwardRef((props: WorkerPoolsFormProps, ref) => {
  const { provider, action, currentData } = props;
  const countRef = useRef(1);
  const formRefs = useRef<Record<number, FormInstance<any> | null>>({});
  const [workerPoolList, setWorkerPoolList] = useState<
    Map<number, NodePoolFormData>
  >(
    new Map([
      [
        1,
        {
          instance_type: 'Pool-1'
        }
      ]
    ]) as Map<number, NodePoolFormData>
  );

  const handleOnFinish = (values: any) => {};

  const updateCount = () => {
    countRef.current += 1;
    return countRef.current;
  };

  const handleAddPool = () => {
    const newId = updateCount();
    setWorkerPoolList((prev) =>
      new Map(prev).set(newId, {
        instance_type: `Pool-${newId}`
      } as NodePoolFormData)
    );
  };

  const handleRemovePool = (id: number) => {
    if (workerPoolList.size === 1) {
      return;
    }

    setWorkerPoolList((prev) => {
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
    return resultList;
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
      (poolData: NodePoolFormData, index: number) => [index, poolData]
    );
    console.log('newWorkerPools========', newWorkerPools);
    setWorkerPoolList(new Map(newWorkerPools));
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
            <Title>Worker Pools Configuration</Title>
          </span>
        }
        right={
          <Button
            onClick={handleAddPool}
            variant="filled"
            color="default"
            icon={<PlusOutlined />}
          >
            Add Pool
          </Button>
        }
      ></PageTools>
      {Array.from(workerPoolList.keys()).map((key, index) => (
        <div key={key}>
          <PoolContainer>
            <PoolFormWrapper>
              <WorkerPoolForm
                name={`workerPoolForm_${key}`}
                action={action}
                ref={(el: any) => {
                  if (el) {
                    formRefs.current[key] = el;
                  }
                }}
                onFinish={handleOnFinish}
                provider={provider}
                currentData={workerPoolList.get(key)}
              ></WorkerPoolForm>
            </PoolFormWrapper>
          </PoolContainer>
          {index !== Array.from(workerPoolList.keys()).length - 1 && (
            <Divider orientation="right">
              <Button
                variant="filled"
                color="default"
                onClick={() => handleRemovePool(key)}
                icon={<DeleteOutlined />}
              ></Button>
            </Divider>
          )}
        </div>
      ))}
      <div className="flex-end">
        <Button
          onClick={handleAddPool}
          variant="filled"
          color="default"
          icon={<PlusOutlined />}
        >
          Add Pool
        </Button>
      </div>
    </div>
  );
});

export default WorkerPoolsForm;
