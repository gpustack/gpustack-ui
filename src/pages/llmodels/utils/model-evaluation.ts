export const SKIP_MODEL_EVALUATION_ENV = 'GPUSTACK_SKIP_MODEL_EVALUATION';

export const shouldSkipModelEvaluation = (
  env?: Record<string, unknown> | null
): boolean => {
  const value = env?.[SKIP_MODEL_EVALUATION_ENV];
  return typeof value === 'string' && value.length > 0;
};
