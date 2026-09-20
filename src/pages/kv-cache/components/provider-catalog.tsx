import { getGpuColor } from '@/pages/backends/config';
import { localize } from '@/utils/localize';
import { AutoTooltip, IconFont, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Typography } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  CPU_BACKEND,
  ProviderSourceColorMap,
  ProviderSourceLabelMap,
  backendFamily
} from '../config';
import { CacheProviderItem } from '../config/types';
import '../style/provider-catalog.less';

// four-pointed sparkle: the certification cue; a five-pointed star reads
// as favorite/rating
const SparkleIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="currentColor"
    aria-hidden="true"
    style={{ verticalAlign: '-0.125em', ...style }}
  >
    {/* straight-edged twinkle (tips + inner vertices): slim enough to
        read as a star at tag size */}
    <path d="M12 0L15 9L24 12L15 15L12 24L9 15L0 12L9 9Z" />
  </svg>
);

interface ProviderCatalogProps {
  providers: CacheProviderItem[];
  // name of the provider the flow already holds, highlighted like the
  // cluster catalog's current selection
  current?: string;
  onSelect: (provider: CacheProviderItem) => void;
}

// Memoized: one card's hover changes the catalog's state, and without this
// every other card re-runs the measuring its content does — AutoTooltip's
// ResizeObserver and the description's ellipsis pass — for a frame that
// changed nothing about them.
const ProviderCard: React.FC<{
  data: CacheProviderItem;
  active: boolean;
  onClick: (data: CacheProviderItem) => void;
  // where the pointer is while it rides an unavailable card, in client
  // coordinates; null when it leaves
  onReason: (reason: string | null, event?: React.MouseEvent) => void;
}> = ({ data, active, onClick, onReason }) => {
  const intl = useIntl();

  // accelerator families the provider declares dedicated builds for
  // (runtime_images doubles as the support matrix). A provider that
  // publishes no image declares no matrix, so the claim falls back to
  // the accelerators its engine integrations are scoped to — the gate
  // that decides whether an engine can attach at all; a provider
  // declaring neither shows nothing.
  const frameworks = useMemo(() => {
    const names = new Set<string>();
    Object.values(data.versions || {}).forEach((versionConfig) => {
      Object.keys(versionConfig.runtime_images || {}).forEach((name) => {
        // The matrix carries more than accelerator families: the image a
        // node with no accelerator runs, and one key per SoC generation
        // where a family builds them apart. The claim is about families.
        if (backendFamily(name) !== CPU_BACKEND) {
          names.add(backendFamily(name));
        }
      });
    });
    if (!names.size) {
      (data.inference_backend_integrations || []).forEach((integration) =>
        (integration.frameworks || []).forEach((name) => names.add(name))
      );
    }
    return Array.from(names);
  }, [data]);

  // A provider this installation cannot run keeps its card: the choice
  // stays visible and reads like any other, but nothing selects it and
  // the reason rides the pointer, which is where the eye already is.
  // The catalog draws it, not the card: a card clips its own overflow,
  // and a label pinned inside one would stall against its edges instead
  // of trailing the pointer. It is the only floating text over an
  // unavailable card, so the description's tooltip steps aside there.
  const unavailable = localize(data.unavailable_reason);

  return (
    <div
      className={classNames('provider-card', { active, unavailable })}
      onClick={() => !unavailable && onClick(data)}
      onMouseMove={(e) => unavailable && onReason(unavailable, e)}
      onMouseLeave={() => unavailable && onReason(null)}
      // the pointer-following label is decoration; the reason has to
      // reach a reader who never moves a pointer, and the card has to
      // announce that it takes no selection
      aria-disabled={unavailable ? true : undefined}
      aria-label={
        unavailable
          ? `${localize(data.display_name) || data.name} — ${unavailable}`
          : undefined
      }
    >
      <div className="title">
        <span className="img">
          {data.icon ? (
            <img src={data.icon} alt="" />
          ) : (
            <IconFont type="icon-storage-outlined" className="fallback-icon" />
          )}
        </span>
        <AutoTooltip ghost>
          {localize(data.display_name) || data.name}
        </AutoTooltip>
        {ProviderSourceLabelMap[data.source] && (
          <ThemeTag
            className="tag-item"
            color={ProviderSourceColorMap[data.source] || 'blue'}
            opacity={0.7}
          >
            {data.source === 'partner' && (
              <SparkleIcon style={{ marginRight: 4, fontSize: 12 }} />
            )}
            {intl.formatMessage({ id: ProviderSourceLabelMap[data.source] })}
          </ThemeTag>
        )}
      </div>
      <Typography.Paragraph
        className="desc"
        ellipsis={{
          rows: 2,
          tooltip: unavailable ? (
            false
          ) : (
            <div
              className="custome-scrollbar"
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                maxHeight: 300,
                maxWidth: 300,
                overflow: 'auto'
              }}
            >
              {localize(data.description)}
            </div>
          )
        }}
      >
        {localize(data.description)}
      </Typography.Paragraph>
      <div className="item-footer">
        <span className="frameworks">
          {frameworks.length > 0 && (
            <>
              <span className="label">
                {intl.formatMessage({ id: 'backend.availableFrameworks' })}:
              </span>
              {frameworks.map((framework) => (
                <ThemeTag
                  key={framework}
                  className="tag-item"
                  color={getGpuColor(framework)}
                  opacity={0.7}
                >
                  {framework}
                </ThemeTag>
              ))}
            </>
          )}
        </span>
        <span className="links">
          {data.links?.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {localize(link.label)}
              <IconFont type="icon-external-link"></IconFont>
            </a>
          ))}
        </span>
      </div>
    </div>
  );
};

