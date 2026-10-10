import { POLICY_WEIGHT_CONFIG } from '../config';

const toWeightNumber = (value: any): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const num = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(num) ? num : undefined;
};

// Keep 0 as a transient input state (e.g. the first keystroke of "0.5").
// Payload normalization in lb-plugins enforces the positive bound on save.
export const toPolicyInfluence = (value: any): number => {
  const num = toWeightNumber(value);
  const { min, max } = POLICY_WEIGHT_CONFIG.influence;
  if (num == null) {
    return min;
  }
  if (num === 0) {
    return 0;
  }
  return Math.min(max, Math.max(min, num));
};

// Decision-service rankWeight uses whole numbers on a separate (0, 20] scale.
export const toDecisionServiceWeight = (value: any): number => {
  const num = toWeightNumber(value);
  const { min, max } = POLICY_WEIGHT_CONFIG.decision;
  if (num == null) {
    return min;
  }
  if (num === 0) {
    return 0;
  }
  return Math.min(max, Math.max(min, Math.round(num)));
};
