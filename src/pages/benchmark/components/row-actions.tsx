import DropdownButtons from '@/components/drop-down-buttons';
import IconFont from '@/components/icon-font';
import icons from '@/components/icon-font/icons';
import useDownloadLogs from '@/hooks/use-download-logs';
import { DownloadOutlined } from '@ant-design/icons';
import { BENCHMARKS_API } from '../apis';
import { BenchmarkStatusValueMap } from '../config';
import { BenchmarkListItem as ListItem } from '../config/types';

const actionList = [
  {
    label: 'common.button.viewlog',
    key: 'viewlog',
    status: [
      BenchmarkStatusValueMap.QUEUED,
      BenchmarkStatusValueMap.Running,
      BenchmarkStatusValueMap.Error,
      BenchmarkStatusValueMap.Completed
    ],
    icon: <IconFont type="icon-logs" />
  },
  {
    key: 'edit',
    label: 'common.button.edit',
    icon: icons.EditOutlined
  },
  {
    label: 'common.button.stop',
    key: 'stop',
    icon: icons.Stop,
    status: [BenchmarkStatusValueMap.QUEUED, BenchmarkStatusValueMap.Running]
  },
  {
    key: 'export',
    label: 'benchmark.table.export.results',
    status: [BenchmarkStatusValueMap.Completed],
    icon: (
      <IconFont type="icon-export" style={{ lineHeight: 1, fontSize: 16 }} />
    )
  },
  {
    label: 'common.button.downloadLog',
    key: 'download',
    status: [
      BenchmarkStatusValueMap.QUEUED,
      BenchmarkStatusValueMap.Running,
      BenchmarkStatusValueMap.Error,
      BenchmarkStatusValueMap.Completed
    ],
    icon: <DownloadOutlined />
  },
  {
    key: 'delete',
    label: 'common.button.delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];

interface RowActionsProps {
  record: ListItem;
  page?: 'detail' | 'list';
  handleSelect: (key: string, record: ListItem) => void;
}

const RowActions: React.FC<RowActionsProps> = (props) => {
  const { record, handleSelect, page = 'list' } = props;
  const { onDownloadLog, contextHolder } = useDownloadLogs();

  const actions = actionList.filter((action) => {
    if (page === 'detail' && action.key === 'edit') {
      return false;
    } else if (action.status && action.status.length > 0) {
      return action.status?.includes(record.state);
    }

    return true;
  });

  const handleDownloadLog = async () => {
    onDownloadLog({
      url: `${BENCHMARKS_API}/${record.id}/logs`,
      name: record.name
    });
  };

  const onSelect = (val: string) => {
    if (val === 'download') {
      handleDownloadLog();
      return;
    }
    handleSelect(val, record);
  };

  return (
    <>
      {contextHolder}
      <DropdownButtons items={actions} onSelect={onSelect}></DropdownButtons>
    </>
  );
};

export default RowActions;
