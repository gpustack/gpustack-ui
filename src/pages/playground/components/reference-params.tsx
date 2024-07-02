import { useIntl } from '@umijs/max';
import { Space, Tooltip } from 'antd';
import '../style/reference-params.less';

interface ReferenceParamsProps {
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
    time_per_output_token_ms: number;
  };
}

const ReferenceParams = (props: ReferenceParamsProps) => {
  const intl = useIntl();
  const { usage } = props;
  if (!usage) {
    return null;
  }
  return (
    <div className="reference-params">
      <Tooltip
        title={
          <Space>
            <span>
              {intl.formatMessage({ id: 'playground.completion' })}:{' '}
              {usage.completion_tokens}
            </span>
            <span>
              {intl.formatMessage({ id: 'playground.prompt' })}:{' '}
              {usage.prompt_tokens}
            </span>
          </Space>
        }
      >
        <span>
          {intl.formatMessage({ id: 'playground.tokenusage' })}:{' '}
          {usage.total_tokens}
        </span>
      </Tooltip>

      <span>
        {intl.formatMessage({ id: 'playground.tokenoutput' })}:{' '}
        {usage.time_per_output_token_ms} token/s
      </span>
    </div>
  );
};

export default ReferenceParams;
