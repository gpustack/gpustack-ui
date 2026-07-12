import {
  AutoTooltip,
  DropdownActions,
  IconFont,
  StatusTag,
  TemplateCard,
  ThemeTag
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button } from 'antd';
import _ from 'lodash';
import { formatMemoryDisplay } from '../../instances/config';
import { manufactureColorMap } from '../../templates/config';
import { ceilMilliToCore, parseQuantityToGi } from '../../utils';
import {
  InstanceTypePhaseLabelMap,
  status as phaseStatusMap,
  rowActionList
} from '../config';
import { ListItem } from '../config/types';
import styles from '../styles/instance-types.module.less';

interface InstanceTypeCardProps {
  data: ListItem;
  onDelete?: (record: ListItem) => void;
}

const InstanceTypeCard: React.FC<InstanceTypeCardProps> = ({
  data,
  onDelete
}) => {
  const intl = useIntl();
  const spec = data.spec || {};
  const unit = spec.unitResources || {};
  const phase = data.status?.phase || '';
  const manufacturer = spec.manufacturer || '';
  const manufacturerColor = manufactureColorMap[manufacturer] ?? 'purple';

  const memoryText = formatMemoryDisplay(spec.memory ?? undefined);

  // Base resources, formatted into a single "·"-separated line. Falsy parts
  // (e.g. a CPU-only type without VRAM) drop out rather than showing "-".
  const cpuCores = ceilMilliToCore(unit.cpu ?? null)?.cores;
  const ramGi = parseQuantityToGi(unit.ram ?? null)?.value;
  const storageGi = parseQuantityToGi(spec.localStorage ?? null)?.value;
  const osLabel = _.capitalize(spec.os || '');
  const archLabel = _.toUpper(spec.arch || '');
  const storageWord = intl.formatMessage({
    id: 'gpuservice.instanceType.localStorage'
  });
  const footerParts = [
    cpuCores != null ? `${cpuCores} vCPU` : null,
    ramGi != null ? `${ramGi} GiB RAM` : null,
    storageGi != null ? `${storageGi} GiB ${storageWord}` : null,
    osLabel ? `${osLabel}${archLabel ? ` (${archLabel})` : ''}` : null
  ].filter(Boolean) as string[];

  const handleAction = (item: any) => {
    if (item.key === 'delete') {
      onDelete?.(data);
    }
  };

  return (
    <TemplateCard
      className={styles.listCard}
      clickable={false}
      hoverable
      ghost
      header={
        <div className={styles.header}>
          <span className={styles.product}>
            <AutoTooltip ghost minWidth={20}>
              {spec.product || data.name || '-'}
            </AutoTooltip>
          </span>
          <span className={styles.headerRight}>
            <span onClick={(e) => e.stopPropagation()}>
              <DropdownActions
                menu={{ items: rowActionList, onClick: handleAction }}
              >
                <Button
                  icon={<IconFont type="icon-more" />}
                  size="small"
                  type="text"
                />
              </DropdownActions>
            </span>
          </span>
        </div>
      }
    >
      <div className={styles.card}>
        <div className={styles.hero}>
          <span className={styles.name}>
            <AutoTooltip ghost minWidth={20}>
              {data.name || '-'}
            </AutoTooltip>
          </span>
          <span className={styles.memory}>{memoryText || '—'}</span>
        </div>

        <div className={styles.subline}>
          {manufacturer && (
            <ThemeTag color={manufacturerColor} style={{ fontWeight: 400 }}>
              {manufacturer.toUpperCase()}
            </ThemeTag>
          )}
          {phase ? (
            <StatusTag
              statusValue={{
                status: phaseStatusMap[phase],
                text: InstanceTypePhaseLabelMap[phase] || phase,
                message: data.status?.phaseMessage || ''
              }}
            />
          ) : null}
          {spec.clockSpeed ? <span>{spec.clockSpeed}</span> : null}
          <span
            className={`${styles.tag} ${
              spec.sliceable ? styles.tagSliceable : styles.tagPlain
            }`}
          >
            {spec.sliceable
              ? intl.formatMessage({ id: 'gpuservice.instance.sliceable' })
              : intl.formatMessage({
                  id: 'gpuservice.instanceType.notSliceable'
                })}
          </span>
        </div>

        <div className={styles.divider} />

        <div className={styles.footer}>
          {footerParts.map((part, index) => (
            <span key={part}>
              {index > 0 && <span className={styles.dotSep}>·</span>}
              {part}
            </span>
          ))}
        </div>
      </div>
    </TemplateCard>
  );
};

export default InstanceTypeCard;
