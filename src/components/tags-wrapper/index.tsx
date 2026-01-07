import { MoreOutlined } from '@ant-design/icons';
import { Dropdown, Tag } from 'antd';
import _ from 'lodash';
import ResizeObserver from 'rc-resize-observer';
import React, { useEffect, useRef, useState } from 'react';
import './index.less';

interface TagsWrapperProps {
  gap?: number;
  dataList: any[];
  renderTag: (item: any, index?: number) => React.ReactNode;
}

const TagsWrapper: React.FC<TagsWrapperProps> = (props) => {
  const { gap = 0, dataList, renderTag } = props;
  const tagsContentRef = useRef<HTMLDivElement>(null);
  const [hiddenIndices, setHiddenIndices] = useState({
    start: 0,
    end: dataList.length
  });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLDivElement>(null);
  const moreButtonWidth = useRef(0);
  const nodeSizeList = useRef<number[]>([]);

  const calculateHiddenIndices = () => {
    const wrapperWidth = wrapperRef.current?.offsetWidth || 0;
    const childNodes = tagsContentRef.current?.childNodes;
    let sizeList = nodeSizeList.current;

    if (!sizeList.length && childNodes?.length) {
      sizeList = _.map(childNodes, (node: HTMLDivElement, index: number) => {
        if (index === childNodes.length - 1) {
          return node?.offsetWidth;
        }
        return node?.offsetWidth + gap;
      });
      nodeSizeList.current = sizeList;
    }

    if (wrapperWidth === 0 || !sizeList.length) return;

    // cache more button width
    if (moreBtnRef.current?.offsetWidth) {
      moreButtonWidth.current = moreBtnRef.current?.offsetWidth + gap;
    }

    let totalWidth = 0;
    let start = 0;
    let end = dataList.length;

    for (let i = 0; i < sizeList.length; i++) {
      const nodeWidth = sizeList[i];

      if (totalWidth + moreButtonWidth.current >= wrapperWidth) {
        end = i - 1 < 0 ? 0 : i - 1;
        break;
      }
      totalWidth += nodeWidth;

      if (totalWidth >= wrapperWidth) {
        end = i;
        break;
      }
    }

    if (hiddenIndices.start !== start || hiddenIndices.end !== end) {
      setHiddenIndices({
        start,
        end
      });
    }
  };

  const handleClick = (data: any) => {
    data.domEvent?.stopPropagation();
  };

  useEffect(() => {
    if (tagsContentRef.current) {
      calculateHiddenIndices();
    }
  }, [dataList, gap]);

  const handleContentResize = _.throttle(() => {
    calculateHiddenIndices();
  }, 200);

  return (
    <ResizeObserver onResize={handleContentResize}>
      <div className="tags-wrapper" ref={wrapperRef}>
        <ResizeObserver onResize={handleContentResize}>
          <div className="tags-content" ref={tagsContentRef} style={{ gap }}>
            {_.map(
              _.slice(dataList, hiddenIndices.start, hiddenIndices.end),
              (item: any, index: number) => {
                return <span key={index}>{renderTag?.(item, index)}</span>;
              }
            )}
          </div>
        </ResizeObserver>
        {hiddenIndices.end < dataList.length && (
          <Dropdown
            trigger={['hover']}
            classNames={{
              root: 'tags-wrapper-dropdown'
            }}
            menu={{
              items: _.map(
                _.slice(dataList, hiddenIndices.end),
                (item: any, index: number) => {
                  return {
                    label: renderTag?.(item, index),
                    key: index,
                    onClick: handleClick
                  };
                }
              )
            }}
          >
            <Tag
              className="more"
              variant="outlined"
              style={{ marginInline: hiddenIndices.end < 1 ? 0 : `${gap}px 0` }}
              ref={moreBtnRef}
            >
              <MoreOutlined rotate={90} />
            </Tag>
          </Dropdown>
        )}
      </div>
    </ResizeObserver>
  );
};

export default TagsWrapper;
