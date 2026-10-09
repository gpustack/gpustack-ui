import { StatusDot, type StatusType } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { MyModelsStatusMap, MyModelsStatusValueMap } from '../config';

const useFilterStatus = (options?: {
  onStatusChange?: (value?: any) => void;
  optionList?: (Global.BaseOption<string> & { status: StatusType })[];
}) => {
  const { onStatusChange, optionList } = options || {};
  const intl = useIntl();

  const statusOptions = [
    {
      value: MyModelsStatusValueMap.Ready,
      status: MyModelsStatusMap[MyModelsStatusValueMap.Ready],
      label: intl.formatMessage({
        id: 'models.mymodels.status.active'
      })
    },
    {
      value: MyModelsStatusValueMap.Stopped,
      status: MyModelsStatusMap[MyModelsStatusValueMap.Stopped],
      label: intl.formatMessage({
        id: 'models.mymodels.status.inactive'
      })
    },
    {
      value: MyModelsStatusValueMap.NotReady,
      status: MyModelsStatusMap[MyModelsStatusValueMap.NotReady],
      label: intl.formatMessage({
        id: 'models.mymodels.status.degrade'
      })
    }
  ];

  const mergedOptions = optionList || statusOptions;

  const renderStatusOption = (item: any) => {
    const current = mergedOptions.find((option) => option.value === item.value);
    return current ? (
      <StatusDot statusValue={{ status: current.status, text: item.label }} />
    ) : (
      item.label
    );
  };

  const handleStatusChange = (value: string | undefined) => {
    onStatusChange?.(value);
  };

  return {
    statusOptions: mergedOptions,
    labelRender: renderStatusOption,
    optionRender: renderStatusOption,
    handleStatusChange
  };
};

export default useFilterStatus;
