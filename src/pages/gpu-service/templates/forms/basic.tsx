import { Input as CInput, Textarea } from '@gpustack/core-ui';
import { Form } from 'antd';
import { FormData } from '../config/types';
import Env from './env';
import Ports from './ports';

interface BasicProps {
  page?: 'template' | 'instance';
}

const Basic: React.FC<BasicProps> = ({ page = 'template' }) => {
  const form = Form.useFormInstance<FormData>();

  const handleCommandChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const list = value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    form.setFieldValue('command', list);
  };

  const command = Form.useWatch('command', form);
  const commandText = Array.isArray(command) ? command.join('\n') : '';

  return (
    <>
      {page === 'template' && (
        <Form.Item<FormData>
          name="name"
          rules={[
            {
              required: true,
              message: '请输入模板名称'
            }
          ]}
        >
          <CInput.Input label="名称" required />
        </Form.Item>
      )}
      <Form.Item<FormData>
        name="image"
        rules={[
          {
            required: true,
            message: '请输入容器镜像'
          }
        ]}
      >
        <CInput.Input label="容器镜像" required />
      </Form.Item>
      <Form.Item>
        <Textarea
          label="容器启动命令"
          placeholder={'每行一个参数，例如：\n/bin/bash\n-c\nyour command'}
          trim={false}
          alwaysFocus
          scaleSize
          value={commandText}
          onChange={handleCommandChange}
        />
      </Form.Item>
      <Form.Item<FormData> name="volumeMount">
        <CInput.Input label="挂载路径" placeholder="例如：/workspace" />
      </Form.Item>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData> name={['resources', 'cpu']}>
            <CInput.Input label="CPU" placeholder="例如：4" />
          </Form.Item>
        </div>
        <div style={{ flex: 1 }}>
          <Form.Item<FormData> name={['resources', 'ram']}>
            <CInput.Input label="内存" placeholder="例如：8Gi" />
          </Form.Item>
        </div>
      </div>
      <Ports />
      <Env />
    </>
  );
};

export default Basic;
