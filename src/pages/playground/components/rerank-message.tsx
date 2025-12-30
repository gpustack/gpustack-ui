import { Progress, Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import '../style/content-item.less';
import '../style/rerank-message.less';

interface RerankMessageProps {
  header?: React.ReactNode;
  dataList: {
    title?: React.ReactNode;
    content: string | any[];
    uid: number | string;
  }[];
}

const RerankMessage: React.FC<RerankMessageProps> = ({ header, dataList }) => {
  if (!dataList || dataList.length === 0) {
    return null;
  }
  return (
    <div className="rerank-message">
      {header}
      {dataList.map((item) => {
        return (
          <div className="content-item" key={item.uid}>
            <div className="content-item-content">
              {Array.isArray(item.content) ? (
                <div className="result">
                  {item.content.map((sItem, sIndex) => {
                    return (
                      <dl className="content-item-text" key={sItem.uid}>
                        <dt className="rank">
                          <span className="doc-index">
                            {sItem.docIndex + 1}
                          </span>
                        </dt>
                        <Tooltip
                          title={<span>Score: {_.round(sItem.score, 2)}</span>}
                        >
                          <dd className="text">{sItem.text}</dd>
                        </Tooltip>
                        <Progress
                          format={() => (
                            <span
                              style={{
                                paddingRight: 4,
                                color: 'var(--ant-color-text-tertiary)'
                              }}
                            >
                              {_.round(sItem.score, 2)}
                            </span>
                          )}
                          size={{
                            height: 4
                          }}
                          type="line"
                          status="normal"
                          percentPosition={{ align: 'end', type: 'outer' }}
                          strokeColor={`linear-gradient(90deg, #388bff 0%, #fff ${sItem.normalizValue}%)`}
                          railColor="transparent"
                          percent={sItem.normalizValue}
                          style={{
                            position: 'absolute',
                            left: 0,
                            bottom: -4,
                            lineHeight: '12px'
                          }}
                        ></Progress>
                      </dl>
                    );
                  })}
                </div>
              ) : (
                <div className="content-item-text">{item.content}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RerankMessage;
