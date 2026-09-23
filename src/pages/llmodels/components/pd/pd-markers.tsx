import { ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Flex, Tooltip } from 'antd';
import React from 'react';
import { DegradationLabelMap } from '../../config';

type IntlShape = ReturnType<typeof useIntl>;

interface PDMarkersProps {
  // `Model.stale`: the members predate the config they are shown with.
  stale?: boolean | null;
  // `DegradationValueMap` values; a list because they coexist.
  degradations?: string[] | null;
  fontSize?: number;
}

/**
 * The reason text behind one degradation marker.
 *
 * A reason the UI has no wording for still renders — as its raw value. Showing
 * a marker with a name nobody has translated yet is bad; dropping the marker
 * is worse, because "degraded and nobody said so" is the exact failure this
 * view exists to surface.
 */
export const degradationReason = (intl: IntlShape, reason: string) => {
  const id = DegradationLabelMap[reason];
  if (!id) {
    return reason;
  }
  return intl.formatMessage({ id });
};

/**
 * Every marker's text, flattened, for a caller that owns its own tooltip.
 *
 * The replica cell needs this: it already wraps the whole cell in a role
 * breakdown tooltip, so a marker rendering a second tooltip inside the first
 * put two icons and two hover surfaces on one number. It takes the texts and
 * shows one icon.
 */
export const markerTexts = (
  intl: IntlShape,
  stale?: boolean | null,
  degradations?: string[] | null
): string[] => {
  const texts = (degradations || []).map((reason) =>
    degradationReason(intl, reason)
  );
  if (stale) {
    texts.push(intl.formatMessage({ id: 'models.pd.stale' }));
  }
  return texts;
};

/**
 * The marker texts on a tooltip surface, one per line.
 *
 * Renders nothing for an empty list so a caller can drop it into a tooltip it
 * builds unconditionally.
 */
export const MarkerReasons: React.FC<{ texts: string[] }> = ({ texts }) => {
  if (!texts.length) {
    return null;
  }
  return (
    <Flex vertical gap={4} style={{ color: 'var(--ant-color-warning)' }}>
      {texts.map((text) => (
        <span key={text}>{text}</span>
      ))}
    </Flex>
  );
};

/**
 * One marker: the glyph, and the reason behind it.
 *
 * The glyph is the only thing on the row carrying this information, so it has
 * to be reachable without a pointer — hence a focusable wrapper, the tooltip
 * opening on focus as well as hover, and `label` repeated as the accessible
 * name so a reader that never opens the tooltip still gets the reason. The
 * icon itself is decorative once that name exists.
 */
const Marker: React.FC<{
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  fontSize: number;
  label: string;
  title: React.ReactNode;
}> = ({ icon: Icon, fontSize, label, title }) => (
  <Tooltip title={title} trigger={['hover', 'focus']}>
    <span
      tabIndex={0}
      role="img"
      aria-label={label}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <Icon
        aria-hidden
        style={{ color: 'var(--ant-color-warning)', fontSize }}
      />
    </span>
  </Tooltip>
);

/**
 * `stale` and `degradations` as badges beside a status, never instead of one.
 *
 * Both are orthogonal to `Model.state` by construction: a stale group is
 * usually still serving, and a degraded one is serving worse than it was asked
 * for. So these coexist with the state colour and every one of them carries
 * its reason — a marker without a reason is just another silent failure.
 *
 * One icon per *kind*, not per reason: three degradations used to render three
 * identical glyphs in a row, which reads as three problems of three sorts.
 * Stale keeps its own icon because it means something else — not serving
 * worse, serving something older.
 */
const PDMarkers: React.FC<PDMarkersProps> = ({
  stale,
  degradations,
  fontSize = 13
}) => {
  const intl = useIntl();
  const reasons = degradations || [];

  if (!stale && !reasons.length) {
    return null;
  }

  const staleText = intl.formatMessage({ id: 'models.pd.stale' });
  const reasonTexts = reasons.map((reason) => degradationReason(intl, reason));

  return (
    <Flex align="center" gap={4}>
      {!!reasons.length && (
        <Marker
          icon={WarningOutlined}
          fontSize={fontSize}
          label={reasonTexts.join('; ')}
          title={
            <Flex vertical gap={4}>
              {reasonTexts.map((text) => (
                <span key={text}>{text}</span>
              ))}
            </Flex>
          }
        ></Marker>
      )}
      {!!stale && (
        <Marker
          icon={ClockCircleOutlined}
          fontSize={fontSize}
          label={staleText}
          title={staleText}
        ></Marker>
      )}
    </Flex>
  );
};

export default PDMarkers;
