import { icons } from '@gpustack/core-ui';

export const InstanceStatusValueMap = {
  Running: 'running',
  Pending: 'pending',
  Stopped: 'stopped',
  Failed: 'failed'
};

export const InstanceStatusLabelMap: Record<string, string> = {
  [InstanceStatusValueMap.Running]: '运行中',
  [InstanceStatusValueMap.Pending]: '等待中',
  [InstanceStatusValueMap.Stopped]: '已停止',
  [InstanceStatusValueMap.Failed]: '失败'
};

export const rowActionList = [
  {
    label: '编辑',
    key: 'edit',
    icon: icons.EditOutlined
  },
  {
    label: '删除',
    key: 'delete',
    icon: icons.DeleteOutlined,
    props: {
      danger: true
    }
  }
];
