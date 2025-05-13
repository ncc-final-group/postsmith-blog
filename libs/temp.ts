export function foo() {
  return '개발 시작하면 이 파일 삭제할 것1';
}

export function bar() {
  return '개발 시작하면 이 파일 삭제할 것2';
}

export function baz() {
  const a = 'asdf';
  function sub1() {
    return '하위 함수1';
  }
  function sub2() {
    return '하위 함수2';
  }

  return {
    a,
    sub1,
    sub2,
  };
}
