import { buildMockable } from './lib/mockable.ts';
import type { Ctor } from './lib/types.js';

const mockable = buildMockable();

@mockable.class
class Foo {
  constructor(public q: number) {}
  x: number = 123;
  private hidden: number = 123;
}

const blah = mockable.function((x: number) => {
  return x + 123;
});

const whatever = () => 123;

const blah2 = mockable.function(() => {
  return whatever;
});

const f = new Foo(1);

console.info('out', blah(1), 'f', f, f.constructor);

mockable.replaceForTest(Foo, { q: 0, x: 123 });
mockable.replaceForTest(Foo, (_, q) => {
  return new _(100000);
});

mockable.replaceForTest(blah, 123);

mockable.replaceForTest(blah2, () => () => 456);

const f2 = new Foo(2);
console.info('got faux foo', f2, f2.constructor, f2 instanceof Foo);

console.info('blah2', blah2()());

mockable.resetAll();
console.info('blah2', blah2()());

function testParam(ctor: Ctor<any>, b: any, index: number) {
  console.info('testParam was called on', { ctor, b, index });
}

function testMethod(instance: any, name: string, descriptor: PropertyDescriptor) {
  console.info('testMethod was called on', { instance, name, descriptor });

  return {
    value: () => {
      console.info('replaced');
    },
  };
}

console.info('before decl');

class Whatever {
  constructor(foo: number, @testParam bar: string) {}

  @testMethod
  foo = () => {};

  @testMethod
  methodwhatever(a: string) {
    console.info('butt');
  }
}

const w = new Whatever();
w.methodwhatever('z');
