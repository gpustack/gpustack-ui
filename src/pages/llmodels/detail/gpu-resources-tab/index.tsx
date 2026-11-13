import { Flex } from 'antd';
import { ResourceSummary } from '../components/hardware-content';
import ResourceTable from '../components/resource-table';
import ScopeToolbar from '../components/scope-toolbar';

const GPUResourcesTab = () => {
  return (
    <Flex vertical gap={16}>
      <ScopeToolbar />
      <ResourceSummary />
      <ResourceTable compact />
    </Flex>
  );
};

export default GPUResourcesTab;
