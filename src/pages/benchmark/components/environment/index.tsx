import { Tag } from 'antd';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useDetailContext } from '../../config/detail-context';
import WorkerData from './worker-data';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Environment: React.FC = () => {
  const { detailData } = useDetailContext();
  const { snapshot } = detailData;

  const mainWorker = useMemo(() => {
    // get workers data
    const [[workerName, workerInfo]] = Object.entries(snapshot.workers);
    const gpuData = Object.values(snapshot.gpus).filter(
      (gpu) => gpu.worker_name === workerName
    );

    return {
      workerData: workerInfo,
      gpuData: [...gpuData, ...gpuData]
    };
  }, [snapshot]);

  const subWorkers = useMemo(() => {
    const [[mainWorkerName, mainWorkerInfo]] = Object.entries(snapshot.workers);

    const subOrdinaryWorkers = Object.values(snapshot.instances).filter(
      (instance) => instance.worker_name === mainWorkerName
    );

    return subOrdinaryWorkers.map((worker) => {
      const gpuData = Object.values(snapshot.gpus).filter(
        (gpu) => gpu.worker_name === worker.worker_name
      );

      return {
        workerData: worker,
        gpuData: gpuData
      };
    });
  }, [snapshot, mainWorker]);

  return (
    <Container>
      <WorkerData
        workerData={mainWorker.workerData}
        gpuData={mainWorker.gpuData}
        title={
          <div className="flex-center gap-8">
            <Tag color="geekblue">Main</Tag>
            <span>{mainWorker?.workerData?.name}</span>
          </div>
        }
      ></WorkerData>
      <WorkerData
        workerData={mainWorker.workerData}
        gpuData={mainWorker.gpuData}
        title={
          <div className="flex-center gap-8">
            <Tag
              style={{
                backgroundColor: 'var(--ant-color-fill-secondary)',
                color: 'var(--ant-color-text-tertiary)'
              }}
            >
              Sub
            </Tag>
            <span>{mainWorker?.workerData?.name}</span>
          </div>
        }
      ></WorkerData>
      {/* {subWorkers?.map?.((worker, index) => (
        <WorkerData
          key={index}
          workerData={worker.workerData}
          gpuData={worker.gpuData}
        ></WorkerData>
      ))} */}
    </Container>
  );
};

export default Environment;
