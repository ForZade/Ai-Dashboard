export async function safe<T>(promise: Promise<T>): Promise<[T, null] | [null, Error]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (err: unknown) {
    return [null, err instanceof Error ? err : new Error(String(err))];
  }
}