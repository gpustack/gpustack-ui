import SingleImage from '@/components/auto-image/single-image';
import { Col, Row } from 'antd';
import _ from 'lodash';
import React, { useCallback } from 'react';
import '../style/thumb-img.less';

const ThumbImg: React.FC<{
  dataList: any[];
  editable?: boolean;
  onDelete?: (uid: number) => void;
  loading?: boolean;
  style?: React.CSSProperties;
  responseable?: boolean;
  gutter?: number | number[] | object;
  justify?: any;
  autoSize?: boolean;
  autoBgColor?: boolean;
}> = ({
  dataList,
  editable,
  responseable,
  gutter,
  onDelete,
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

  if (!dataList?.length) {
    return null;
  }

  return (
    <>
      {
        <div className="thumb-list-wrap" style={{ ...style }}>
          {responseable ? (
            <>
              <Row
                gutter={gutter || []}
                className="flex-center"
                style={{
                  height: dataList.length > 2 ? '50%' : '100%',
                  flex: 'none',
                  width: '100%',
                  justifyContent:
                    dataList.length === 1 ? 'center' : 'flex-start'
                }}
              >
                {_.map(_.slice(dataList, 0, 2), (item: any, index: string) => {
                  return (
                    <Col
                      span={item.span}
                      key={`1-${index}`}
                      className="flex-center justify-center"
                      style={{ height: '100%', width: '100%' }}
                    >
                      <SingleImage
                        {...item}
                        autoSize={autoSize}
                        editable={editable}
                        autoBgColor={autoBgColor}
                        onDelete={handleOnDelete}
                      ></SingleImage>
                    </Col>
                  );
                })}
              </Row>
              {dataList.length > 2 && (
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
                  {_.map(_.slice(dataList, 2), (item: any, index: string) => {
                    return (
                      <Col
                        span={item.span}
                        key={`2-${index}`}
                        className="flex-center justify-center"
                        style={{ height: '100%', width: '100%' }}
                      >
                        <SingleImage
                          {...item}
                          loading={item.loading}
                          autoSize={autoSize}
                          editable={editable}
                          autoBgColor={autoBgColor}
                          onDelete={handleOnDelete}
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
                    autoSize={autoSize}
                    editable={editable}
                    autoBgColor={autoBgColor}
                    onDelete={handleOnDelete}
                  ></SingleImage>
                );
              })}
            </>
          )}
        </div>
      }
    </>
  );
};

export default React.memo(ThumbImg);
