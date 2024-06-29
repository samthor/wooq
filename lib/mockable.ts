import type * as t from './types.js';

function globalStore<V>(): t.Store<V> {
  let value: V | undefined;
  let nonce: Object = new Object();

  return {
    update(update) {
      value = update;

      nonce = new Object();
      const localNonce = nonce;

      return () => {
        if (nonce === localNonce) {
          value = undefined;
        }
      };
    },
    get() {
      return value;
    },
  };
}

export function buildMockable(arg?: Partial<t.MockableArg>): Readonly<t.Mockable> {
  if (arg?.skip) {
    return {
      class(arg) {
        return arg;
      },
      function(arg) {
        return arg;
      },
      replaceForTest() {
        throw new Error(`mockable skipped, maybe outside test?`);
      },
      reset() {},
      resetAll() {},
    };
  }

  const buildStore = arg?.store ?? globalStore;
  const className = arg?.className ?? ((name: string) => `mockable~${name}`);

  const upgraded = new WeakMap<t.AllMockable, { store?: t.Store<any>; reset?: () => void }>();
  const active = new Set<t.AllMockable>();

  return {
    class<Y extends t.MockableClass>(arg: Y) {
      let mockActive = false;

      const outer = class extends (arg as t.Ctor<any>) {
        constructor(...args: ConstructorParameters<Y>) {
          if (mockActive) {
            super(...args);
            return;
          }

          const s = upgraded.get(outer);
          const fake = s?.store?.get();
          if (fake) {
            mockActive = true;
            try {
              const replacement = fake(outer as Y, ...args);
              return replacement;
            } finally {
              mockActive = false;
            }
          }

          super(...args);
        }
      };

      // Try to give the class a sensible name for debug logging.
      const name = className(arg.name);
      try {
        // some envs might prevent us renaming the new class
        Object.defineProperty(outer, 'name', { value: name });
      } catch {}

      upgraded.set(outer, {});
      return outer as Y;
    },

    function<Y extends t.MockableFunction>(arg: Y) {
      const outer = function (...args: Parameters<Y>): ReturnType<Y> {
        const s = upgraded.get(outer);
        const use = s?.store?.get();
        if (use) {
          if (new.target) {
            return new (use as any)(arg, ...args);
          }
          return use(arg, ...args);
        }

        if (new.target) {
          return new (arg as any)(...args);
        }
        return arg(...args) as ReturnType<typeof arg>;
      };

      upgraded.set(outer, {});
      return outer as Y;
    },

    replaceForTest<Y extends t.MockableFunction | t.MockableClass>(
      target: Y,
      update: Y extends t.MockableClass
        ? t.MockableClassBuilderArg<Y>
        : Y extends t.MockableFunction
        ? t.MockableFunctionBuilderArg<Y>
        : never,
    ) {
      const s = upgraded?.get(target);
      if (s === undefined) {
        throw new Error(`not mocked: ${target}`);
      }
      let { store } = s;
      if (store === undefined) {
        store = buildStore();
        s.store = store;
      }

      const callable = typeof update === 'function' ? update : () => update;
      s.reset = store.update(callable);
      active.add(target);
    },

    reset(target) {
      const s = upgraded.get(target);
      if (s?.reset !== undefined) {
        s.reset();
        delete s.reset;
        active.delete(target);
      }
    },

    resetAll() {
      active.forEach((a) => {
        const s = upgraded.get(a)!;
        s.reset!();
        delete s.reset;
      });
      active.clear();
    },
  };
}
