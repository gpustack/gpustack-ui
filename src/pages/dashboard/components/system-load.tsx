import CardWrapper from '@/components/card-wrapper';
import GaugeChart from '@/components/echarts/gauge';
import PageTools from '@/components/page-tools';
import breakpoints from '@/config/breakpoints';
import useWindowResize from '@/hooks/use-window-resize';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import _ from 'lodash';
import { memo, useContext, useEffect, useMemo, useState } from 'react';
import { DashboardContext } from '../config/dashboard-context';
import ResourceUtilization from './resource-utilization';

const strokeColorFunc = (percent: number) => {
  if (percent <= 50) {
    return 'rgb(84, 204, 152, 80%)';
  }
  if (percent <= 80) {
    return 'rgba(250, 173, 20, 80%)';
  }
  return ' rgba(255, 77, 79, 80%)';
};

const SystemLoad = () => {
  const intl = useIntl();
  const data = useContext(DashboardContext)?.system_load?.current || {};
  const { size } = useWindowResize();
  const [paddingRight, setPaddingRight] = useState<string>('20px');
  const [smallChartHeight, setSmallChartHeight] = useState<number>(190);
  const [largeChartHeight, setLargeChartHeight] = useState<number>(400);

  const height = 400;

  const chartData = useMemo(() => {
    return {
      gpu: {
        data: _.round(data.gpu || 0, 1),
        color: strokeColorFunc(data.gpu)
      },
      vram: {
        data: _.round(data.vram || 0, 1),
        color: strokeColorFunc(data.vram)
      },
      cpu: {
        data: _.round(data.cpu || 0, 1),
        color: strokeColorFunc(data.cpu)
      },
      ram: {
        data: _.round(data.ram || 0, 1),
        color: strokeColorFunc(data.ram)
      }
    };
  }, [data]);

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
          style={{ margin: '26px 0px' }}
          left={
            <span>{intl.formatMessage({ id: 'dashboard.systemload' })}</span>
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
                  <GaugeChart
                    height={smallChartHeight}
                    value={chartData.gpu.data}
                    color={chartData.gpu.color}
                    title={intl.formatMessage({
                      id: 'dashboard.gpuutilization'
                    })}
                  ></GaugeChart>
                </Col>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <GaugeChart
                    title={intl.formatMessage({
                      id: 'dashboard.vramutilization'
                    })}
                    height={smallChartHeight}
                    color={chartData.vram.color}
                    value={chartData.vram.data}
                  ></GaugeChart>
                </Col>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <GaugeChart
                    title={intl.formatMessage({
                      id: 'dashboard.cpuutilization'
                    })}
                    height={smallChartHeight}
                    color={chartData.cpu.color}
                    value={chartData.cpu.data}
                  ></GaugeChart>
                </Col>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <GaugeChart
                    title={intl.formatMessage({
                      id: 'dashboard.memoryutilization'
                    })}
                    height={smallChartHeight}
                    color={chartData.ram.color}
                    value={chartData.ram.data}
                  ></GaugeChart>
                </Col>
              </Row>
            </CardWrapper>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default memo(SystemLoad);
