import AutoImage from '@/components/auto-image';
import { CloseCircleOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import _ from 'lodash';
import React, { useCallback } from 'react';
import '../style/thumb-img.less';

const ThumbImg: React.FC<{
  dataList: any[];
  editable?: boolean;
  onDelete?: (uid: number) => void;
  loading?: boolean;
  style?: React.CSSProperties;
}> = ({ dataList, editable, onDelete, loading, style }) => {
  const handleOnDelete = useCallback(
    (uid: number) => {
      onDelete?.(uid);
    },
    [onDelete]
  );

  if (_.isEmpty(dataList)) {
    return null;
  }

  return (
    <>
      {
        <div className="thumb-list-wrap" style={{ ...style }}>
          {_.map(dataList, (item: any) => {
            return (
              <span
                key={item.uid}
                className="thumb-img"
                style={{
                  width: item.width || 100,
                  height: item.height || 100
                }}
              >
                <span className="img">
                  {loading ? (
                    <span
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        border: '1px solid var(--ant-color-split)',
                        borderRadius: 'var(--border-radius-base)'
                      }}
                    >
                      <Spin
                        className="flex-center justify-center"
                        style={{ width: '100%', height: '100%' }}
                      ></Spin>
                    </span>
                  ) : (
                    <AutoImage src={item.dataUrl} height={item.height || 100} />
                  )}
                </span>

                {editable && (
                  <span
                    className="del"
                    onClick={() => handleOnDelete(item.uid)}
                  >
                    <CloseCircleOutlined />
                  </span>
                )}
              </span>
            );
          })}
        </div>
      }
    </>
  );
};

export default React.memo(ThumbImg);
