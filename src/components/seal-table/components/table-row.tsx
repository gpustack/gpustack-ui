import useSetChunkRequest from '@/hooks/use-chunk-request';
import useUpdateChunkedList from '@/hooks/use-update-chunk-list';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Checkbox, Col, Empty, Row, Spin } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import RowContext from '../row-context';
import TableContext from '../table-context';
import { RowContextProps, SealTableProps } from '../types';

const TableRow: React.FC<
  RowContextProps &
    Omit<SealTableProps, 'dataSource' | 'loading' | 'children' | 'empty'>
> = (props) => {
  const {
    record,
    rowIndex,
    expandable,
    rowSelection,
    expandedRowKeys,
    rowKey,
    childParentKey,
    columns,
    pollingChildren,
    watchChildren,
    onExpand,
    renderChildren,
    loadChildren,
    loadChildrenAPI
  } = props;
  const tableContext: any = React.useContext<{
    allChildren?: any[];
  }>(TableContext);
  const { setChunkRequest } = useSetChunkRequest();
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState(false);
  const [childrenData, setChildrenData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const pollTimer = useRef<any>(null);
  const chunkRequestRef = useRef<any>(null);
  const childrenDataRef = useRef<any[]>([]);
  childrenDataRef.current = childrenData;

  console.log(
    'table row====',
    record,
    childrenData,
    record.name,
    firstLoad,
    expanded
  );
  const { updateChunkedList, cacheDataListRef } = useUpdateChunkedList({
    dataList: childrenData,
    setDataList: setChildrenData
    // callback: (list) => renderChildren?.(list)
  });

  useEffect(() => {
    if (rowSelection) {
      const { selectedRowKeys } = rowSelection;
      if (selectedRowKeys.includes(record[rowKey])) {
        setChecked(true);
      } else {
        setChecked(false);
      }
    }
  }, [rowSelection]);

  // useEffect(() => {
  //   if (expandedRowKeys?.includes(record[rowKey])) {
  //     setExpanded(true);
  //   } else {
  //     setExpanded(false);
  //   }
  // }, [expandedRowKeys]);

  useEffect(() => {
    return () => {
      if (pollTimer.current) {
        clearInterval(pollTimer.current);
      }
      chunkRequestRef.current?.current?.cancel?.();
    };
  }, []);

  const renderChildrenData = () => {
    return renderChildren?.(childrenData);
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

  const handleLoadChildren = async () => {
    console.log('first load=====', firstLoad);
    try {
      setLoading(true);
      const data = await loadChildren?.(record);

      setChildrenData(data || []);
      setLoading(false);
    } catch (error) {
      setChildrenData([]);
      setLoading(false);
    } finally {
      setFirstLoad(false);
    }
  };

  const filterUpdateChildrenHandler = () => {
    _.each(tableContext.allChildren || [], (data: any) => {
      if (_.get(data, ['data', [childParentKey]]) === _.get(record, [rowKey])) {
        updateChunkedList(data);
      }
    });
  };

  const updateChildrenHandler = (list: any) => {
    _.each(list, (data: any) => {
      updateChunkedList(data, childrenDataRef.current);
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
    setExpanded(!expanded);
    onExpand?.(!expanded, record, record[rowKey]);
    console.log('expanded=====', record);

    if (pollTimer.current) {
      clearInterval(pollTimer.current);
    }

    if (expanded) {
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
        _.uniq([...rowSelection?.selectedRowKeys, record[rowKey]])
      );
    } else {
      // update selectedRowKeys
      rowSelection?.onChange(
        rowSelection?.selectedRowKeys.filter((key) => key !== record[rowKey])
      );
    }
  };

  useEffect(() => {
    if (!firstLoad && expanded) {
      console.log(
        'update children=====',
        record.name,
        tableContext.allChildren
      );
      cacheDataListRef.current = childrenData;
      filterUpdateChildrenHandler();
    }
    return () => {
      chunkRequestRef.current?.current?.cancel?.();
      cacheDataListRef.current = [];
    };
  }, [firstLoad, expanded, tableContext.allChildren]);

  const renderRowPrefix = () => {
    if (expandable && rowSelection) {
      return (
        <div className="row-prefix-wrapper">
          <span style={{ marginRight: 5 }}>
            {_.isBoolean(expandable) ? (
              <Button type="text" size="small" onClick={handleRowExpand}>
                {expanded ? <DownOutlined /> : <RightOutlined />}
              </Button>
            ) : (
              expandable
            )}
          </span>
          <Checkbox onChange={handleSelectChange} checked={checked}></Checkbox>
        </div>
      );
    }
    if (expandable) {
      return (
        <div className="row-prefix-wrapper">
          {_.isBoolean(expandable) ? (
            <Button type="text" size="small" onClick={handleRowExpand}>
              {expanded ? <DownOutlined /> : <RightOutlined />}
            </Button>
          ) : (
            expandable
          )}
        </div>
      );
    }
    if (rowSelection) {
      return (
        <div className="row-prefix-wrapper">
          {
            <Checkbox
              onChange={handleSelectChange}
              checked={checked}
            ></Checkbox>
          }
        </div>
      );
    }
    return null;
  };

  return (
    <RowContext.Provider value={{ ...record, rowIndex }}>
      <div className="row-box">
        <div
          className={classNames('row-wrapper', {
            'row-wrapper-selected': checked
          })}
        >
          {renderRowPrefix()}
          <Row className="seal-table-row">
            {React.Children.map(columns, (child) => {
              const { props: columnProps } = child as any;
              if (React.isValidElement(child)) {
                return (
                  <Col
                    key={`${columnProps.dataIndex}-${rowIndex}`}
                    span={columnProps.span}
                  >
                    {child}
                  </Col>
                );
              }
              return <Col span={columnProps.span}></Col>;
            })}
          </Row>
        </div>
        {expanded && (
          <div className="expanded-row">
            <Spin spinning={loading}>
              {childrenData.length ? (
                renderChildrenData()
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>
              )}
            </Spin>
          </div>
        )}
      </div>
    </RowContext.Provider>
  );
};

export default React.memo(TableRow);
