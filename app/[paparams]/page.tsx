'use client';

import { use, useState } from 'react';

import TestComponent from '@components/test-component';

export default function Test({ params }: { params: Promise<{ paparams: string }> }) {
  const { paparams } = use(params);
  const [a, setA] = useState(0);
  function upA() {
    setA((prev) => prev + 1);
  }
  return (
    <div>
      <h1 className="text-3xl font-bold">Test</h1>
      <p>params: {paparams}</p>
      <TestComponent param2={222} func1={upA} nn={a} />
    </div>
  );
}
