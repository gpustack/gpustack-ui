import SingleImage from '@/components/auto-image/single-image';
import { Col, Row } from 'antd';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import '../style/thumb-img.less';

const ThumbImg: React.FC<{
  dataList: any[];
  column?: number;
  layout?: {
    rows: number;
    cols: number;
  };
  preview?: boolean;
  editable?: boolean;
  onDelete?: (uid: number) => void;
  onClick?: (item: any) => void;
  loading?: boolean;
  style?: React.CSSProperties;
  responseable?: boolean;
  gutter?: number | number[] | object;
  justify?: any;
  autoSize?: boolean;
  autoBgColor?: boolean;
}> = ({
  layout = {
    rows: 1,
    cols: 1
  },
  preview = true,
  column = 2,
  dataList,
  editable,
  responseable,
  gutter,
  onDelete,
  onClick,
  autoBgColor,
  autoSize,
  style
}) => {
  const handleOnDelete = useCallback(
    (uid: number) => {
      onDelete?.(uid);
    },
    [onDelete]
  );

  const handleOnClick = useCallback(
    (item: any) => {
      console.log('item=======', item);
      onClick?.(item);
    },
    [onClick]
  );

  const responseableStyle: Record<number, any> = useMemo(() => {
    if (!responseable) return {};
    if (dataList.length === 1) {
      return {
        0: {
          justifyContent: 'center',
          alignItems: 'center'
        }
      };
    }
    if (dataList.length === 2) {
      return {
        0: {
          justifyContent: 'flex-end',
          alignItems: 'center'
        },
        1: {
          justifyContent: 'flex-start',
          alignItems: 'center'
        }
      };
    }
    if (dataList.length === 3) {
      return {
        0: {
          justifyContent: 'flex-end',
          alignItems: 'flex-end'
        },
        1: {
          justifyContent: 'flex-start',
          alignItems: 'flex-end'
        },
        2: {
          justifyContent: 'flex-end',
          alignItems: 'flex-start'
        }
      };
    }
    return {
      0: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end'
      },
      1: {
        justifyContent: 'flex-start',
        alignItems: 'flex-end'
      },
      2: {
        justifyContent: 'flex-end',
        alignItems: 'flex-start'
      },
      3: {
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
      }
    };
  }, [dataList, responseable, column]);

  return (
    <>
      {dataList?.length ? (
        <div className="thumb-list-wrap" style={{ ...style }}>
          {responseable ? (
            <>
              <Row
                gutter={gutter || []}
                className="flex-center"
                style={{
                  height: dataList.length > column ? '50%' : '100%',
                  flex: 'none',
                  width: '100%',
                  justifyContent:
                    dataList.length === 1 ? 'center' : 'flex-start'
                }}
              >
                {_.map(
                  _.slice(dataList, 0, column),
                  (item: any, index: number) => {
                    return (
                      <Col
                        span={item.span}
                        key={`1-${index}`}
                        className="flex-center justify-center"
                        style={{ height: '100%', width: '100%' }}
                      >
                        <SingleImage
                          {...item}
                          preview={preview}
                          style={{ ...(responseableStyle[index] || {}) }}
                          loading={item.loading}
                          autoSize={autoSize}
                          editable={editable}
                          autoBgColor={autoBgColor}
                          onDelete={handleOnDelete}
                          onClick={() => handleOnClick(item)}
                        ></SingleImage>
                      </Col>
                    );
                  }
                )}
              </Row>
              {dataList.length > column && (
                <Row
                  gutter={gutter || []}
                  style={{
                    height: '50%',
                    flex: 'none',
                    width: '100%',
                    justifyContent:
                      dataList.length === 1 ? 'center' : 'flex-start'
                  }}
                  className="flex-center"
                >
                  {_.map(_.slice(dataList, 2), (item: any, index: number) => {
                    return (
                      <Col
                        span={item.span}
                        key={`2-${index}`}
                        className="flex-center justify-center"
                        style={{ height: '100%', width: '100%' }}
                      >
                        <SingleImage
                          {...item}
                          preview={preview}
                          style={{ ...(responseableStyle[index + 2] || {}) }}
                          loading={item.loading}
                          autoSize={autoSize}
                          editable={editable}
                          autoBgColor={autoBgColor}
                          onDelete={handleOnDelete}
                          onClick={() => handleOnClick(item)}
                        ></SingleImage>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </>
          ) : (
            <>
              {_.map(dataList, (item: any) => {
                return (
                  <SingleImage
                    {...item}
                    preview={preview}
                    key={item.uid}
                    autoSize={autoSize}
                    editable={editable}
                    autoBgColor={autoBgColor}
                    onDelete={handleOnDelete}
                    onClick={() => handleOnClick(item)}
                  ></SingleImage>
                );
              })}
            </>
          )}
        </div>
      ) : null}
    </>
  );
};

export default React.memo(ThumbImg);
