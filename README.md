wooq lets you mock your JS/TS code for tests.

It requires you to modify existing files by adding annotations allowing code to be mocked.
Some people don't like this, but you can set `skip` outside tests to make the code basically a no-op.

Usage:

```ts
const mockable = buildMockable({ skip: !process.env.TEST });

// code.ts
@mockable.class
export class ComplexClass {
  foo() {
    return 100;
  }
}

// test.ts
test('mock class', () => {
  mockable.replaceForTest(ComplexClass, {
    foo() {
      return -999;
    },
  };

  const x = new UsesComplexClassInternally();
  assert.equals(x.whatever(), -999);
});
```

wooq also has a configurable storage layer (for "what is currently replacing a real class").
This might be useful for ['thread-local'](https://nodejs.org/api/async_context.html) storage in concurrent tests.

wooq supports mocking classes and functions, but TS only has annotation support for classes (something something hoisting rules).
So, this works, but might be awkward:

```ts
const mockableFunctionThatDefaultReturns123 = mockable.function(() => {
  return 123;
});
```

## Fun Fact

wooq is boom but upside-down.
