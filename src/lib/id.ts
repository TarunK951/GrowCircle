let seq = 0;

export function createLocalId(prefix: string): string {
  seq += 1;
  return `${prefix}_${seq}`;
}
