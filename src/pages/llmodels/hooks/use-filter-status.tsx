import { useIntl } from '@umijs/max';
import { MyModelsStatusValueMap } from '../config';

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

const useFilterStatus = (options?: {
  onStatusChange?: (value?: any) => void;
  optionList?: (Global.BaseOption<string> & { color: string })[];
}) => {
  const { onStatusChange, optionList } = options || {};
  const intl = useIntl();

  const statusOptions = [
    {
      value: MyModelsStatusValueMap.Active,
      color: 'var(--ant-color-success)',
      icon: <Dot color="var(--ant-color-success)"></Dot>,
      label: intl.formatMessage({
        id: 'models.mymodels.status.active'
      })
    },
    {
      value: MyModelsStatusValueMap.Inactive,
      color: 'var(--ant-color-fill-secondary)',
      icon: <Dot color="var(--ant-color-fill-secondary)"></Dot>,
      label: intl.formatMessage({
        id: 'models.mymodels.status.inactive'
      })
    },
    {
      value: MyModelsStatusValueMap.Degrade,
      color: 'var(--ant-color-warning)',
      icon: <Dot color="var(--ant-color-warning)"></Dot>,
      label: intl.formatMessage({
        id: 'models.mymodels.status.degrade'
      })
    }
  ];

  const mergedOptions = optionList || statusOptions;

  const labelRender = (item: any) => {
    const current = mergedOptions.find((option) => option.value === item.value);
    return (
      <span className="flex-center gap-8">
        {current && <Dot color={current.color}></Dot>}
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
    onStatusChange?.(value);
  };

  return {
    statusOptions: mergedOptions,
    labelRender,
    optionRender,
    handleStatusChange
  };
};

export default useFilterStatus;
