import DeleteModal from '@/components/delete-modal';
import BaseSelect from '@/components/seal-form/base/select';
import { useIntl, useNavigate, useSearchParams } from '@umijs/max';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect, useRef } from 'react';
import { PageContainerInner } from '../_components/page-box';
import PageBreadcrumb from '../_components/page-breadcrumb';
import { deleteBenchmark } from './apis';
import DetailContent from './components/detail-content';
import FadeIn from './components/fade-in';
import RowActions from './components/row-actions';
import ViewLogsModal from './components/view-logs-modal';
import DetailContext from './config/detail-context';
import { BenchmarkListItem } from './config/types';
import useViewLogs from './hooks/use-view-logs';
import { useExportBenchmark } from './services/use-export-benchmark';
import useQueryBenchmarkList from './services/use-query-benchmarks';
import useQueryDetail from './services/use-query-detail';
import useQueryProfiles from './services/use-query-profiles';
import useStopBenchmark from './services/use-stop-benchmark';

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
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');
  const id = searchParams.get('id');

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
    <PageContainerInner
      header={{
        title: <PageBreadcrumb items={breadcrumbItems} />
      }}
    >
      <DetailContext.Provider
        value={{
          detailData: detailData || {},
          clusterList: [],
          loading: loading,
          id: Number(id),
          profilesOptions: profilesOptions
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
    </PageContainerInner>
  );
};

export default Details;
