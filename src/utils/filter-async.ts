export const filterAsync = async <T>(arr: T[], callback: (val: T) => Promise<boolean>): Promise<T[]> => {
  const fail = Symbol();
  const promises = arr.map(async (item) => {
    try {
      return (await callback(item)) ? item : fail;
    } catch (e) {
      return fail;
    }
  });

  return (await Promise.all(promises)).filter((i) => i !== fail) as T[];
};
