'use client';

import { use, useState } from 'react';

export default function Test({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const [a, setA] = useState(0);
  function upA() {
    setA((prev) => prev + 1);
  }
  return (
    <div className="flex-grow bg-white">
      <h1 className="text-3xl font-bold">Test</h1>
      <p>params: {username}</p>
    </div>
  );
}
