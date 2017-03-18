export function fst<A>(arr: A[]): A;
export function fst(arr: string): string;
export function fst<A>(arr: A[] | string): A | string {
  return arr[0];
}

export function updateRecord<A extends string, B>(rec: Record<A, B>, prop: A, value: B): Partial<Record<A, B>> {
  let obj: Partial<Record<A, B>> | B[] = {};
  for (const key in Object.keys(rec)) {
    if (rec.hasOwnProperty(key)) {
      obj[key] = rec[key];
    }
  }
  obj[prop] = value;
  return obj;
}

export function takeUntilRight(stop: string, str: string): string {
  return str.substr(str.indexOf(stop) + 1);
}
