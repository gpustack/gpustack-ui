import LogsViewer from '@/components/logs-viewer/virtual-log-list';
import React, { useRef } from 'react';
import { BENCHMARKS_API } from '../../apis';
import { useDetailContext } from '../../config/detail-context';

const Logs: React.FC = () => {
  const { id } = useDetailContext();
  const logsViewerRef = useRef<any>(null);
  return (
    <div>
      <LogsViewer
        ref={logsViewerRef}
        diffHeight={175}
        url={`${BENCHMARKS_API}/${id}/logs`}
        tail={undefined}
        enableScorllLoad={true}
        isDownloading={false}
        params={{
          follow: true
        }}
      ></LogsViewer>
    </div>
  );
};

export default Logs;
