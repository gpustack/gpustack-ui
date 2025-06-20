import useSetChunkRequest, {
  createAxiosToken
} from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { Col, Row, Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import RowContext from '../row-context';
import TableContext from '../table-context';
import { RowContextProps, SealTableProps } from '../types';
import RowPrefix from './row-prefix';
import TableColumn from './seal-column';

const TableRow: React.FC<
  RowContextProps &
    Omit<SealTableProps, 'dataSource' | 'loading' | 'children' | 'empty'>
> = (props) => {
  const {
    record,
    rowIndex,
    expandable,
    rowSelection,
    expandedRowKeys = [],
    rowKey,
    childParentKey,
    columns,
    pollingChildren,
    watchChildren,
    onCell,
    onExpand,
    renderChildren,
    loadChildren,
    loadChildrenAPI
  } = props;
  const tableContext: any = React.useContext<{
    allChildren?: any[];
    setDisableExpand?: (record: any) => boolean;
  }>(TableContext);
  const { setChunkRequest } = useSetChunkRequest();
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const pollTimer = useRef<any>(null);
  const chunkRequestRef = useRef<any>(null);
  const childrenDataRef = useRef<any[]>([]);
  childrenDataRef.current = childrenData;
  const axiosToken = useRef<any>(null);
  const [updateChild, setUpdateChild] = useState(true);
  const [currentExpand, setCurrentExpand] = useState(false);

  const { updateChunkedList, cacheDataListRef } = useUpdateChunkedList({
    dataList: childrenData,
    limit: 100,
    setDataList: setChildrenData
  });

  useEffect(() => {
    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
      }
      chunkRequestRef.current?.current?.cancel?.();
      axiosToken.current?.cancel?.();
    };
  }, []);

  const expanded = useMemo(() => {
    return expandedRowKeys?.includes(record[rowKey]);
  }, [expandedRowKeys]);

  const checked = useMemo(() => {
    return rowSelection?.selectedRowKeys?.includes(record[rowKey]);
  }, [rowSelection?.selectedRowKeys, record, rowKey]);

  useEffect(() => {
    if (expandedRowKeys?.length === 0) {
      setCurrentExpand(false);
    }
  }, [expandedRowKeys.length]);

  const renderChildrenData = () => {
    if (childrenData.length === 0) {
      // return (
      //   <Empty
      //     image={loading ? null : Empty.PRESENTED_IMAGE_SIMPLE}
      //     description={loading ? null : undefined}
      //     style={{
      //       marginBlock: 0,
      //       height: 54
      //     }}
      //   ></Empty>
      // );
      return null;
    }
    return renderChildren?.(childrenData, {
      parent: record,
      currentExpanded: currentExpand
    });
  };

  const handlePolling = async () => {
    if (pollingChildren) {
      try {
        const data = await loadChildren?.(record);
        setChildrenData(data || []);
      } catch (error) {
        setChildrenData([]);
      }
    }
  };

  const handleLoadChildren = useCallback(async () => {
    try {
      axiosToken.current?.cancel?.();
      axiosToken.current = createAxiosToken();
      setLoading(true);
      const data = await loadChildren?.(record, {
        token: axiosToken.current?.token
      });

      setChildrenData(data || []);
      setLoading(false);
    } catch (error) {
      setChildrenData([]);
      setLoading(false);
    } finally {
      setFirstLoad(false);
    }
  }, [record, loadChildren]);

  const filterUpdateChildrenHandler = () => {
    const dataList = _.filter(tableContext.allChildren, (data: any) => {
      return _.get(data, [childParentKey]) === _.get(record, [rowKey]);
    });
    setChildrenData(dataList);
  };

  const updateChildrenHandler = (list: any) => {
    _.each(list, (data: any) => {
      updateChunkedList(data);
    });
  };

  const createChunkRequest = () => {
    chunkRequestRef.current?.current?.cancel?.();
    if (!watchChildren) {
      return;
    }
    const url = loadChildrenAPI?.(record) as string;
    try {
      chunkRequestRef.current = setChunkRequest({
        url,
        params: {
          page: 1,
          perPage: 100
        },
        handler: updateChildrenHandler
      });
    } catch (error) {
      // ignore
    }
  };

  const handleRowExpand = async () => {
    onExpand?.(!expanded, record, record[rowKey]);
    setCurrentExpand(!expanded);

    if (pollTimer.current) {
      clearInterval(pollTimer.current);
    }

    if (expanded) {
      axiosToken.current?.cancel?.();
      return;
    }

    if (pollingChildren) {
      await handleLoadChildren();
      pollTimer.current = setInterval(() => {
        handlePolling();
      }, 1000);
    } else {
      handleLoadChildren();
    }
  };

  const handleSelectChange = (e: any) => {
    if (e.target.checked) {
      // update selectedRowKeys
      rowSelection?.onChange(
        _.uniq([...rowSelection?.selectedRowKeys, record[rowKey]]),
        _.uniqBy([...rowSelection?.selectedRows, record], rowKey)
      );
    } else {
      // update selectedRowKeys
      rowSelection?.onChange(
        rowSelection?.selectedRowKeys.filter((key) => key !== record[rowKey]),
        rowSelection?.selectedRows.filter(
          (row) => row[rowKey] !== record[rowKey]
        )
      );
    }
  };

  const disableExpand = useMemo(() => {
    return tableContext.setDisableExpand?.(record);
  }, [tableContext.setDisableExpand, record]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        cacheDataListRef.current = [];
        setUpdateChild(false);
      } else {
        setUpdateChild(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (updateChild) {
      // for update watch data
      filterUpdateChildrenHandler();
    }
    return () => {
      chunkRequestRef.current?.current?.cancel?.();
      cacheDataListRef.current = [];
    };
  }, [updateChild, tableContext.allChildren]);

  return (
    <RowContext.Provider value={{ row: { ...record, rowIndex }, onCell }}>
      <div className="row-box">
        <div
          className={classNames('row-wrapper', {
            'row-wrapper-selected': checked
          })}
        >
          <RowPrefix
            expandable={expandable}
            enableSelection={rowSelection?.enableSelection}
            expanded={expanded}
            checked={checked}
            handleRowExpand={handleRowExpand}
            handleSelectChange={handleSelectChange}
            disableExpand={disableExpand}
          ></RowPrefix>
          <Row className="seal-table-row">
            {columns?.map((columnProps) => {
              return (
                <Col
                  key={`${columnProps.dataIndex}-${rowIndex}`}
                  span={columnProps.span}
                >
                  <TableColumn {...columnProps}></TableColumn>
                </Col>
              );
            })}
          </Row>
        </div>
        {expanded && !disableExpand && (
          <div className="expanded-row">
            <Spin spinning={loading}>{renderChildrenData()}</Spin>
          </div>
        )}
      </div>
    </RowContext.Provider>
  );
};

export default TableRow;
