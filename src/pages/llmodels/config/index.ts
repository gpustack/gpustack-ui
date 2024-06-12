import { StatusMaps } from '@/config';

export const modelInstanceCols = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'Create Time',
    dataIndex: 'createTime',
    key: 'createTime'
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status'
  },
  {
    title: 'Utilization',
    dataIndex: 'utilization',
    key: 'utilization'
  },
  {
    title: 'Host Name',
    dataIndex: 'hostName',
    key: 'hostName'
  },
  {
    title: 'Operation',
    key: 'Operation'
  }
];

export const status: any = {
  Running: StatusMaps.success
};
