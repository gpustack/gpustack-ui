import { queryModelsInstances } from '@/pages/llmodels/apis';
import { Edge, Graph, Node } from '@antv/g6';
import { useEffect, useRef } from 'react';
import { queryGpuDevicesList, queryWorkersList } from '../apis';
import testData from '../config/test-data';

const ResourceOverview = () => {
  const containerRef = useRef<any>(null);

  const generateGraphData = (
    workerList: any[],
    gpuDeviceList: any[],
    modelsInstancesList: []
  ) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    modelsInstancesList.forEach((item: any) => {
      const instanceNode = {
        id: item.id,
        size: 15,
        nodeType: 'instance',
        isLeaf: true
      };

      const workerNode = {
        id: item.worker_id,
        size: 30,
        nodeType: 'worker'
      };

      const gpuData = gpuDeviceList.filter(
        (gpu) =>
          gpu.worker_id === item.worker_id &&
          item.gpu_indexes.includes(gpu.index)
      );

      nodes.push(node);
      edges.push({
        source: item.worker_id,
        target: item.id
      });
    });
  };

  const fetchData = async () => {
    const [workerList, gpuDevices, modelsInstances] = await Promise.all([
      queryWorkersList({ page: 1 }),
      queryGpuDevicesList({ page: 1 }),
      queryModelsInstances({ page: 1 })
    ]);
    const workerListData = workerList?.items || [];
    const gpuDeviceList = gpuDevices?.items || [];
    const modelsInstancesList = modelsInstances?.items?.filter(
      (item) => item.worker_id
    );
  };

  useEffect(() => {
    if (containerRef.current) {
      const graph = new Graph({
        container: containerRef.current,
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
        data: testData,
        node: {
          label: {
            show: true
          },
          style: {
            size: (d) => d.size
          }
        },
        layout: {
          type: 'd3-force',
          link: {
            distance: (d) => {
              if (d.source.id === 'node0') {
                return 100;
              }
              return 30;
            },
            strength: (d) => {
              if (
                d.source.id === 'node1' ||
                d.source.id === 'node2' ||
                d.source.id === 'node3'
              ) {
                return 0.7;
              }
              return 0.1;
            }
          },
          manyBody: {
            strength: (d) => {
              if (d.isLeaf) {
                return -50;
              }
              return -10;
            }
          }
        },
        behaviors: ['drag-canvas', 'zoom-canvas']
      });

      graph.render();
    }
  }, []);
  return (
    <div
      ref={containerRef}
      className="graph-wrapper"
      style={{ height: 'calc(100vh - 220px)' }}
    ></div>
  );
};

export default ResourceOverview;
