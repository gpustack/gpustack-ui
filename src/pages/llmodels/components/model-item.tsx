import Card from '@/components/templates/card';
import React from 'react';

const ModelItem: React.FC<{ model: any; onDeploy: (model: any) => void }> = (
  props
) => {
  const { model, onDeploy } = props;

  return (
    <Card>
      <div className="model-item" onClick={() => onDeploy(model)}>
        <h3>{model.name}</h3>
        <p>{model.description}</p>
        <span>Deploy</span>
      </div>
    </Card>
  );
};

export default ModelItem;
