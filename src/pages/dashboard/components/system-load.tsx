import CardWrapper from '@/components/card-wrapper';
import PageTools from '@/components/page-tools';
import breakpoints from '@/config/breakpoints';
import useWindowResize from '@/hooks/use-window-resize';
import { Col, DatePicker, Row } from 'antd';
import _ from 'lodash';
import { useContext, useEffect, useState } from 'react';
import UitilBar from '../../../components/util-bar';
import { DashboardContext } from '../config/dashboard-context';
import ResourceUtilization from './resource-utilization';

const SystemLoad = () => {
  const colors = [
    'linear-gradient(90deg, rgba(84, 204, 152,.8) 0%, rgba(84, 204, 152,0.5) 50%,  rgba(84, 204, 152,.8) 100%)',
    'linear-gradient(90deg, rgba(255, 214, 102,.8) 0%, rgba(255, 214, 102,0.5) 50%,  rgba(255, 214, 102,.8) 100%)',
    'linear-gradient(90deg, rgba(255, 120, 117,.8) 0%, rgba(255, 120, 117,0.5) 50%,  rgba(255, 120, 117,.8) 100%)'
  ];
  const data = useContext(DashboardContext)?.system_load?.current || {};
  const { size } = useWindowResize();
  const [paddingRight, setPaddingRight] = useState<string>('20px');
  const [smallChartHeight, setSmallChartHeight] = useState<number>(190);
  const [largeChartHeight, setLargeChartHeight] = useState<number>(400);
  const thresholds = [0.5, 0.7, 1];
  const height = 400;

  const handleSelectDate = (date: string) => {};

  useEffect(() => {
    if (size.width < breakpoints.xl) {
      setPaddingRight('0');
    } else {
      setPaddingRight('20px');
    }
  }, [size.width]);

  return (
    <div>
      <div className="system-load">
        <PageTools
          style={{ margin: '32px 8px' }}
          left={
            <span style={{ fontSize: 'var(--font-size-large)' }}>
              System Load
            </span>
          }
          right={
            <DatePicker onChange={handleSelectDate} style={{ width: 300 }} />
          }
        />
        <Row style={{ width: '100%' }} gutter={[0, 20]}>
          <Col
            xs={24}
            sm={24}
            md={24}
            lg={24}
            xl={16}
            style={{ paddingRight: paddingRight }}
          >
            <CardWrapper style={{ height: height, width: '100%' }}>
              <ResourceUtilization />
            </CardWrapper>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={8}>
            <CardWrapper style={{ height: largeChartHeight, width: '100%' }}>
              <Row style={{ height: largeChartHeight, width: '100%' }}>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <UitilBar
                    title="GPU Compute Utilization"
                    percent={_.round(data.gpu?.utilization_rate || 0, 1)}
                  ></UitilBar>
                </Col>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <UitilBar
                    title="GPU Memory Utilization"
                    percent={_.round(data.gpu_memory?.utilization_rate || 0, 1)}
                  ></UitilBar>
                </Col>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <UitilBar
                    title="CPU Compute Utilization"
                    percent={_.round(data.cpu?.utilization_rate || 0, 1)}
                  ></UitilBar>
                </Col>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <UitilBar
                    title="CPU Memory Utilization"
                    percent={_.round(data.memory?.utilization_rate || 0, 1)}
                  ></UitilBar>
                </Col>
              </Row>
            </CardWrapper>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SystemLoad;
