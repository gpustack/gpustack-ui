import { CronExpressionParser } from 'cron-parser';

export const getScalingSchedulePreviewCron = (cron: string): string => {
  const fields = cron.trim().split(/\s+/);
  if (fields.length !== 5 && fields.length !== 6) {
    throw new Error('Cron syntax cannot be previewed');
  }
  // croniter places seconds last and uses L5 for the last Friday.
  // cron-parser places seconds first and uses 5L. Convert only the preview.
  if (
    fields[4].split(',').some((day) => /L/i.test(day) && !/^L[0-7]$/i.test(day))
  ) {
    throw new Error('Day-of-week syntax cannot be confirmed');
  }
  fields[4] = fields[4].replace(/\bL([0-7])\b/gi, '$1L');
  const seconds = fields.length === 6 ? fields.pop()! : '0';
  return [seconds, ...fields].join(' ');
};

export const canPreviewScalingScheduleCron = (cron: string): boolean => {
  try {
    CronExpressionParser.parse(getScalingSchedulePreviewCron(cron)).next();
    return true;
  } catch {
    return false;
  }
};
