import { Flex } from 'antd';
import ResourceTable from '../components/resource-table';
import ScopeToolbar from '../components/scope-toolbar';

const GPUResourcesTab = () => {
  return (
    <Flex vertical gap={16}>
      <ScopeToolbar />
      <ResourceTable compact />
    </Flex>
  );
};

export default GPUResourcesTab;
