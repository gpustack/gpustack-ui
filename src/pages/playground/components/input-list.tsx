import RowTextarea from '@/components/seal-form/row-textarea';
import { DeleteOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Tooltip } from 'antd';
import _ from 'lodash';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';
import '../style/input-list.less';

interface InputListProps {
  ref?: any;
  height?: number;
  extra?: (data: any) => React.ReactNode;
  showLabel?: boolean;
  sortIndex?: number[];
  textList: {
    text: string;
    uid: number | string;
    name: string;
  }[];
  sortable?: boolean;
  onChange?: (
    textList: { text: string; uid: number | string; name: string }[]
  ) => void;
  onPaste?: (e: any, index: number) => void;
  onSort?: (
    textList: { text: string; uid: number | string; name: string }[]
  ) => void;
}

const InputList: React.FC<InputListProps> = forwardRef(
  (
    {
      textList,
      showLabel = true,
      sortIndex = [],
      sortable,
      height,
      onSort,
      onChange,
      extra,
      onPaste
    },
    ref
  ) => {
    const intl = useIntl();
    const messageId = useRef(0);
    const containerRef = useRef<any>(null);
    const childListRef = useRef<any[]>([]);

    const getContainerChildList = () => {
      childListRef.current = Array.from(containerRef.current?.children || []);
    };

    const getOffsetUsingBoundingClientRect = useCallback(
      (element: HTMLElement, targetElement: HTMLElement) => {
        const currentRect = element.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        return {
          x: targetRect.left - currentRect.left,
          y: targetRect.top - currentRect.top
        };
      },
      []
    );

    // move item from fromIndex to toIndex
    const moveItem = useCallback((child: any, toIndex: number) => {
      const container = containerRef.current;
      if (!container) return;

      const children = Array.from(container.children);

      if (toIndex >= children.length) {
        if (container.firstChild) {
          container.insertBefore(child, container.firstChild);
        } else {
          container.appendChild(child);
        }
      } else {
        container.insertBefore(child, children[toIndex]);
      }
    }, []);

    const moveElement = (arr: any[], fromIndex: number, toIndex: number) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= arr.length ||
        toIndex > arr.length
      ) {
        return arr;
      }

      const element = arr.splice(fromIndex, 1)[0];
      arr.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, element);
      return arr;
    };

    const sort = useCallback(() => {
      if (!sortable) return;
      getContainerChildList();
      const container = containerRef.current;
      if (!container) return;

      const newOrder = [...textList];

      const offsets = sortIndex.map((fromIndex, toIndex) => {
        const currentElement = childListRef.current[fromIndex];
        const targetElement = childListRef.current[toIndex];
        if (!currentElement || !targetElement) return null;

        const offset = getOffsetUsingBoundingClientRect(
          currentElement,
          targetElement
        );
        return {
          element: currentElement,
          offset: {
            x: offset.x,
            y: offset.y
          },
          fromIndex,
          toIndex
        };
      });

      const moveSequentially = async () => {
        for (const [index, data] of offsets.entries()) {
          if (!data) continue;

          const { element, offset, fromIndex, toIndex } = data;
          console.log('sort+++++++', {
            textList,
            element,
            offset,
            fromIndex,
            toIndex
          });

          await new Promise((resolve) => {
            element.style.opacity = 0.5;
            element.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
            element.style.transition = 'transform 0.8s,opacity 0.8s';

            element.addEventListener(
              'transitionend',
              () => {
                moveItem(element, toIndex);
                moveElement(newOrder, fromIndex, toIndex);
                getContainerChildList();

                element.style.opacity = 1;
                element.style.transform = '';
                console.log('sort++++++++++end');

                resolve(null);
              },
              { once: true }
            );
          });
        }

        onSort?.(newOrder);
      };

      moveSequentially();
    }, [
      sortable,
      sortIndex,
      textList,
      onSort,
      getContainerChildList,
      getOffsetUsingBoundingClientRect
    ]);

    const setMessageId = () => {
      messageId.current = messageId.current + 1;
      return messageId.current;
    };

    const handleAdd = () => {
      setMessageId();
      const dataList = [...textList];
      dataList.push({
        text: '',
        uid: messageId.current,
        name: `Text ${dataList.length + 1}`
      });
      onChange?.(dataList);
    };

    const handleDelete = (text: { text: string; uid: number | string }) => {
      const dataList = [...textList];
      const index = dataList.findIndex((item) => item.uid === text.uid);
      dataList.splice(index, 1);
      onChange?.(dataList);
    };

    const handleTextChange = (
      value: string,
      text: { text: string; uid: number | string }
    ) => {
      const dataList = [...textList];
      const index = dataList.findIndex((item) => item.uid === text.uid);
      dataList[index].text = value;
      onChange?.(dataList);
    };
    const debounceSort = _.debounce(sort, 100);

    useEffect(() => {
      if (sortIndex?.length) {
        console.log('sort++++2+++');
        debounceSort();
      }
    }, [sortIndex]);

    useImperativeHandle(ref, () => ({
      handleAdd,
      handleDelete,
      handleTextChange,
      setMessageId
    }));

    return (
      <div className="input-list" ref={containerRef}>
        {textList.map((text, index) => {
          return (
            <div key={text.uid} className="input-item" data-uid={text.uid}>
              <div className="input-wrap">
                <RowTextarea
                  height={height}
                  label={showLabel ? `${index + 1}` : null}
                  value={text.text}
                  placeholder={intl.formatMessage({
                    id: 'playground.embedding.inputyourtext'
                  })}
                  onChange={(e) => handleTextChange(e.target.value, text)}
                  onPaste={(e) => onPaste?.(e, index)}
                ></RowTextarea>
              </div>
              <span className="btn-group">
                <Tooltip
                  title={intl.formatMessage({ id: 'common.button.delete' })}
                >
                  <Button
                    danger
                    size="small"
                    type="text"
                    icon={<DeleteOutlined></DeleteOutlined>}
                    onClick={() => handleDelete(text)}
                  ></Button>
                </Tooltip>
              </span>
              {extra?.(text)}
            </div>
          );
        })}
      </div>
    );
  }
);

export default React.memo(InputList);
