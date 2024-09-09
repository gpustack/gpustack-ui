import { Col, Row } from 'antd';
import React from 'react';
import ModelItem from './model-item';

interface ActiveModelsProps {
  spans: {
    span: number;
    count: number;
  };
  modelSelections: Global.BaseOption<string>[];
  setModelRefs: (modelname: string, value: React.MutableRefObject<any>) => void;
}

const ActiveModels: React.FC<ActiveModelsProps> = (props) => {
  const { spans, modelSelections, setModelRefs } = props;
  return (
    <Row gutter={[16, 16]} style={{ height: '100%' }}>
      {modelSelections.map((model, index) => (
        <Col span={spans.span} key={model.value}>
          <ModelItem
            key={model.value}
            ref={(el: React.MutableRefObject<any>) =>
              setModelRefs(model.value, el)
            }
            modelList={modelSelections}
            model={model.value}
          />
        </Col>
      ))}
    </Row>
  );
};

export default React.memo(ActiveModels);
