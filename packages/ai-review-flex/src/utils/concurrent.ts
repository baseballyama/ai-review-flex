export const promiseAllWithConcurrencyLimit = <T>(
  tasks: (() => Promise<T>)[],
  limit: number,
  option: {
    retryCount: number;
    continueOnError: boolean;
  } = {
    retryCount: 1,
    continueOnError: false,
  }
): Promise<T[]> => {
  option.retryCount = Math.max(1, option.retryCount);
  return new Promise<T[]>(async (resolve, reject) => {
    let active = 0;
    let result: T[] = [];
    let currentIndex = 0;

    const executeTask = async () => {
      if (currentIndex >= tasks.length) {
        return;
      }
      const index = currentIndex;
      const task = tasks[currentIndex++]!;
      active++;
      try {
        for (const i of Array(option.retryCount).keys()) {
          try {
            result[index] = await task();
            await new Promise((resolve) => setTimeout(resolve, 1000 * 10));
            break;
          } catch (e) {
            if (i === option.retryCount - 1) {
              throw e;
            }
          }
        }
      } catch (e) {
        if (!option.continueOnError) {
          return reject(e);
        } else {
          console.error(e);
        }
      }
      active--;
      if (active === 0 && currentIndex >= tasks.length) {
        resolve(result);
      } else {
        executeTask();
      }
    };

    if (tasks.length === 0) return resolve([]);
    for (let i = 0; i < Math.min(limit, tasks.length); i++) {
      executeTask();
    }
  });
};
