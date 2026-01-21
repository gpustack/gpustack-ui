import SegmentLine from '@/components/segment-line';
import { useMemoizedFn } from 'ahooks';
import _ from 'lodash';
import React, { forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import useFieldScroll from './use-field-scroll';

const SegmentedHeader = styled.div<{ $top?: number }>`
  position: sticky;
  top: ${(props) => props.$top || 0}px;
  z-index: 10;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--ant-color-split);
  background-color: var(--ant-color-bg-elevated);
`;

/**
 * ScrollSpyTabs component
 * defaultTarget: The default active target tab
 * segmentedTop: { // Mostlty, It's always a constants.
 *   top: number; // The top offset for the sticky header
 *   offsetTop: number; // The offset top for the target
 * }
 * getScrollElementScrollableHeight: function to get the scrollable height of the scroll element
 * segmentOptions.field: The target data-field={segmentOptions.field} to scroll to
 * activeKey: The current active keys for collapsible sections
 * setActiveKey: The function to set active keys for collapsible sections
 */
interface ScrollSpyTabsProps {
  ref?: any;
  children?: React.ReactNode;
  defaultTarget?: string;
  segmentedTop: {
    top: number;
    offsetTop: number;
  };
  activeKey: string[];
  setActiveKey: (keys: string[]) => void;
  getScrollElementScrollableHeight?: () => {
    scrollHeight: number;
    scrollTop: number;
  };
  segmentOptions: {
    label: string;
    value: string;
    icon?: React.ReactNode;
    field: string;
  }[];
}

const ScrollSpyTabs: React.FC<ScrollSpyTabsProps> = forwardRef(
  (
    {
      getScrollElementScrollableHeight,
      segmentedTop,
      segmentOptions,
      defaultTarget,
      activeKey,
      setActiveKey,
      children
    },
    ref
  ) => {
    const [target, setTarget] = React.useState<string>(
      defaultTarget || segmentOptions[0]?.value || ''
    );

    const { scrollToSegment, holderHeight } = useFieldScroll({
      activeKey,
      setActiveKey,
      segmentOptions,
      segmentedTop: segmentedTop,
      getScrollElementScrollableHeight: getScrollElementScrollableHeight
    });

    const throttleScrollToSegment = useMemoizedFn(
      _.throttle(
        async (val: string) => {
          setTarget(val);
          scrollToSegment(val, { offsetTop: segmentedTop.offsetTop });
        },
        500,
        { trailing: true }
      )
    );

    const handleTargetChange = async (val: any) => {
      throttleScrollToSegment(val);
    };

    useImperativeHandle(ref, () => ({
      handleTargetChange
    }));

    return (
      <div>
        {segmentOptions.length > 0 && (
          <SegmentedHeader $top={segmentedTop.top}>
            <SegmentLine
              theme={'light'}
              defaultValue={target}
              value={target}
              onChange={handleTargetChange}
              options={segmentOptions}
            />
          </SegmentedHeader>
        )}
        {children}
        <div className="holder" style={{ height: holderHeight }}></div>
      </div>
    );
  }
);

export default ScrollSpyTabs;
