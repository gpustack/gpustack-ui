import { BaseSelect, DeleteModal } from '@gpustack/core-ui';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { useMemoizedFn, useThrottleFn } from 'ahooks';
import { Flex } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { HeaderLeft } from '../_components/page-box';
import PageBreadcrumb from '../_components/page-breadcrumb';
import { deleteBenchmark } from './apis';
import BenchmarkStateTag from './components/benchmark-state-tag';
import DetailContent from './components/detail-content';
import FadeIn from './components/fade-in';
import RowActions from './components/row-actions';
import ViewLogsModal from './components/view-logs-modal';
import DetailContext from './config/detail-context';
import { BenchmarkListItem } from './config/types';
import useCloneBenchmark from './hooks/use-clone-benchmark';
import useViewLogs from './hooks/use-view-logs';
import { useExportBenchmark } from './services/use-export-benchmark';
import useQueryBenchmarkList from './services/use-query-benchmarks';
import useQueryDetail from './services/use-query-detail';
import useQueryProfiles from './services/use-query-profiles';
import useStopBenchmark from './services/use-stop-benchmark';
import useWatchBenchmarkDetail from './services/use-watch-detail';
const Details: React.FC = () => {
  const modalRef = useRef<any>(null);
  const navigate = useNavigate();
  const intl = useIntl();
  const {
    dataList: benchmarkList,
    fetchData: fetchBenchmarkList,
    cancelRequest: cancelBenchmarkRequest
  } = useQueryBenchmarkList();
  const {
    profilesOptions,
    fetchProfilesData,
    cancelRequest: cancelProfilesRequest
  } = useQueryProfiles();
  const { loading, detailData, cancelRequest, fetchData } = useQueryDetail();
  const { openViewLogsModal, closeViewLogsModal, openViewLogsModalStatus } =
    useViewLogs();
  const { handleStopBenchmark } = useStopBenchmark();
  const { exportData } = useExportBenchmark();
  const { cloneBenchmarkOnList } = useCloneBenchmark();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');
  const id = searchParams.get('id');

  // Bumped on each live refresh so the Summary tab re-pulls the per-point
  // results (which don't ride the row's stream).
  const [refreshToken, setRefreshToken] = useState(0);

  // The watch stream fires on every row write — progress ticks ~1s while the
  // partial sync only lands new points ~10s — so throttle the authoritative
  // re-pull. `trailing` guarantees the final (terminal) state still lands.
  const { run: handleLiveRefresh } = useThrottleFn(
    () => {
      if (id) {
        fetchData(id);
      }
      setRefreshToken((token) => token + 1);
    },
    { wait: 3000, leading: true, trailing: true }
  );

  useWatchBenchmarkDetail({
    id: id ? Number(id) : null,
    onChange: handleLiveRefresh
  });

  const handleOnChange = (value: number, option: any) => {
    navigate(
      `/models/benchmark/detail?id=${option.value}&name=${option.label}`,
      { state: 'benchmark-details', replace: true }
    );
  };

  const breadcrumbItems = [
    {
      title: <a>{intl.formatMessage({ id: 'benchmark.title' })}</a>,
      onClick: () => navigate(-1)
    },
    {
      title: (
        <BaseSelect
          size="small"
          variant="borderless"
          options={benchmarkList}
          value={name}
          style={{ minWidth: 100 }}
          popupMatchSelectWidth={false}
          onChange={handleOnChange}
        ></BaseSelect>
      )
    }
  ];

  const handleDelete = (row: BenchmarkListItem) => {
    modalRef.current?.show({
      content: 'benchmark.title',
      operation: 'common.delete.single.confirm',
      name: row.name,
      async onOk() {
        await deleteBenchmark(row.id);
        fetchBenchmarkList({ page: -1 }).then((items) => {
          if (items.length === 0) {
            navigate(-1);
          } else {
            handleOnChange(items[0].id, {
              value: items[0].id,
              label: items[0].name
            });
          }
        });
      }
    });
  };

  const handleSelect = useMemoizedFn((val: any, row: BenchmarkListItem) => {
    if (val === 'delete') {
      handleDelete({ ...row, name: row.name });
    } else if (val === 'clone') {
      // The create drawer lives on the list page; hand this run over and let it
      // open pre-filled there.
      cloneBenchmarkOnList(row);
    } else if (val === 'viewlog') {
      openViewLogsModal(row);
    } else if (val === 'stop') {
      handleStopBenchmark(row.id);
    } else if (val === 'export') {
      exportData([row.id], row.name);
    }
  });

  useEffect(() => {
    document.title = `${intl.formatMessage({ id: 'benchmark.title' })} - ${name}`;
  }, [name, intl]);

  useEffect(() => {
    fetchBenchmarkList({ page: -1 });
    fetchProfilesData();
    return () => {
      cancelBenchmarkRequest();
      cancelProfilesRequest();
    };
  }, []);

  useEffect(() => {
    if (id) {
      fetchData(id);
    } else {
      cancelRequest();
    }
  }, [id]);

  return (
    <>
      <HeaderLeft>
        {/* Run status sits next to the name so it's visible on every tab; it
            updates live via the watch-driven detailData refresh. */}
        <Flex align="center" gap={12}>
          <PageBreadcrumb items={breadcrumbItems} />
          <BenchmarkStateTag data={detailData as any} />
        </Flex>
      </HeaderLeft>
      <DetailContext.Provider
        value={{
          detailData: detailData || {},
          clusterList: [],
          loading: loading,
          id: Number(id),
          profilesOptions: profilesOptions,
          refreshToken: refreshToken
        }}
      >
        <DetailContent
          tabBarExtraContent={{
            right: (
              <FadeIn>
                <div
                  style={{
                    opacity: loading ? 0 : 1,
                    position: 'relative',
                    bottom: 1,
                    right: -1
                  }}
                >
                  <RowActions
                    page="detail"
                    record={detailData as any}
                    handleSelect={handleSelect}
                  ></RowActions>
                </div>
              </FadeIn>
            )
          }}
        ></DetailContent>
      </DetailContext.Provider>
      <ViewLogsModal
        open={openViewLogsModalStatus.open}
        url={openViewLogsModalStatus.url}
        tail={openViewLogsModalStatus.tail}
        onCancel={closeViewLogsModal}
      ></ViewLogsModal>
      <DeleteModal ref={modalRef}></DeleteModal>
    </>
  );
};

export default Details;
