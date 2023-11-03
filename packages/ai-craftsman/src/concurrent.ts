export const promiseAllWithConcurrencyLimit = <T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> => {
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
        result[index] = await task();
      } catch (e) {
        return reject(e);
      }
      active--;
      if (active === 0 && currentIndex >= tasks.length) {
        resolve(result);
      } else {
        executeTask();
      }
    };

    for (let i = 0; i < Math.min(limit, tasks.length); i++) {
      executeTask();
    }
  });
};
