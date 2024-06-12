import { Space, Tooltip } from 'antd';
import '../style/reference-params.less';

interface ReferenceParamsProps {
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

const ReferenceParams = (props: ReferenceParamsProps) => {
  const { usage } = props;
  if (!usage) {
    return null;
  }
  return (
    <div className="reference-params">
      <Tooltip
        title={
          <Space>
            <span>Completion: {usage.completion_tokens}</span>
            <span>Prompt: {usage.prompt_tokens}</span>
          </Space>
        }
      >
        <span>Token Usage: {usage.total_tokens}</span>
      </Tooltip>
    </div>
  );
};

export default ReferenceParams;
