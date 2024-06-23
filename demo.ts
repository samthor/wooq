import { build } from './mockable.ts';

const { mockable, replaceForTest } = build();

@mockable
class Foo {
  constructor(public q: number) {}
  x: number = 123;
  private hidden: number = 123;
}

const blah = mockable((x: number) => {
  return x + 123;
});

const blah2 = mockable(() => {
  return () => 123;
});

const f = new Foo(1);

console.info('out', blah(1), 'f', f, f.constructor);

replaceForTest(Foo, { q: 0, x: 123 });
replaceForTest(Foo, (_, q) => {
  return new _(100000);
});

replaceForTest(blah, 123);

replaceForTest(blah2, () => () => 123);

const f2 = new Foo(2);
console.info('got faux foo', f2, f2.constructor, f2 instanceof Foo);
