export const optionalPositiveIntegerRule = (message: string) => ({
  validator: async (_: unknown, value: unknown): Promise<void> => {
    if (value === null || value === undefined || value === '') return;
    if (
      typeof value !== 'number' ||
      !Number.isSafeInteger(value) ||
      value <= 0
    ) {
      throw new Error(message);
    }
  }
});
