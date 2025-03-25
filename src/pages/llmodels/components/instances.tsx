import { ListItem as WorkerListItem } from '@/pages/resources/config/types';
import { Space } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { ModelInstanceListItem } from '../config/types';
import '../style/instance-item.less';
import InstanceItem from './instance-item';

const testInstanceData = {
  source: 'huggingface',
  huggingface_repo_id: 'Qwen/Qwen2.5-3B-Instruct',
  huggingface_filename: null,
  ollama_library_model_name: null,
  model_scope_model_id: null,
  model_scope_file_path: null,
  local_path: null,
  name: 'qwen2.5-XVCXa',
  worker_id: 1,
  worker_name: 'sealgpuhost4080',
  worker_ip: '192.168.50.12',
  pid: 208852,
  port: 40063,
  download_progress: 72.11,
  resolved_path: null,
  state: 'downloading',
  state_message: '',
  computed_resource_claim: {
    is_unified_memory: false,
    offload_layers: null,
    total_layers: null,
    ram: null,
    vram: {
      '0': 1717148058
    },
    tensor_split: null
  },
  gpu_indexes: [0],
  model_id: 1,
  model_name: 'qwen2.5',
  distributed_servers: {
    rpc_servers: null,
    ray_actors: [
      {
        worker_id: 2,
        worker_ip: '192.168.50.13',
        total_gpus: 1,
        gpu_indexes: [0],
        computed_resource_claim: {
          is_unified_memory: false,
          offload_layers: null,
          total_layers: null,
          ram: null,
          vram: {
            '0': 23181498777
          },
          tensor_split: null
        },
        download_progress: 27.49
      }
    ]
  },
  id: 1,
  created_at: '2025-03-24T12:06:30Z',
  updated_at: '2025-03-24T12:09:01Z'
};

interface InstanceItemProps {
  list: ModelInstanceListItem[];
  workerList: WorkerListItem[];
  modelData?: any;
  currentExpanded?: string;
  handleChildSelect: (val: string, item: ModelInstanceListItem) => void;
}

const Instances: React.FC<InstanceItemProps> = ({
  list,
  workerList,
  modelData,
  currentExpanded,
  handleChildSelect
}) => {
  const [firstLoad, setFirstLoad] = React.useState(true);

  const defaultOpenId = useMemo(() => {
    if (!currentExpanded) {
      return '';
    }
    const current = _.find(
      list,
      (item: ModelInstanceListItem) => item.worker_id
    );
    return current ? current.name : '';
  }, [currentExpanded, list]);

  useEffect(() => {
    setFirstLoad(false);
  }, []);

  return (
    <Space size={16} direction="vertical" style={{ width: '100%' }}>
      {_.map(list, (item: ModelInstanceListItem, index: number) => {
        return (
          <InstanceItem
            key={item.name}
            modelData={modelData}
            workerList={workerList}
            instanceData={item}
            defaultOpenId={firstLoad ? defaultOpenId : ''}
            handleChildSelect={handleChildSelect}
          ></InstanceItem>
        );
      })}
    </Space>
  );
};
export default Instances;
