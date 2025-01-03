import { MoreOutlined } from '@ant-design/icons';
import { Dropdown, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.less';

const TagsWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const [hiddenIndex, setHiddenIndex] = useState<number>(4);
  const uid = useRef(0);

  const updateUid = () => {
    uid.current += 1;
    return uid.current;
  };

  const dropItems = useMemo(() => {
    return React.Children.toArray(children)
      .slice(hiddenIndex)
      .map((child) => ({
        label: child,
        key: updateUid()
      }));
  }, [children, hiddenIndex]);

  const updateHiddenIndex = () => {
    if (!wrapperRef.current || !observer.current) return;

    const childrenList = Array.from(wrapperRef.current.children);
    let newHiddenIndex = 0;

    childrenList.forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      // visible in wrapperRef
      const issivible =
        rect.top < wrapperRef.current!.clientHeight &&
        rect.bottom > 0 &&
        rect.left < wrapperRef.current!.clientWidth &&
        rect.right > 0;

      if (!issivible) {
        newHiddenIndex = Math.max(newHiddenIndex, index + 1);
      }
    });

    setHiddenIndex(newHiddenIndex);
  };

  useEffect(() => {
    if (!wrapperRef.current) return;

    // observer.current = new IntersectionObserver(
    //   (entries) => {
    //     const lastEntry = entries[entries.length - 1];
    //     if (lastEntry && lastEntry.intersectionRatio < 1) {
    //       setHiddenIndex((prev) =>
    //         Math.max(prev, React.Children.count(children))
    //       );
    //     }
    //   },
    //   { root: wrapperRef.current, threshold: 1 }
    // );

    // const childrenList = wrapperRef.current.children;
    // if (childrenList.length > 0) {
    //   observer.current.observe(childrenList[childrenList.length - 1]);
    // }

    resizeObserver.current = new ResizeObserver(() => {
      // updateHiddenIndex();
    });
    resizeObserver.current.observe(wrapperRef.current);

    return () => {
      observer.current?.disconnect();
      resizeObserver.current?.disconnect();
    };
  }, [children]);

  return (
    <div className="tags-wrapper" ref={wrapperRef}>
      {React.Children.toArray(children).slice(0, hiddenIndex)}
      {React.Children.toArray(children).length > 4 && (
        <Dropdown
          trigger={['hover']}
          menu={{
            items: dropItems
          }}
        >
          <Tag className="more">
            <MoreOutlined rotate={90} />
          </Tag>
        </Dropdown>
      )}
    </div>
  );
};

export default React.memo(TagsWrapper);
