import { MoreOutlined } from '@ant-design/icons';
import { Dropdown, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './index.less';

const TagsWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [hiddenIndex, setHiddenIndex] = useState<number>(0);
  const uid = useRef(0);

  const updateUid = () => {
    uid.current += 1;
    return uid.current;
  };

  const dropItems = useMemo(() => {
    return React.Children.toArray(children)
      .slice(hiddenIndex)
      .map((child, index) => ({
        label: child,
        key: updateUid()
      }));
  }, [children, hiddenIndex]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        let newHiddenIndex = 0;
        entries.forEach((entry, index) => {
          if (entry.intersectionRatio < 1) {
            newHiddenIndex = Math.min(newHiddenIndex, index);
          }
          console.log(
            'isIntersecting=======',
            entry.intersectionRatio,
            newHiddenIndex
          );
        });
        setHiddenIndex(() => newHiddenIndex);
      },
      {
        root: wrapperRef.current,
        threshold: 0
      }
    );

    const childrenList = wrapperRef.current.children;
    Array.from(childrenList).forEach((child) => {
      observer.current?.observe(child);
    });

    return () => {
      observer.current?.disconnect();
    };
  }, [children]);

  return (
    <div className="tags-wrapper" ref={wrapperRef}>
      <span>{hiddenIndex}</span>
      {React.Children.toArray(children).slice(
        0,
        React.Children.toArray(children).length - hiddenIndex
      )}
      {hiddenIndex > 0 && (
        <Dropdown
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
