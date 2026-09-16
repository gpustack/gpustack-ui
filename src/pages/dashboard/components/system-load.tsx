import { queryClusterList } from '@/pages/cluster-management/apis';
import { BaseSelect, CardWrapper, PageTools } from '@gpustack/core-ui';
import { GaugeChart } from '@gpustack/core-ui/charts';
import { useIntl } from '@umijs/max';
import { Col, Row } from 'antd';
import _ from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import { sectionHeadingStyle, sectionTitleStyle } from '../config';
import { DashboardContext } from '../config/dashboard-context';
import ResourceUtilization from './resource-utilization';
const smallChartHeight = 190;
const resourceChartHeight = 400;

const SystemLoad = () => {
  const intl = useIntl();
  const { system_load, fetchData } = useContext(DashboardContext);
  const [systemLoadData, setSystemLoadData] = useState<any>(system_load || {});
  const [clusterList, setClusterList] = useState<Global.BaseOption<number>[]>(
    []
  );

  const chartData = useMemo(() => {
    const data = systemLoadData?.current || {};
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
  }, [systemLoadData?.current]);

  useEffect(() => {
    setSystemLoadData(system_load || {});
  }, [system_load]);

  const handleClusterChange = async (value: number) => {
    try {
      const res: any = await fetchData({ cluster_id: value });
      setSystemLoadData(res.system_load || {});
    } catch (error) {
      setSystemLoadData({});
    }
  };

  useEffect(() => {
    const fetchClusters = async () => {
      try {
        const res = await queryClusterList({ page: -1 });
        const options = res.items.map((cluster: any) => ({
          label: cluster.name,
          value: cluster.id
        }));
        setClusterList(options);
      } catch (error) {
        setClusterList([]);
      }
    };
    fetchClusters();
  }, []);

  return (
    <div>
      <div className="system-load">
        <PageTools
          style={sectionHeadingStyle}
          left={
            <span style={sectionTitleStyle}>
              {intl.formatMessage({ id: 'dashboard.systemload' })}
            </span>
          }
          right={
            <BaseSelect
              allowClear
              onChange={handleClusterChange}
              style={{ width: 360 }}
              options={clusterList}
              placeholder={intl.formatMessage({
                id: 'clusters.filterBy.cluster'
              })}
            />
          }
        />
        {/* `align="stretch"` makes the trend chart the one that sets the row's
            height; the gauge card then takes 100% of it instead of restating
            the same 400 in a second constant. Below `xl` the two cards stack,
            each line sizes to its own content, and the gauge card collapses to
            whatever its grid actually needs. */}
        <Row gutter={[20, 20]} align="stretch">
          <Col xs={24} sm={24} md={24} lg={24} xl={16}>
            <CardWrapper style={{ height: resourceChartHeight }}>
              <ResourceUtilization data={systemLoadData?.history} />
            </CardWrapper>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} xl={8}>
            <CardWrapper style={{ height: '100%' }}>
              {/* The gauges' breakpoints run OPPOSITE to the usual direction,
                  because it is the PARENT that widens as the viewport narrows:
                  at `xl` this card is a third of the row, so 2x2 is right, and
                  below `xl` it goes full width, where 2x2 left each 175px gauge
                  floating in ~400px of dead space and doubled the page's
                  scroll length. Four across is the dense arrangement, and it
                  belongs to the WIDER card, not the wider window.
                  Under `md` the window itself is too narrow for four, so it
                  falls back to 2x2. */}
              <Row>
                <Col
                  xs={12}
                  md={6}
                  xl={12}
                  style={{ height: smallChartHeight }}
                >
                  <GaugeChart
                    height={smallChartHeight}
                    value={chartData.gpu.data}
                    title={intl.formatMessage({
                      id: 'dashboard.gpuutilization'
                    })}
                  ></GaugeChart>
                </Col>
                <Col
                  xs={12}
                  md={6}
                  xl={12}
                  style={{ height: smallChartHeight }}
                >
                  <GaugeChart
                    title={intl.formatMessage({
                      id: 'dashboard.vramutilization'
                    })}
                    height={smallChartHeight}
                    value={chartData.vram.data}
                  ></GaugeChart>
                </Col>
                <Col
                  xs={12}
                  md={6}
                  xl={12}
                  style={{ height: smallChartHeight }}
                >
                  <GaugeChart
                    title={intl.formatMessage({
                      id: 'dashboard.cpuutilization'
                    })}
                    height={smallChartHeight}
                    value={chartData.cpu.data}
                  ></GaugeChart>
                </Col>
                <Col
                  xs={12}
                  md={6}
                  xl={12}
                  style={{ height: smallChartHeight }}
                >
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

export default SystemLoad;
