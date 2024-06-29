import { test } from 'node:test';
import assert from 'node:assert';
import { buildMockable } from '../lib/mockable.ts';

test('class mocks', () => {
  const mockable = buildMockable();

  @mockable.class
  class Foo {
    private x = 2;
    public y = 1;
  }

  mockable.replaceForTest(Foo, {
    y: 123,
  });

  const f = new Foo();
  assert.strictEqual(f.y, 123);
  assert.ok(f instanceof Object);
  assert.ok(!(f instanceof Foo));

  mockable.reset(Foo);

  const f2 = new Foo();
  assert.strictEqual(f2.y, 1);
  assert.ok(f2 instanceof Foo);
});

test('function mocks', () => {
  const mockable = buildMockable();

  const func = () => {
    let x = 1;
    return x + Math.random();
  };
  const mockFunc = mockable.function(func);

  mockable.replaceForTest(mockFunc, 100.5);
  assert.strictEqual(mockFunc(), 100.5);

  mockable.resetAll();

  const actual = mockFunc();
  assert.ok(actual >= 1.0 && actual < 2.0);
});
