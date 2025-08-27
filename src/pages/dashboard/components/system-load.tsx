import CardWrapper from '@/components/card-wrapper';
import GaugeChart from '@/components/echarts/gauge';
import PageTools from '@/components/page-tools';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import _ from 'lodash';
import { memo, useContext, useMemo } from 'react';
import { DashboardContext } from '../config/dashboard-context';
import ResourceUtilization from './resource-utilization';

const smallChartHeight = 190;
const largeChartHeight = 400;
const resourceChartHeight = 400;

const SystemLoad = () => {
  const intl = useIntl();
  const data = useContext(DashboardContext)?.system_load?.current || {};

  const chartData = useMemo(() => {
    return {
      gpu: {
        data: _.round(data.gpu || 0, 1)
      },
      vram: {
        data: _.round(data.vram || 0, 1)
      },
      cpu: {
        data: _.round(data.cpu || 0, 1)
      },
      ram: {
        data: _.round(data.ram || 0, 1)
      }
    };
  }, [data]);

  return (
    <div>
      <div className="system-load">
        <PageTools
          style={{ margin: '26px 0px' }}
          left={
            <span className="font-700">
              {intl.formatMessage({ id: 'dashboard.systemload' })}
            </span>
          }
        />
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={24} md={24} lg={24} xl={16}>
            <CardWrapper style={{ height: resourceChartHeight }}>
              <ResourceUtilization />
            </CardWrapper>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={8}>
            <CardWrapper style={{ height: largeChartHeight }}>
              <Row style={{ height: largeChartHeight }}>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <GaugeChart
                    height={smallChartHeight}
                    value={chartData.gpu.data}
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
                    value={chartData.vram.data}
                  ></GaugeChart>
                </Col>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <GaugeChart
                    title={intl.formatMessage({
                      id: 'dashboard.cpuutilization'
                    })}
                    height={smallChartHeight}
                    value={chartData.cpu.data}
                  ></GaugeChart>
                </Col>
                <Col span={12} style={{ height: smallChartHeight }}>
                  <GaugeChart
                    title={intl.formatMessage({
                      id: 'dashboard.memoryutilization'
                    })}
                    height={smallChartHeight}
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
