export type Store<V> = {
  update: (update: V) => () => void;
  get: () => V | undefined;
};

export type MockableArg = {
  skip: boolean;
  store: <V>() => Store<V>;
  className: (name: string) => string;
};

export type Ctor<Y> = { new (...args: any[]): Y };
export type Public<P> = { [X in keyof P]: P[X] };

export type MockableClass = Ctor<any>;
export type MockableFunction = (...args: any[]) => unknown;

export type MockableClassBuilder<Y extends Ctor<any>> = (
  real: Y,
  ...args: ConstructorParameters<Y>
) => Public<InstanceType<Y>>;

export type MockableClassBuilderArg<Y extends Ctor<any>> =
  | MockableClassBuilder<Y>
  | Public<InstanceType<Y>>;

export type MockableFunctionBuilder<Y> = (real: Y, ...args: Parameters<Y>) => ReturnType<Y>;

export type MockableFunctionBuilderArg<Y extends (...args: any[]) => unknown> = Y extends (
  ...args: any[]
) => Function
  ? MockableFunctionBuilder<Y> // if we mock sth that returns a function, must provide outer function
  : ReturnType<Y> | MockableFunctionBuilder<Y>;

export type AllMockable = MockableClass | MockableFunction;

export type Mockable = {
  class<Y extends MockableClass>(arg: Y): Y;

  function<Y extends MockableFunction>(arg: Y): Y;

  replaceForTest<Y extends MockableClass>(target: Y, update: MockableClassBuilderArg<Y>): void;
  replaceForTest<Y extends MockableFunction>(
    target: Y,
    update: MockableFunctionBuilderArg<Y>,
  ): void;

  reset<Y extends AllMockable>(target: Y): void;

  resetAll(): void;
};
