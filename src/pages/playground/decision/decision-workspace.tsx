import { KeyMap } from '@/config/hotkeys';
import { HolderOutlined, SendOutlined } from '@ant-design/icons';
import { IconFont, useOverlayScroller } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useSize } from 'ahooks';
import { Button, Flex, Splitter, Tooltip } from 'antd';
import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

const DEFAULT_ANSWER_HEIGHT = 260;
const MIN_ANSWER_HEIGHT = 120;
const COLLAPSED_ANSWER_HEIGHT = 40;

export interface DecisionWorkspaceHandle {
  showAnswers: () => void;
}

interface DecisionWorkspaceProps {
  children: React.ReactNode;
  answers: React.ReactNode;
  answerUsage?: React.ReactNode;
  answersEmpty: boolean;
  loading: boolean;
  runBlockReason: string | null;
  onRun: () => void;
  onStop: () => void;
}

// Own the split layout and its controls; the page owns editors and requests.
const DecisionWorkspace = forwardRef<
  DecisionWorkspaceHandle,
  DecisionWorkspaceProps
>(
  (
    {
      children,
      answers,
      answerUsage,
      answersEmpty,
      loading,
      runBlockReason,
      onRun,
      onStop
    },
    ref
  ) => {
    const intl = useIntl();
    const answerBodyId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const answerRef = useRef<HTMLDivElement>(null);
    const size = useSize(containerRef);
    const [panel, setPanel] = useState({
      collapsed: false,
      height: DEFAULT_ANSWER_HEIGHT
    });
    const { initialize: initializeInput } = useOverlayScroller();
    const { initialize: initializeAnswers, scrollToTop } = useOverlayScroller();

    useEffect(() => {
      initializeInput(inputRef.current);
      initializeAnswers(answerRef.current);
    }, [initializeInput, initializeAnswers]);

    const maxHeight = Math.max(MIN_ANSWER_HEIGHT, (size?.height || 600) * 0.75);
    const expandedHeight = Math.min(panel.height, maxHeight);
    const toggleAnswers = () =>
      setPanel((current) => ({ ...current, collapsed: !current.collapsed }));
    const resetHeight = () =>
      setPanel({ collapsed: false, height: DEFAULT_ANSWER_HEIGHT });

    useImperativeHandle(ref, () => ({
      showAnswers: () => {
        setPanel((current) => ({ ...current, collapsed: false }));
        scrollToTop?.();
      }
    }));

    const resizeWithKeyboard = (
      event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleAnswers();
      } else if (event.key === 'Home') {
        event.preventDefault();
        resetHeight();
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        const step = event.key === 'ArrowUp' ? 24 : -24;
        setPanel({
          collapsed: false,
          height: Math.max(
            MIN_ANSWER_HEIGHT,
            Math.min(maxHeight, expandedHeight + step)
          )
        });
      }
    };

    const collapseLabel = intl.formatMessage({
      id: panel.collapsed
        ? 'playground.decision.answers.expand'
        : 'playground.decision.answers.collapse'
    });

    return (
      <Flex vertical className="decision-workspace">
        <div ref={containerRef} className="decision-splitter-wrap">
          <Splitter
            orientation="vertical"
            className="decision-splitter"
            styles={{ panel: { overflow: 'hidden' } }}
            onResize={(sizes) => {
              const height = Math.max(MIN_ANSWER_HEIGHT, sizes[1]);
              setPanel((current) => {
                if (
                  (current.collapsed && sizes[1] <= COLLAPSED_ANSWER_HEIGHT) ||
                  (!current.collapsed && current.height === height)
                ) {
                  return current;
                }
                return { collapsed: false, height };
              });
            }}
            onDraggerDoubleClick={resetHeight}
            draggerIcon={
              <Tooltip
                title={intl.formatMessage({
                  id: 'playground.decision.answers.resize.tooltip'
                })}
              >
                <button
                  type="button"
                  className="decision-split-handle"
                  role="separator"
                  aria-orientation="horizontal"
                  aria-label={intl.formatMessage({
                    id: 'playground.decision.answers.resize'
                  })}
                  aria-valuemin={
                    panel.collapsed
                      ? COLLAPSED_ANSWER_HEIGHT
                      : MIN_ANSWER_HEIGHT
                  }
                  aria-valuemax={Math.round(maxHeight)}
                  aria-valuenow={
                    panel.collapsed
                      ? COLLAPSED_ANSWER_HEIGHT
                      : Math.round(expandedHeight)
                  }
                  onKeyDown={resizeWithKeyboard}
                >
                  <HolderOutlined rotate={90} />
                </button>
              </Tooltip>
            }
          >
            <Splitter.Panel min="25%">
              <div className="center" ref={inputRef}>
                {children}
              </div>
            </Splitter.Panel>
            <Splitter.Panel
              size={panel.collapsed ? COLLAPSED_ANSWER_HEIGHT : expandedHeight}
              min={
                panel.collapsed ? COLLAPSED_ANSWER_HEIGHT : MIN_ANSWER_HEIGHT
              }
              max="75%"
            >
              <Flex vertical className="answers-region">
                <Flex
                  align="center"
                  justify="space-between"
                  className="answers-header"
                >
                  <h3 className="m-b-0 font-size-14 line-24 font-500">
                    {intl.formatMessage({ id: 'playground.decision.answers' })}
                  </h3>
                  <div className="decision-token-strip">{answerUsage}</div>
                  <Button
                    type="text"
                    size="small"
                    icon={
                      <IconFont
                        type="icon-down"
                        rotate={panel.collapsed ? 180 : 0}
                      />
                    }
                    aria-label={collapseLabel}
                    aria-expanded={!panel.collapsed}
                    aria-controls={answerBodyId}
                    title={collapseLabel}
                    onClick={toggleAnswers}
                  />
                </Flex>
                <div
                  className="answers-scroll"
                  ref={answerRef}
                  id={answerBodyId}
                  hidden={panel.collapsed}
                >
                  {/* A stable child keeps React updates inside the DOM moved by OverlayScrollbars. */}
                  <div
                    className={`answers-content${answersEmpty ? ' is-empty' : ''}`}
                  >
                    {answers}
                  </div>
                </div>
              </Flex>
            </Splitter.Panel>
          </Splitter>
        </div>
        <Flex
          align="center"
          justify="space-between"
          gap="small"
          wrap
          className="decision-run-bar"
        >
          <Flex align="center" gap="small" className="decision-run-description">
            <IconFont
              type="icon-assistant-filled"
              className="font-size-16"
              aria-hidden
            />
            <span>
              {intl.formatMessage({ id: 'playground.decision.run.scope' })}
            </span>
          </Flex>
          <Tooltip
            title={
              loading
                ? intl.formatMessage({ id: 'common.button.stop' })
                : runBlockReason || KeyMap.RUN.textKeybinding
            }
          >
            <span>
              <Button
                type="primary"
                size="middle"
                className="decision-run-button"
                disabled={!loading && !!runBlockReason}
                onClick={loading ? onStop : onRun}
                aria-label={
                  loading
                    ? intl.formatMessage({ id: 'common.button.stop' })
                    : runBlockReason ||
                      intl.formatMessage({ id: 'playground.decision.run' })
                }
                icon={
                  loading ? <IconFont type="icon-stop1" /> : <SendOutlined />
                }
              >
                {intl.formatMessage({
                  id: loading ? 'common.button.stop' : 'playground.decision.run'
                })}
              </Button>
            </span>
          </Tooltip>
        </Flex>
      </Flex>
    );
  }
);

export default DecisionWorkspace;
