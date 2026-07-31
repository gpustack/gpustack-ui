import { ReloadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Result } from 'antd';

interface ErrorResultProps {
  extra?: string;
}

/**
 * Matches webpack's chunk-load failures by message, which is all a React error boundary
 * gets. Both variants are needed: route chunks are JS, but Umi 4 emits a per-route CSS
 * chunk too, and `Loading CSS chunk … failed` is a different string.
 */
export function isChunkLoadError(msg?: string): boolean {
  if (typeof msg !== 'string') return false;
  const jsChunkFailed = msg.includes('Loading chunk');
  const cssChunkFailed = msg.includes('Loading CSS chunk');

  return (jsChunkFailed || cssChunkFailed) && msg.includes('failed');
}

const ErrorResult: React.FC<ErrorResultProps> = ({ extra }) => {
  const intl = useIntl();
  // Getting here with a chunk error means the one automatic attempt was already spent —
  // reloading just failed — so the retry becomes the user's to make.
  const staleAssets = isChunkLoadError(extra);

  const handleReload = () => {
    // Deliberately bypasses the one-attempt guard: that guard exists to stop automatic
    // loops, and a person pressing a button is not one. Goes through the recovery seam so
    // the reload is cache-busted; the snippet is production-only, so in development fall
    // back to a plain reload — there is no intermediary cache in front of `max dev` to bust.
    if (window.__assetRecovery__) {
      window.__assetRecovery__.reload();
    } else {
      window.location.reload();
    }
  };

  return (
    <Result
      status="warning"
      title={intl.formatMessage({
        id: staleAssets ? 'common.page.refresh.tips' : 'common.page.wentwrong'
      })}
      subTitle={staleAssets ? extra : undefined}
      style={{
        minHeight: 'calc(100vh - 300px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      extra={
        staleAssets ? (
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleReload}
          >
            {intl.formatMessage({ id: 'common.button.reload' })}
          </Button>
        ) : (
          extra
        )
      }
    />
  );
};

export default ErrorResult;
