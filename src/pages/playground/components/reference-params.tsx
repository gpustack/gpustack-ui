import { WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Space, Tooltip, Typography } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import '../style/reference-params.less';

interface ReferenceParamsProps {
  showOutput?: boolean;
  scaleable?: boolean;
  fields?: string[];
  usage: {
    error?: boolean;
    errorMessage?: string;
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
    tokens_per_second: number;
    time_per_output_token_ms: number;
    time_to_first_token_ms: number;
    // Only present when the serving engine reports prompt caching; absent
    // means "not measured", which is not a zero-percent hit rate.
    prompt_tokens_details?: {
      cached_tokens?: number;
      created_cache_tokens?: number;
    };
  };
}

const ReferenceParams = (props: ReferenceParamsProps) => {
  const intl = useIntl();
  const {
    usage,
    showOutput = true,
    scaleable,
    fields = ['completion_tokens', 'prompt_tokens']
  } = props;
  if (!usage || _.isEmpty(usage)) {
    return null;
  }
  if (usage.error) {
    return (
      <Typography.Paragraph
        type="danger"
        ellipsis={{
          rows: 2,
          tooltip: usage?.errorMessage
        }}
        style={{
          textAlign: 'center',
          paddingBlock: 0,
          margin: 0,
          paddingInline: 4,
          borderRadius: 2,
          backgroundColor: 'var(--ant-color-error-bg)'
        }}
      >
        <WarningOutlined className="m-r-8" />
        {usage?.errorMessage}
      </Typography.Paragraph>
    );
  }

  // The prefix cache only ever serves prompt tokens, so the prompt is the
  // denominator the hit rate is measured against.
  const cacheDetails = usage.prompt_tokens_details;
  const cachedTokens = cacheDetails?.cached_tokens || 0;
  const cacheHitRate = usage.prompt_tokens
    ? _.round((cachedTokens / usage.prompt_tokens) * 100, 1)
    : 0;

  return (
    <div
      className={classNames('reference-params', {
        scaleable: scaleable
      })}
    >
      <span
        className={classNames('usage', {
          scaleable: scaleable
        })}
      >
        <Tooltip
          title={
            <Space>
              {fields.includes('completion_tokens') && (
                <span>
                  {intl.formatMessage({ id: 'playground.completion' })}:{' '}
                  {usage.completion_tokens}
                </span>
              )}
              {fields.includes('prompt_tokens') && (
                <span>
                  {intl.formatMessage({ id: 'playground.prompt' })}:{' '}
                  {usage.prompt_tokens}
                </span>
              )}
            </Space>
          }
        >
          <span>
            {intl.formatMessage({ id: 'playground.tokenusage' })}:{' '}
            {usage.total_tokens}
          </span>
        </Tooltip>
      </span>

      {showOutput && (
        <span
          className={classNames('usage', {
            scaleable: scaleable
          })}
        >
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
      )}

      {cacheDetails && (
        <span
          className={classNames('usage', {
            scaleable: scaleable
          })}
        >
          <Tooltip
            title={
              <Space>
                <span>
                  {intl.formatMessage({ id: 'playground.cached' })}:{' '}
                  {cachedTokens}
                </span>
                <span>
                  {intl.formatMessage({ id: 'playground.cachewrite' })}:{' '}
                  {cacheDetails.created_cache_tokens || 0}
                </span>
              </Space>
            }
          >
            <span>
              {intl.formatMessage({ id: 'playground.cachehitrate' })}:{' '}
              {cacheHitRate}%
            </span>
          </Tooltip>
        </span>
      )}
    </div>
  );
};

export default ReferenceParams;
