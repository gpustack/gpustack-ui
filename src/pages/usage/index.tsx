/**
 * Usage page — top-level tab shell.
 *
 * - Summary: cross-resource overview (KPIs + trend + by-type breakdown + donut)
 * - Tokens: existing per-request token usage page (untouched)
 * - GPU Instances: per-instance compute usage
 * - Storage: PV capacity usage
 * - Resource Events: lifecycle event list (created / metered / deleted / ...)
 *
 * Resource Events is kept as a tab (not a separate route) so the page filter
 * set stays consistent across all views.
 *
 * The previous implementation lived in this file; it now lives in
 * ``components/token-tab.tsx`` so we can host it as a tab pane.
 */
import { Tabs, TabsProps } from 'antd';
import React, { useMemo, useState } from 'react';
import GpuInstancesTab from './components/gpu-instances-tab';
import ResourceEvents from './components/resource-events';
import StorageTab from './components/storage-tab';
import SummaryTab from './components/summary-tab';
import TokenTab from './components/token-tab';

const Usage: React.FC = () => {
  // Land on the cross-resource Summary by default.
  const [activeKey, setActiveKey] = useState<string>('summary');

  const items: TabsProps['items'] = useMemo(
    () => [
      {
        key: 'summary',
        label: 'Summary',
        children: <SummaryTab />
      },
      {
        key: 'tokens',
        label: 'Tokens',
        children: <TokenTab />
      },
      {
        key: 'gpu-instances',
        label: 'GPU Instances',
        children: <GpuInstancesTab />
      },
      {
        key: 'storage',
        label: 'Storage',
        children: <StorageTab />
      },
      {
        key: 'resource-events',
        label: 'Resource Events',
        children: <ResourceEvents />
      }
    ],
    []
  );

  return (
    <Tabs
      activeKey={activeKey}
      onChange={setActiveKey}
      items={items}
      destroyOnHidden
      // The content area adds 24px top padding; on table pages that space is
      // filled immediately, but here it sits empty above the tab bar and reads
      // as too tall. Pull the tab bar up to ~flush with the header divider.
      tabBarStyle={{ marginTop: -20 }}
    />
  );
};

export default Usage;
