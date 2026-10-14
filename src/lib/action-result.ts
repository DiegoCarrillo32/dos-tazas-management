// Next.js replaces the message of errors thrown from plain server actions with
// a generic one in production. Actions whose messages users need to see return
// them instead; the client rethrows with `unwrap`.

export type ActionResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export function userAction<A extends unknown[], T>(fn: (...args: A) => Promise<T>) {
  return async (...args: A): Promise<ActionResult<T>> => {
    try {
      return { data: await fn(...args) }
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) }
    }
  }
}

export function unwrap<T>(result: ActionResult<T>): T {
  if (result.error !== undefined) throw new Error(result.error)
  return result.data as T
}
