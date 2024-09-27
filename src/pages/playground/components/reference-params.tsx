import { WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Alert, Space, Tooltip } from 'antd';
import _ from 'lodash';
import '../style/reference-params.less';

interface ReferenceParamsProps {
  usage: {
    error?: boolean;
    errorMessage?: string;
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
    tokens_per_second: number;
    time_per_output_token_ms: number;
    time_to_first_token_ms: number;
  };
}

const ReferenceParams = (props: ReferenceParamsProps) => {
  const intl = useIntl();
  const { usage } = props;
  if (!usage || _.isEmpty(usage)) {
    return null;
  }
  if (usage.error) {
    return (
      <Alert
        type="error"
        style={{ textAlign: 'center', paddingBlock: 0 }}
        message={
          <span style={{ color: 'var(--ant-color-error)' }}>
            <WarningOutlined className="m-r-8" />
            {usage?.errorMessage}
          </span>
        }
        banner
        showIcon={false}
      />
    );
  }
  return (
    <div className="reference-params">
      <span className="usage">
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
      </span>

      <span className="usage">
        <Tooltip
          title={
            <Space>
              <span>
                TPOT: {_.round(usage.time_per_output_token_ms, 2) || 0} ms
              </span>
              <span>
                TTFT: {_.round(usage.time_to_first_token_ms, 2) || 0} ms
              </span>
            </Space>
          }
        >
          <span>
            {intl.formatMessage({ id: 'playground.tokenoutput' })}:{' '}
            {_.round(usage.tokens_per_second, 2) || 0} Tokens/s
          </span>
        </Tooltip>
      </span>
    </div>
  );
};

export default ReferenceParams;
