import { baz, foo } from '@lib/temp';

interface TestComponentProps {
  param1?: string;
  param2: number;
  func1?: () => void;
  nn: number;
}

export default function TestComponent(props: TestComponentProps) {
  const f = foo();
  const { a, sub1, sub2 } = baz();
  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16">
      <main className="row-start-2 flex flex-col items-center gap-[32px] sm:items-start">
        <h1 className="text-3xl font-bold">Test</h1>
        <p>
          {f}, {sub1()}, {sub2()}, {a}
        </p>
        <p>
          {props.param1 ? props.param1 : 'param1 is null'}, {props.param2}
        </p>
        <button
          onClick={() => {
            props.func1 && props.func1();
          }}
        >
          Click me: {props.nn}
        </button>
      </main>
    </div>
  );
}
