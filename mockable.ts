export type Ctor<Y> = { new (...args: any[]): Y };
export type Public<P> = { [X in keyof P]: P[X] };

type Mockable = Ctor<any> | ((...args: any[]) => unknown);

type MockType<Y> = Y extends (...args: any[]) => Function
  ? (real: Y, ...args: Parameters<Y>) => ReturnType<Y> // if we mock sth that returns a function, must provide outer function
  : Y extends (...args: any[]) => unknown
  ? ReturnType<Y> | ((real: Y, ...args: Parameters<Y>) => ReturnType<Y>)
  : Y extends Ctor<infer Q>
  ? Public<Q> | ((real: Y, ...args: ConstructorParameters<Y>) => Public<Q>)
  : never;

type CallableMockType<Y> = Y extends (...args: any[]) => unknown
  ? (real: Y, ...args: Parameters<Y>) => ReturnType<Y>
  : Y extends Ctor<infer Q>
  ? (real: Y, ...args: ConstructorParameters<Y>) => Public<Q>
  : never;

export type MockableBuild = {
  mockable<Y extends Mockable>(arg: Y): Y;
  replaceForTest<Y extends Mockable>(target: Y, update: MockType<Y>): void;
  reset<Y extends Mockable>(target: Y): void;
  resetAll(): void;
};

export type MockableStore<V> = {
  set(v: V | undefined): void;
  get(): V | undefined;
};

export type MockableArg = {
  skip: boolean;
  store: <V>() => MockableStore<V>;
  className: (name: string) => string;
};

function globalStore<V>(): MockableStore<V> {
  let value: V | undefined;
  return {
    set(v: V | undefined) {
      value = v;
    },
    get() {
      return value;
    },
  };
}

export function build(arg?: Partial<MockableArg>): MockableBuild {
  if (arg?.skip) {
    return {
      mockable(arg) {
        return arg;
      },
      replaceForTest() {
        throw new Error(`replaceForTest skip`);
      },
    };
  }
  const store = arg?.store ?? globalStore;
  const className = arg?.className ?? ((name: string) => `mockable~${name}`);
  let wm = new WeakMap<Mockable, MockableStore<any>>();

  return {
    mockable<Y extends Mockable>(arg: Y): Y {
      const isClass = arg.toString().startsWith('class');
      let mockActive = false;

      const s = store<CallableMockType<Y>>();

      if (isClass) {
        const outer = class extends (arg as Ctor<any>) {
          constructor(...args: any[]) {
            if (mockActive) {
              super(...args);
              return;
            }

            const fake = s.get();
            if (fake) {
              mockActive = true;
              try {
                const replacement = fake(outer, ...args);
                return replacement;
              } finally {
                mockActive = false;
              }
            }

            super(...args);
          }
        };
        const name = className(arg.name);
        try {
          // some envs might prevent us renaming the new class
          Object.defineProperty(outer, 'name', { value: name });
        } catch {}
        wm.set(outer, s);
        return outer as Y;
      }

      const outer = function (...args: any[]) {
        const use = s.get();
        if (use) {
          args.unshift(arg);
        }

        const target = use ?? arg;
        if (new.target) {
          return new target(...args);
        }
        return target(...args);
      };
      wm.set(outer, s);

      return outer as Y;
    },

    replaceForTest(target, update) {
      const callable = typeof update === 'function' ? update : () => update;
      const s = wm.get(target);
      if (!s) {
        throw new Error(`not mocked: ${target}`);
      }
      s.set(callable);
    },

    reset(target) {
      const s = wm.get(target);
      s?.set(undefined);
    },

    resetAll() {
      wm = new WeakMap();
    },
  };
}
