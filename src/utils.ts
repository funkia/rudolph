export function fst<A>(arr: A[]): A;
export function fst(arr: string): string;
export function fst<A>(arr: A[] | string): A | string {
  return arr[0];
}

export function takeUntilRight(stop: string, str: string): string {
  return str.substr(str.indexOf(stop) + 1);
}
