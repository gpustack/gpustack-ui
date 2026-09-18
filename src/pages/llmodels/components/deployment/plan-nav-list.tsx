import { IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useRef } from 'react';
import { entryCaption, entryColor, entryName } from '../../config/import-plan';
import { DeploymentPlanEntry } from '../../config/types';
import styles from '../../style/import-yaml-drawer.module.less';

// What the diff is showing: one deployment by its position in the document,
// or the document itself. Making the range a place in this list rather than a
// mode beside it leaves one thing to point at instead of two to reconcile.
export type PlanSelection = number | 'whole';

interface PlanNavListProps {
  entries: DeploymentPlanEntry[];
  selected: PlanSelection;
  collapsed?: boolean;
  onSelect: (selection: PlanSelection) => void;
}

const PlanNavList: React.FC<PlanNavListProps> = ({
  entries,
  selected,
  collapsed,
  onSelect
}) => {
  const intl = useIntl();

  // The listbox is one sequence -- the whole document, then each deployment --
  // so Arrow/Home/End walk it and Enter/Space commit, the way a listbox is
  // expected to behave. Focus rides the selection (roving tabindex), so only
  // the selected option is a tab stop.
  const optionRefs = useRef(new Map<PlanSelection, HTMLDivElement | null>());
  const order: PlanSelection[] = [
    'whole',
    ...entries.map((entry) => entry.index)
  ];

  const moveTo = (next: PlanSelection) => {
    onSelect(next);
    optionRefs.current.get(next)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const at = order.indexOf(selected);
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveTo(order[Math.min(order.length - 1, (at < 0 ? -1 : at) + 1)]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveTo(order[Math.max(0, (at < 0 ? order.length : at) - 1)]);
        break;
      case 'Home':
        event.preventDefault();
        moveTo(order[0]);
        break;
      case 'End':
        event.preventDefault();
        moveTo(order[order.length - 1]);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(selected);
        break;
      default:
        break;
    }
  };

  const allLabel = intl.formatMessage(
    { id: 'models.import.scope.all' },
    { count: entries.length }
  );

  const renderAll = () => {
    const item = (
      <div
        className={classNames(styles.navOption, styles.navAll, {
          [styles.selected]: selected === 'whole'
        })}
        role="option"
        aria-selected={selected === 'whole'}
        aria-label={allLabel}
        tabIndex={selected === 'whole' ? 0 : -1}
        ref={(node) => optionRefs.current.set('whole', node)}
        onClick={() => onSelect('whole')}
      >
        {collapsed ? (
          <IconFont type="icon-layers" />
        ) : (
          <>
            <span className={styles.navName}>{allLabel}</span>
            <span className={styles.navBadge}>
              {intl.formatMessage({ id: 'models.import.scope.wholeShort' })}
            </span>
          </>
        )}
      </div>
    );
    return collapsed ? (
      <Tooltip placement="right" title={allLabel}>
        {item}
      </Tooltip>
    ) : (
      item
    );
  };

  const renderEntry = (entry: DeploymentPlanEntry) => {
    const item = (
      <div
        key={entry.index}
        className={classNames(styles.navOption, styles.navItem, {
          [styles.selected]: entry.index === selected,
          [styles.invalid]: entry.errors.length > 0
        })}
        role="option"
        aria-selected={entry.index === selected}
        aria-label={entryName(intl, entry)}
        tabIndex={entry.index === selected ? 0 : -1}
        ref={(node) => optionRefs.current.set(entry.index, node)}
        onClick={() => onSelect(entry.index)}
        style={collapsed ? { borderLeftColor: entryColor(entry) } : undefined}
      >
        {collapsed ? (
          <span className={styles.navIndex}>{entry.index + 1}</span>
        ) : (
          <>
            <Flex align="center" gap={6}>
              <span
                className={styles.navDot}
                style={{ backgroundColor: entryColor(entry) }}
              ></span>
              <span className={styles.navName}>{entryName(intl, entry)}</span>
            </Flex>
            <span className={styles.navCaption}>
              {entryCaption(intl, entry)}
            </span>
          </>
        )}
      </div>
    );
    // Collapsed, the rail is a colour and a number; the name it stands for
    // has to stay reachable without expanding it again.
    return collapsed ? (
      <Tooltip
        key={entry.index}
        placement="right"
        title={`${entryName(intl, entry)} · ${entryCaption(intl, entry)}`}
      >
        {item}
      </Tooltip>
    ) : (
      item
    );
  };

  return (
    <Flex
      vertical
      className={classNames(styles.nav, { [styles.collapsed]: collapsed })}
      role="listbox"
      aria-orientation="vertical"
      onKeyDown={onKeyDown}
    >
      <div className={styles.navTop}>{renderAll()}</div>
      <div className={styles.navDivider}></div>
      <Flex vertical gap={2} className={styles.navItems}>
        {entries.map(renderEntry)}
      </Flex>
    </Flex>
  );
};

export default PlanNavList;
