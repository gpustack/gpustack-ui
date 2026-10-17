export const isValidLoadValue = (
  value: unknown,
  fixedRate: boolean
): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value > 0 &&
  (fixedRate || Number.isSafeInteger(value));

export const optionalLoadValueRule = (fixedRate: boolean, message: string) => ({
  validator: async (_: unknown, value: unknown): Promise<void> => {
    if (value === null || value === undefined || value === '') return;
    if (!isValidLoadValue(value, fixedRate)) throw new Error(message);
  }
});
