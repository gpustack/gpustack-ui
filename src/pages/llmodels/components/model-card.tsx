import IconFont from '@/components/icon-font';
import { downloadFile } from '@huggingface/hub';
import { Button, Empty, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { queryHuggingfaceModelDetail } from '../apis';
import '../style/model-card.less';
import TitleWrapper from './title-wrapper';

const ModelCard: React.FC<{ repo: string }> = (props) => {
  const { repo } = props;
  const [modelData, setModelData] = useState<any>({});

  const loadFile = async (repo: string, sha: string) => {
    const res = await (
      await downloadFile({ repo, revision: sha, path: 'README.md' })
    )?.text();
    return res;
  };

  const getModelCardData = async () => {
    if (!repo) {
      setModelData(null);
      return;
    }
    try {
      const res = await queryHuggingfaceModelDetail({ repo });

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
        {modelData ? (
          <div className="model-card-wrap">
            <div className="title">{modelData.id}</div>
            <div className="flex-between flex-center">
              <Tag className="tag-item">
                <span className="m-r-5">Architecture:</span>
                {modelData.config?.model_type}
              </Tag>
              <Button
                type="link"
                target="_blank"
                href={`https://huggingface.co/${modelData.id}`}
              >
                View in Hugging Face
                <IconFont type="icon-external-link"></IconFont>
              </Button>
            </div>
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}></Empty>
        )}
      </div>
    </>
  );
};

export default React.memo(ModelCard);
