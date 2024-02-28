// @ts-ignore
export const fetcher = (...args) =>
  // @ts-ignore
  fetch(...args).then((res) => res.json());
