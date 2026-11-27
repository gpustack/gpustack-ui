import { LoadingOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { AlertInfo, StatusDot } from '@gpustack/core-ui';
import { useIntl, useLocation } from '@umijs/max';
import { Button, Flex, Spin, Typography } from 'antd';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoJob } from '../apis';
import styles from './video.module.less';

export default function VideoResult({
  job,
  generating,
  loading,
  url,
  contentError,
  onRetryContent,
  onPlaybackError
}: {
  job?: VideoJob;
  generating: boolean;
  loading: boolean;
  url: string;
  contentError: { message?: string } | null;
  onRetryContent: () => void;
  onPlaybackError: (message: string) => void;
}) {
  const intl = useIntl();
  const { pathname } = useLocation();
  const player = useRef<HTMLVideoElement>(null);
  const [readyUrl, setReadyUrl] = useState('');
  const empty = !job && !loading;
  const pending = loading || generating;
  const showPlayer = Boolean(url && !loading && job?.status === 'completed');
  const progress =
    !loading &&
    typeof job?.progress === 'number' &&
    Number.isFinite(job.progress) &&
    job.progress > 0
      ? Math.round(Math.min(100, job.progress))
      : undefined;
  const label = job
    ? intl.formatMessage({ id: `playground.video.tasks.status.${job.status}` })
    : '';
  const error =
    typeof job?.error === 'string' ? job.error : job?.error?.message;
  const setPlayer = useCallback((element: HTMLVideoElement | null) => {
    if (!element && player.current && !player.current.paused) {
      player.current.pause();
    }
    player.current = element;
  }, []);
  useEffect(() => {
    const pause = () => {
      if (document.hidden || pathname !== '/playground/video')
        player.current?.pause();
    };
    pause();
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, [pathname]);

  if (!pending && (job?.status === 'queued' || job?.status === 'in_progress')) {
    return null;
  }

  return (
    <Flex
      vertical
      gap="middle"
      className={classNames(
        styles.result,
        (empty || pending || showPlayer) && styles.centeredResult
      )}
    >
      <Flex
        vertical
        align="center"
        justify="center"
        gap="middle"
        className={classNames(
          styles.media,
          pending && styles.pendingMedia,
          (empty || showPlayer) && styles.unframedMedia
        )}
        aria-live="polite"
      >
        {(pending || showPlayer) && (
          <video
            key={showPlayer ? url : 'pending'}
            ref={setPlayer}
            src={showPlayer ? url : undefined}
            className={showPlayer ? styles.player : styles.pendingPlayer}
            style={
              showPlayer && readyUrl !== url
                ? { visibility: 'hidden' }
                : undefined
            }
            controls
            playsInline
            preload="metadata"
            aria-hidden={!showPlayer}
            tabIndex={showPlayer ? undefined : -1}
            aria-label={
              showPlayer
                ? intl.formatMessage({ id: 'playground.video.tasks.preview' })
                : undefined
            }
            onLoadedMetadata={showPlayer ? () => setReadyUrl(url) : undefined}
            onError={
              showPlayer
                ? () =>
                    onPlaybackError(
                      intl.formatMessage({
                        id: 'playground.video.tasks.playbackError'
                      })
                    )
                : undefined
            }
          />
        )}
        {showPlayer ? null : loading ||
          (generating && job?.status === 'in_progress') ? (
          <Flex
            vertical
            align="center"
            gap="middle"
            className={styles.videoStatus}
          >
            <Spin
              size="middle"
              indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
            />
            <span>
              {progress !== undefined
                ? `${progress}%`
                : intl.formatMessage({
                    id: loading
                      ? 'playground.video.loading'
                      : 'playground.video.generating'
                  })}
            </span>
          </Flex>
        ) : job ? (
          <Flex
            vertical
            align="center"
            gap="middle"
            className={styles.videoStatus}
          >
            <StatusDot
              statusValue={{
                status:
                  job.status === 'failed'
                    ? 'error'
                    : generating
                      ? 'transitioning'
                      : 'inactive',
                text: label
              }}
            />
            {contentError && (
              <Button type="text" onClick={onRetryContent}>
                {intl.formatMessage({ id: 'common.button.retry' })}
              </Button>
            )}
          </Flex>
        ) : (
          <Flex vertical align="center" gap="large">
            <VideoCameraOutlined
              aria-hidden
              className="font-size-32 text-secondary"
            />
            <Typography.Text>
              {intl.formatMessage({ id: 'playground.video.empty.tips' })}
            </Typography.Text>
          </Flex>
        )}
      </Flex>
      {contentError?.message && (
        <AlertInfo type="danger" message={contentError.message} />
      )}
      {error && <AlertInfo type="danger" message={error} />}
      {job?.backend && (
        <Typography.Text className={styles.metadata} type="secondary">
          {job.backend}
        </Typography.Text>
      )}
    </Flex>
  );
}
