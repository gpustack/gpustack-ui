import { useIntl } from '@umijs/max';
import { Space, Tooltip } from 'antd';
import _ from 'lodash';
import '../style/reference-params.less';

interface ReferenceParamsProps {
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
    tokens_per_second: number;
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

      <span>
        {intl.formatMessage({ id: 'playground.tokenoutput' })}:{' '}
        {_.round(usage.tokens_per_second, 2)} Tokens/s
      </span>
    </div>
  );
};

export default ReferenceParams;
