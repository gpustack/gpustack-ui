import { Form } from 'antd';
import { useState } from 'react';

const ParamsSettings: React.FC = () => {
  const [params, setParams] = useState({
    name: 'jack',
    age: 18,
  });

  return <Form></Form>;
};

export default ParamsSettings;
