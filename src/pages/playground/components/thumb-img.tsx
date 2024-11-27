import AutoImage from '@/components/auto-image';
import { CloseCircleOutlined } from '@ant-design/icons';
import { Col, Progress, Row } from 'antd';
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
}> = ({
  dataList,
  editable,
  responseable,
  gutter,
  onDelete,
  loading,
  autoSize,
  style
}) => {
  const handleOnDelete = useCallback(
    (uid: number) => {
      onDelete?.(uid);
    },
    [onDelete]
  );

  if (_.isEmpty(dataList)) {
    return null;
  }

  const renderImageItem = (item: any) => {
    const thumImgWrapStyle = item.loading
      ? { width: item.width, height: item.height }
      : {};
    return (
      <span key={item.uid} className="thumb-img" style={thumImgWrapStyle}>
        <>
          {item.loading ? (
            <span
              className="progress-wrap"
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                border: '1px solid var(--ant-color-split)',
                borderRadius: 'var(--border-radius-base)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px',
                overflow: 'hidden'
              }}
            >
              <Progress percent={item.progress} type="circle" />
            </span>
          ) : (
            <span
              className="img"
              style={{
                maxHeight: `min(${item.maxHeight}, 100%)`,
                maxWidth: `min(${item.maxWidth}, 100%)`
              }}
            >
              <AutoImage
                autoSize={autoSize}
                src={item.dataUrl}
                width={item.width || 100}
                height={item.height || 100}
              />
            </span>
          )}
        </>

        {editable && (
          <span className="del" onClick={() => handleOnDelete(item.uid)}>
            <CloseCircleOutlined />
          </span>
        )}
      </span>
    );
  };

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
                      {renderImageItem(item)}
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
                        {renderImageItem(item)}
                      </Col>
                    );
                  })}
                </Row>
              )}
            </>
          ) : (
            <>
              {_.map(dataList, (item: any) => {
                return renderImageItem(item);
              })}
            </>
          )}
        </div>
      }
    </>
  );
};

export default React.memo(ThumbImg);
