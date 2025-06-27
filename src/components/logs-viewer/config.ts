export const controlSeqRegex = /\x1b\[(\d*);?(\d*)?([A-DJKHfm])/g;
export const replaceLineRegex = /\r\n/g;

export const PageSize = 1000;

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  wait: number
): ((this: ThisParameterType<T>, ...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = Date.now();

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
    const now = Date.now();
    const remaining = wait - (now - previous);
    const context = this as ThisParameterType<T>;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(context, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(context, args);
      }, remaining);
    }
  };
};
