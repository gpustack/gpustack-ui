import { StatusDot } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Flex } from 'antd';
import classNames from 'classnames';
import React, { useRef } from 'react';
import { entryCaption, entryName } from '../../config/import-plan';
import { DeploymentPlanEntry } from '../../config/types';
import styles from '../../style/import-yaml-modal.module.less';

// What the diff is showing: one deployment by its position in the document,
// or the whole document selected from the header.
export type PlanSelection = number | 'whole';

interface PlanNavListProps {
  entries: DeploymentPlanEntry[];
  selected: PlanSelection;
  onSelect: (selection: PlanSelection) => void;
}

const PlanNavList: React.FC<PlanNavListProps> = ({
  entries,
  selected,
  onSelect
}) => {
  const intl = useIntl();

  // The list contains deployments only. When the whole document is selected,
  // Tab enters at the first deployment without changing the displayed scope.
  const optionRefs = useRef(new Map<number, HTMLElement | null>());
  const order = entries.map((entry) => entry.index);
  const tabStop = selected === 'whole' ? order[0] : selected;

  const moveTo = (next: number) => {
    onSelect(next);
    optionRefs.current.get(next)?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const at = order.indexOf(index);
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
        onSelect(index);
        break;
      default:
        break;
    }
  };

  const renderEntry = (entry: DeploymentPlanEntry) => {
    const name = entryName(intl, entry);
    const caption = entryCaption(intl, entry);
    const invalid = entry.errors.length > 0;
    const status = invalid
      ? 'error'
      : entry.action === 'update'
        ? 'warning'
        : entry.action === 'create'
          ? 'success'
          : 'inactive';

    return (
      <Flex
        key={entry.index}
        vertical
        gap={6}
        className={classNames(styles.navOption, {
          [styles.selected]: entry.index === selected
        })}
        role="option"
        aria-selected={entry.index === selected}
        aria-label={[name, caption].filter(Boolean).join(' · ')}
        tabIndex={entry.index === tabStop ? 0 : -1}
        ref={(node) => optionRefs.current.set(entry.index, node)}
        onClick={() => onSelect(entry.index)}
        onKeyDown={(event) => onKeyDown(event, entry.index)}
      >
        <span className={styles.navName} title={name}>
          <StatusDot statusValue={{ status, text: name }} />
        </span>
        <span
          className={classNames(styles.navCaption, {
            [styles.invalid]: invalid
          })}
          title={caption}
        >
          {caption}
        </span>
      </Flex>
    );
  };

  return (
    <Flex
      vertical
      gap={'small'}
      className={styles.nav}
      role="listbox"
      aria-label={intl.formatMessage({ id: 'dashboard.deployments' })}
      aria-orientation="vertical"
    >
      {entries.map(renderEntry)}
    </Flex>
  );
};

export default PlanNavList;
