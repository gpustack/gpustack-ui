import _ from 'lodash';
import { useRef } from 'react';

export default function useContainerScroll(
  container: any,
  options?: { toBottom?: boolean }
) {
  const isWheeled = useRef(false);
  const scroller = useRef(container);
  const optionsRef = useRef(options);
  const toBottomFlag = useRef(options?.toBottom);

  const debunceResetWheeled = _.debounce(() => {
    isWheeled.current = false;
  }, 5000);

  const handleContentWheel = (e: any) => {
    isWheeled.current = true;
    debunceResetWheeled();
  };

  const scrollerRun = () => {
    const scrollerContainer = scroller.current?.current || {};
    const { scrollHeight, clientHeight, scrollTop } = scrollerContainer;
    if (
      optionsRef.current?.toBottom &&
      toBottomFlag.current &&
      scrollHeight > clientHeight + scrollTop
    ) {
      scroller.current.current.scrollTop = scrollHeight;
      // toBottomFlag.current = false;
      isWheeled.current = false;
    } else if (
      !isWheeled.current &&
      scrollHeight > clientHeight + scrollTop &&
      scroller.current?.current
    ) {
      scroller.current.current.scrollTop += 10;
      window.requestAnimationFrame(scrollerRun);
    }
  };

  const updateScrollerPosition = () => {
    if (!isWheeled.current) {
      window.requestAnimationFrame(scrollerRun);
    }
  };

  return {
    handleContentWheel,
    updateScrollerPosition,
    scroller
  };
}