const MemoProviderCard = React.memo(ProviderCard);

const ProviderCatalog: React.FC<ProviderCatalogProps> = ({
  providers,
  current,
  onSelect
}) => {
  const catalogRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const [reason, setReason] = useState('');
  // The pointer position the next frame will draw at, and the frame it is
  // waiting on. A pointer crossing a card fires far more often than the screen
  // refreshes, and the placement reads the catalog's box — one read per frame
  // instead of one per event.
  const pending = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef<number | null>(null);

  const place = useCallback(() => {
    frame.current = null;
    const label = hintRef.current;
    const point = pending.current;
    if (!label || !point) {
      return;
    }
    const catalog = catalogRef.current?.getBoundingClientRect();
    // trailing the pointer to its lower right rather than being held inside
    // the card, which would stall the label against the card's edges while
    // the pointer kept moving — but kept off the catalog's right edge, or a
    // long reason runs out of the drawer it is read in
    const x = point.x - (catalog?.left ?? 0) + 14;
    const y = point.y - (catalog?.top ?? 0) + 16;
    const limit = (catalog?.width ?? 0) - label.offsetWidth;
    label.style.transform = `translate(${Math.max(0, Math.min(x, limit))}px, ${y}px)`;
    label.style.opacity = '1';
  }, []);

  const trackReason = useCallback(
    (text: string | null, event?: React.MouseEvent) => {
      if (!text || !event) {
        pending.current = null;
        // fading out leaves the position alone, or the label would drop to
        // the catalog's origin for the length of the fade
        if (hintRef.current) {
          hintRef.current.style.opacity = '0';
        }
        return;
      }
      setReason((current) => (current === text ? current : text));
      pending.current = { x: event.clientX, y: event.clientY };
      if (frame.current === null) {
        frame.current = requestAnimationFrame(place);
      }
    },
    [place]
  );

  useEffect(
    () => () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
      }
    },
    []
  );

  return (
    <div className="provider-catalog" ref={catalogRef}>
      {providers.map((item) => (
        <MemoProviderCard
          key={item.name}
          data={item}
          active={item.name === current}
          onClick={onSelect}
          onReason={trackReason}
        ></MemoProviderCard>
      ))}
      {/* Always mounted: created with the first reason, its ref would still
          be null when that same move tries to place it, and the label would
          wait for a second one. */}
      <span ref={hintRef} className="unavailable-hint" aria-hidden="true">
        {reason}
      </span>
    </div>
  );
};

export default ProviderCatalog;
