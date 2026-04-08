/**
 * 并发控制工具集
 *
 * - `createConcurrencyLimit`：队列 + 计数（p-limit 风格）
 * - `mapWithConcurrency`：对数组 map 并限流
 * - `asyncPool`：任务列表 `() => Promise<R>[]` + `Promise.race` + `Set`
 */

/**
 * 异步并发控制：限制同时执行的 Promise 数量。
 *
 * @param concurrency 最大并发数（>= 1）
 * @returns 包装函数，对任意 `() => Promise<T>` 做排队执行
 *
 * @example
 * const limit = createConcurrencyLimit(3);
 * await Promise.all(urls.map((u) => limit(() => fetch(u))));
 */
export function createConcurrencyLimit(concurrency: number) {
  if (!Number.isFinite(concurrency) || concurrency < 1) {
    throw new Error("concurrency must be a finite number >= 1");
  }

  let activeCount = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (activeCount >= concurrency || queue.length === 0) return;
    activeCount++;
    const run = queue.shift()!;
    run();
  };

  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      queue.push(() => {
        Promise.resolve(fn())
          .then(resolve, reject)
          .finally(() => {
            activeCount--;
            next();
          });
      });
      next();
    });
  };
}

/**
 * 对数组逐项执行异步任务，并限制并发。
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = createConcurrencyLimit(concurrency);
  return Promise.all(items.map((item, i) => limit(() => mapper(item, i))));
}

/**
 * 并发池（Promise.race + Set 版），与队列版等价。
 *
 * **在干什么**
 * 同时最多跑 `limit` 个任务；多出来的要排队——靠「池里任务完成一个，循环才能继续多启动一个」实现。
 *
 * **为什么 `tasks` 是 `() => Promise` 而不是直接 `Promise[]`**
 * 若写成 `Promise.resolve(tasks[i])` 且 `tasks[i]` 已是 Promise，任务在创建数组时就全开始了，无法限流。
 * 工厂函数 `() => ...` 表示「轮到再执行」，才能控制何时真正发起请求。
 *
 * **结果顺序**
 * `results[i]` 永远对应 `tasks[i]()` 的结果；谁先完成无所谓，`Promise.all` 按**下标**汇总，输出与 `tasks` 顺序一致。
 *
 * @param limit 最大并发数
 * @param tasks 每项为 `() => Promise<R>`，在池内才真正执行
 *
 * @example
 * await asyncPool(3, urls.map((u) => () => fetch(u).then((r) => r.text())));
 */
export async function asyncPool<R>(
  limit: number,
  tasks: ReadonlyArray<() => Promise<R>>,
): Promise<R[]> {
  if (!Number.isFinite(limit) || limit < 1) {
    throw new Error("limit must be a finite number >= 1");
  }

  // 每个下标一个 Promise，最后 Promise.all 按 0,1,2… 对齐结果（与完成先后无关）
  const results: Array<Promise<R>> = [];
  // 当前「尚未结束」的占位 Promise；数量用来判断是否已经塞满并发槽
  const executing = new Set<Promise<unknown>>();

  for (let i = 0; i < tasks.length; i++) {
    // 用 .then 包一层：避免写成 Promise.resolve(tasks[i]()) 时在 for 同步阶段就把 tasks[i]() 全执行掉
    const p = Promise.resolve().then(() => tasks[i]());
    results.push(p);

    // done：与 p 同生共死；p 结束（成功或失败）时从 executing 里删掉自己，表示「空出一个槽位」
    const done = p.finally(() => {
      executing.delete(done);
    });
    executing.add(done);

    // 槽位已满：先「等任意一个任务结束」再继续 for（不是多执行什么，是暂停循环、背压限流）
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  // for 结束时：每个 tasks[i] 都已启动，results 里已有 N 个 Promise；最后一批可能还在跑。
  // 这里一次性等**全部** settle（含最后几个），再按索引得到与 tasks 对齐的结果数组。
  return Promise.all(results);
}

/** `createConcurrencyLimit` 的常用别名（与社区命名一致） */
export const createPLimit = createConcurrencyLimit;
