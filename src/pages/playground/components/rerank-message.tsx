import { Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import '../style/content-item.less';
import '../style/rerank-message.less';

interface RerankMessageProps {
  header?: React.ReactNode;
  dataList: { title?: string; content: any; uid: number | string }[];
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
            {/* <div className="content-item-role">
              <span className="role">{item.title}</span>
            </div> */}
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

export default React.memo(RerankMessage);
