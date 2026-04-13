import { useBenchmarkTargetInstance } from '@/pages/llmodels/hooks/use-run-benchmark';
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import {
  DropdownButtons,
  IconFont,
  useDownloadStream
} from '@gpustack/core-ui';
import { HandlerOptions } from '@gpustack/core-ui/lib/hooks/use-chunk-fetch';
import { useIntl } from '@umijs/max';
import { Progress, notification } from 'antd';
import dayjs from 'dayjs';
import { MODEL_INSTANCE_API } from '../../apis';
import { InstanceStatusMap, modelCategoriesMap } from '../../config';
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
  const [api, contextHolder] = notification.useNotification({
    stack: { threshold: 1 }
  });
  const { downloadStream } = useDownloadStream();
  const intl = useIntl();

  const createFileName = (name: string) => {
    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
    const fileName = `${name}_${timestamp}.txt`;
    return fileName;
  };

  const renderMessage = (title: string) => {
    return (
      <div
        style={{
          width: 280,
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}
      >
        {title}
      </div>
    );
  };

  const downloadNotification = (
    data: HandlerOptions & {
      filename: string;
      duration?: number;
      chunkRequestRef: any;
    }
  ) => {
    api.open({
      duration: data.duration,
      message: renderMessage(data.filename),
      key: data.filename,
      closeIcon: (
        <span>{intl.formatMessage({ id: 'common.button.cancel' })}</span>
      ),
      description: <Progress percent={data.percent} size="small"></Progress>,
      onClose() {
        data.chunkRequestRef?.current?.abort();
        notification.destroy?.(data.filename);
      }
    });
  };

  const handleOnSelect = (val: string) => {
    if (val === 'benchmark') {
      runBenchmarkOnInstance(record);
    } else if (val === 'download') {
      downloadStream({
        url: `${MODEL_INSTANCE_API}/${record.id}/logs`,
        filename: createFileName(record.name),
        downloadNotification
      });
    } else {
      onSelect(val, record);
    }
  };

  const actionItems = childActionList.filter((action: any) => {
    if (action.key === 'benchmark') {
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
    <>
      {contextHolder}
      <DropdownButtons
        items={actionItems}
        onSelect={handleOnSelect}
      ></DropdownButtons>
    </>
  );
};

export default ActionsCell;
