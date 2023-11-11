// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncFunction = (...args: any[]) => Promise<any>;

export function queuedFunction(func: AsyncFunction): AsyncFunction {
  let isRunning = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    if (isRunning) return;
    isRunning = true;
    try {
      return await func(...args);
    } finally {
      isRunning = false;
    }
  };
}
