import { Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { queryHuggingfaceModelDetail } from '../apis';
import '../style/model-card.less';
import TitleWrapper from './title-wrapper';

const ModelCard: React.FC<{ repo: string }> = (props) => {
  const { repo } = props;
  const [modelData, setModelData] = useState<any>({});

  const getModelCardData = async () => {
    if (!repo) {
      return;
    }
    try {
      const res = await queryHuggingfaceModelDetail({ repo });
      console.log('modelcarddata==========', res);
      setModelData(res);
    } catch (error) {
      setModelData({});
    }
  };

  useEffect(() => {
    getModelCardData();
  }, [repo]);

  return (
    <>
      <TitleWrapper>
        <span>Model Card</span>
      </TitleWrapper>
      <div className="wrapper">
        <div className="model-card-wrap">
          <div className="title">{modelData.id}</div>
          <Space>
            <Tag className="tag-item">
              <span className="m-r-5">Architecture:</span>
              {modelData.config?.model_type}
            </Tag>
          </Space>
        </div>
      </div>
    </>
  );
};

export default React.memo(ModelCard);
