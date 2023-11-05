export const promiseAllWithConcurrencyLimit = (tasks, limit, continueOnError = true) => {
    return new Promise(async (resolve, reject) => {
        let active = 0;
        let result = [];
        let currentIndex = 0;
        const executeTask = async () => {
            if (currentIndex >= tasks.length) {
                return;
            }
            const index = currentIndex;
            const task = tasks[currentIndex++];
            active++;
            try {
                result[index] = await task();
            }
            catch (e) {
                if (!continueOnError) {
                    return reject(e);
                }
                else {
                    console.error(e);
                }
            }
            active--;
            if (active === 0 && currentIndex >= tasks.length) {
                resolve(result);
            }
            else {
                executeTask();
            }
        };
        if (tasks.length === 0)
            return resolve([]);
        for (let i = 0; i < Math.min(limit, tasks.length); i++) {
            executeTask();
        }
    });
};
