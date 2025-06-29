export const toMillis = (t: number | string) =>
  typeof t === "string"
    ? new Date(t).getTime()
    : t < 1e12              // seconds → ms
    ? t * 1000
    : t;

export const minsAgo = (t: number | string) =>
  Math.round((Date.now() - toMillis(t)) / 60000);

export const minsAhead = (t: number | string) =>
  Math.max(0, Math.round((toMillis(t) - Date.now()) / 60000));
