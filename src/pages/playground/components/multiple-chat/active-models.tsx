import { Col, Row } from 'antd';
import React from 'react';
import { ModelSelectionItem } from '../../config/types';
import ModelItem from './model-item';

interface ActiveModelsProps {
  spans: {
    span: number;
    count: number;
  };
  modelSelections: ModelSelectionItem[];
  setModelRefs: (modelname: symbol, value: React.MutableRefObject<any>) => void;
}

const ActiveModels: React.FC<ActiveModelsProps> = (props) => {
  const { spans, modelSelections, setModelRefs } = props;
  return (
    <Row gutter={[16, 16]} style={{ height: '100%' }}>
      {modelSelections.map((model, index) => (
        <Col span={spans.span} key={`${model.value || 'empty'}-${model.uid}`}>
          <ModelItem
            key={`${model.value || 'empty'}-${model.uid}`}
            ref={(el: React.MutableRefObject<any>) =>
              setModelRefs(model.instanceId, el)
            }
            instanceId={model.instanceId}
            modelList={modelSelections}
            model={model.value}
          />
        </Col>
      ))}
    </Row>
  );
};

export default React.memo(ActiveModels);
