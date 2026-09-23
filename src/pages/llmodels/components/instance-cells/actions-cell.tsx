import useDownloadInstanceLogs from '@/pages/llmodels/hooks/use-download-instance-logs';
import { useBenchmarkTargetInstance } from '@/pages/llmodels/hooks/use-run-benchmark';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { DropdownButtons, IconFont } from '@gpustack/core-ui';
import {
  InstanceStatusMap,
  RoleValueMap,
  modelCategoriesMap
} from '../../config';
import { ListItem, ModelInstanceListItem } from '../../config/types';

const childActionList = [
  {
    label: 'common.button.viewlog',
    key: 'viewlog',
    status: [
      InstanceStatusMap.Initializing,
      InstanceStatusMap.Running,
      InstanceStatusMap.Error,
      InstanceStatusMap.Starting,
      InstanceStatusMap.Downloading
    ],
    icon: <IconFont type="icon-logs" />
  },
  {
    label: 'common.button.downloadLog',
    key: 'download',
    status: [
      InstanceStatusMap.Initializing,
      InstanceStatusMap.Running,
      InstanceStatusMap.Error,
      InstanceStatusMap.Starting,
      InstanceStatusMap.Downloading
    ],
    icon: <DownloadOutlined />
  },
  {
    label: 'models.table.instance.benchmark',
    key: 'benchmark',
    status: [InstanceStatusMap.Running],
    icon: <IconFont type="icon-speed" />
  },
  {
    label: 'common.button.delrecreate',
    key: 'delete',
    props: {
      danger: true
    },
    icon: <DeleteOutlined />
  }
];

interface ActionsCellProps {
  record: ModelInstanceListItem;
  modelData: ListItem;
  onSelect: (val: string, record: ModelInstanceListItem) => void;
}

const ActionsCell: React.FC<ActionsCellProps> = ({
  record,
  modelData,
  onSelect
}) => {
  const { runBenchmarkOnInstance } = useBenchmarkTargetInstance();
  const { downloadLogs } = useDownloadInstanceLogs();

  const handleOnSelect = (val: string) => {
    if (val === 'benchmark') {
      runBenchmarkOnInstance(record);
    } else if (val === 'download') {
      downloadLogs(record);
    } else {
      onSelect(val, record);
    }
  };

  const actionItems = childActionList.filter((action: any) => {
    if (action.key === 'benchmark') {
      // A run measures the path a request takes, and in a group that path
      // enters through the router. A prefill or a decode answers on its own
      // port but never on its own behalf, so the entry belongs to the router
      // row alone; a roleless instance is the whole deployment and keeps it.
      if (record.role && record.role !== RoleValueMap.Router) {
        return false;
      }
      return (
        action.status.includes(record.state) &&
        modelData?.categories?.includes(modelCategoriesMap.llm)
      );
    }
    if (action.status && action.status.length > 0) {
      return action.status.includes(record.state);
    }
    return true;
  });

  return (
    <DropdownButtons
      items={actionItems}
      onSelect={handleOnSelect}
    ></DropdownButtons>
  );
};

export default ActionsCell;
