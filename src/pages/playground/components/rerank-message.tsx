import { StarFilled } from '@ant-design/icons';
import { Tooltip } from 'antd';
import _ from 'lodash';
import React from 'react';
import '../style/content-item.less';
import '../style/rerank-message.less';

interface RerankMessageProps {
  dataList: { title?: string; content: any; uid: number | string }[];
}
const RerankMessage: React.FC<RerankMessageProps> = ({ dataList }) => {
  return (
    <div className="rerank-message">
      {dataList.map((item) => {
        return (
          <div className="content-item" key={item.uid}>
            <div className="content-item-role">
              <span className="role">{item.title}</span>
            </div>
            <div className="content-item-content">
              {Array.isArray(item.content) ? (
                <div className="result">
                  {item.content.map((sItem, sIndex) => {
                    return (
                      <dl className="content-item-text" key={sItem.uid}>
                        <dt className="rank">
                          <span>[{sItem.docIndex + 1}]</span>
                          <span className="score">
                            <Tooltip
                              title={
                                <span>Score: {_.round(sItem.score, 2)}</span>
                              }
                            >
                              <StarFilled className="m-r-5" />
                              {_.round(sItem.score, 2)}
                            </Tooltip>
                          </span>
                        </dt>
                        <dd className="text">{sItem.text}</dd>
                        <dd className="doc-name">《{sItem.title}》</dd>
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
