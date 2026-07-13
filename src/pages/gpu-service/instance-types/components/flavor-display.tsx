import { AutoTooltip, ThemeTag } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import { formatMemoryDisplay } from '../../instances/config';
import { manufactureColorMap } from '../../templates/config';
import { formatManufacturer } from '../../utils';

// The subset of a flavor / instance-type spec the flavor display reads. Both
// FlavorItem.spec and InstanceTypeSpec structurally satisfy it, so the create
// drawer's dropdown and the management list share the same renderers.
interface FlavorSpecLike {
  manufacturer?: string | null;
  product?: string | null;
  memory?: string | null;
  sliceable?: boolean;
  acceleratable?: boolean;
}

// A flavor's title mirrors the flavor card: a generic (no product, no/`generic`
// manufacturer, non-acceleratable) flavor reads as "CPU-only".
export const getFlavorTitle = (
  spec: FlavorSpecLike = {},
  fallbackName?: string | null
) => {
  const manufacturer = spec.manufacturer || '';
  const isCpuOnly =
    !spec.acceleratable &&
    !spec.product &&
    (!manufacturer || manufacturer.toLowerCase() === 'generic');
  return isCpuOnly ? 'CPU-only' : spec.product || fallbackName || '-';
};

// Secondary line, dot-separated: manufacturer · memory · sliceable. memory and
// sliceable apply to accelerator (GPU) flavors only; sliceable stays a tag.
// Returns null when a (generic) flavor has nothing to show.
export const FlavorMeta: React.FC<{ spec?: FlavorSpecLike }> = ({
  spec = {}
}) => {
  const intl = useIntl();
  const manufacturer = spec.manufacturer || '';
  const color = manufactureColorMap[manufacturer] ?? 'purple';
  const memory = spec.acceleratable
    ? formatMemoryDisplay(spec.memory ?? undefined)
    : '';

  const pieces: React.ReactNode[] = [];
  if (manufacturer) {
    pieces.push(
      <ThemeTag
        key="vendor"
        color={color}
        style={{ fontWeight: 400, marginInlineEnd: 0 }}
      >
        {formatManufacturer(manufacturer)}
      </ThemeTag>
    );
  }
  if (memory) {
    pieces.push(<span key="memory">{memory}</span>);
  }
  if (spec.acceleratable && spec.sliceable) {
    pieces.push(
      <ThemeTag
        key="sliceable"
        color="geekblue"
        style={{ fontWeight: 400, marginInlineEnd: 0 }}
      >
        {intl.formatMessage({ id: 'gpuservice.instance.sliceable' })}
      </ThemeTag>
    );
  }
  if (!pieces.length) return null;

  return (
    <Flex
      align="center"
      gap={8}
      style={{
        minWidth: 0,
        color: 'var(--ant-color-text-tertiary)',
        fontSize: 12
      }}
    >
      {pieces.flatMap((piece, index) =>
        index === 0
          ? [piece]
          : [
              <span
                key={`dot-${index}`}
                style={{ color: 'var(--ant-color-text-quaternary)' }}
              >
                ·
              </span>,
              piece
            ]
      )}
    </Flex>
  );
};

// Two-line flavor display: title on top, meta row below. Shared by the create
// drawer's dropdown option and the management list's flavor cell.
export const FlavorOption: React.FC<{
  spec?: FlavorSpecLike;
  fallbackName?: string | null;
  maxWidth?: number | string;
}> = ({ spec = {}, fallbackName, maxWidth = '100%' }) => (
  <Flex vertical gap={4} style={{ minWidth: 0, padding: '2px 0' }}>
    <AutoTooltip ghost minWidth={20} maxWidth={maxWidth}>
      {getFlavorTitle(spec, fallbackName)}
    </AutoTooltip>
    <FlavorMeta spec={spec} />
  </Flex>
);

// Single-line flavor display: title then meta inline. Used for the collapsed
// selected value in the create drawer's Select.
export const FlavorSelected: React.FC<{
  spec?: FlavorSpecLike;
  fallbackName?: string | null;
}> = ({ spec = {}, fallbackName }) => (
  <Flex align="center" gap={8} style={{ minWidth: 0 }}>
    <AutoTooltip ghost minWidth={20} maxWidth={200}>
      {getFlavorTitle(spec, fallbackName)}
    </AutoTooltip>
    <FlavorMeta spec={spec} />
  </Flex>
);
