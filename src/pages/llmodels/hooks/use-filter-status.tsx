import { backendOptionsAtom } from '@/atoms/models';
import { useIntl } from '@umijs/max';
import { useAtomValue } from 'jotai';
import { backendLabelMap, MyModelsStatusValueMap } from '../config';

const Dot = ({ color }: { color: string }) => {
  return (
    <span
      style={{
        backgroundColor: color,
        borderRadius: '50%',
        height: 8,
        width: 8,
        display: 'flex'
      }}
    ></span>
  );
};

const useFilterStatus = (options: {
  onStatusChange: (value?: any) => void;
}) => {
  const { onStatusChange } = options;
  const intl = useIntl();
  const backendOptions = useAtomValue(backendOptionsAtom);

  const statusOptions = [
    {
      value: MyModelsStatusValueMap.Active,
      color: 'var(--ant-color-success)',
      label: intl.formatMessage({
        id: 'models.mymodels.status.active'
      })
    },
    {
      value: MyModelsStatusValueMap.Inactive,
      color: 'var(--ant-color-fill)',
      label: intl.formatMessage({
        id: 'models.mymodels.status.inactive'
      })
    },
    {
      value: MyModelsStatusValueMap.Degrade,
      color: 'var(--ant-color-warning)',
      label: intl.formatMessage({
        id: 'models.mymodels.status.degrade'
      })
    }
  ];

  const backendOptionsList = [
    ...backendOptions.map((backend) => ({
      value: backend.value,
      label: backend.label
    })),
    ...Object.entries(backendLabelMap).map(([key, value]) => ({
      value: key,
      label: value
    }))
  ].filter(
    (option, index, self) =>
      index === self.findIndex((t) => t.value === option.value)
  );

  const labelRender = (item: any) => {
    const current = statusOptions.find((option) => option.value === item.value);
    return (
      <span className="flex-center gap-8">
        <Dot color={current!.color}></Dot>
        {item.label}
      </span>
    );
  };

  const optionRender = (item: any) => {
    return (
      <span className="flex-center gap-8">
        <Dot color={item.data?.color}></Dot>
        {item.label}
      </span>
    );
  };

  const handleStatusChange = (value: string | undefined) => {
    onStatusChange(value);
  };

  return {
    statusOptions,
    backendOptionsList,
    labelRender,
    optionRender,
    handleStatusChange
  };
};

export default useFilterStatus;
