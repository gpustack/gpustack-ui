import { systemConfigAtom } from '@/atoms/system';
import {
  ClockCircleOutlined,
  InfoCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import {
  Input as CInput,
  InputNumber as CInputNumber,
  MultipleSelect,
  Select as SealSelect,
  TimePicker
} from '@gpustack/core-ui';
import { getLocale, useIntl } from '@umijs/max';
import { Button, Divider, Form, Switch, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { CronExpressionParser } from 'cron-parser';
import cronstrue from 'cronstrue/i18n';
import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { Fragment, useMemo, useState } from 'react';
import { useFormContext } from '../config/form-context';
import { FormData } from '../config/types';

// Map the app locale to a cronstrue locale id (falls back to English).
const cronstrueLocaleMap: Record<string, string> = {
  'zh-CN': 'zh_CN',
  'en-US': 'en',
  'ja-JP': 'ja',
  'ru-RU': 'ru',
  'tr-TR': 'tr'
};

const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

// Resolve cronstrue's real static `toString`. Calling `cronstrue.toString(...)`
// on the default import is fragile after bundling: `toString` is a special
// property name, so depending on interop the default import can be an
// { default } wrapper without an own `toString`, and the call silently resolves
// to Object.prototype.toString — returning "[object Object]" and ignoring the
// cron. When that happens the real method lives on `.default`. It must be
// invoked AS A METHOD (not detached into a local): the minified build's static
// `toString` references `this`, so a detached call throws.
const cronstrueToString = (cron: string, options: any): string | null => {
  const lib = cronstrue as any;
  if (lib?.toString && lib.toString !== Object.prototype.toString) {
    return lib.toString(cron, options);
  }
  if (typeof lib?.default?.toString === 'function') {
    return lib.default.toString(cron, options);
  }
  return null;
};

const describeCron = (cron: string, locale: string): string | null => {
  if (!cron?.trim()) return null;
  try {
    return cronstrueToString(cron, {
      locale,
      use24HourTimeFormat: true,
      throwExceptionOnParseError: true
    });
  } catch {
    return null;
  }
};

const FREQUENCY_KEYS = {
  minute: 'models.form.scaling.freq.minute',
  hour: 'models.form.scaling.freq.hour',
  day: 'models.form.scaling.freq.day',
  week: 'models.form.scaling.freq.week',
  month: 'models.form.scaling.freq.month',
  year: 'models.form.scaling.freq.year'
} as const;

// Classify only "clean" single-value expressions into a coarse frequency
// (once a day / week / ...). Anything with ranges, steps or lists returns null
// so we just show the cronstrue description without a frequency prefix.
const getFrequencyKey = (cron: string): keyof typeof FREQUENCY_KEYS | null => {
  const p = cron?.trim().split(/\s+/) || [];
  if (p.length !== 5) return null;
  const [min, hour, dom, month, dow] = p;
  const val = (f: string) => /^\d+$/.test(f);
  const any = (f: string) => f === '*';
  if (val(min) && val(hour) && val(dom) && val(month)) return 'year';
  if (val(min) && val(hour) && val(dom) && any(month) && any(dow))
    return 'month';
  if (val(min) && val(hour) && any(dom) && any(month) && val(dow))
    return 'week';
  if (val(min) && val(hour) && any(dom) && any(month) && any(dow)) return 'day';
  if (val(min) && any(hour) && any(dom) && any(month) && any(dow))
    return 'hour';
  if (p.every(any)) return 'minute';
  return null;
};

// Compose "frequency, time" (e.g. "Once a day, at 00:00"; "Once a week, at
// 00:00 on Sunday"). Frequency comes from the coarse classification; the
// time-of-day part is cronstrue's localized text, lowercased to read as one
// phrase. Falls back to plain cronstrue when the shape isn't a clean single one.
const readableMeaning = (
  cron: string,
  locale: string,
  intl: any
): string | null => {
  const meaning = describeCron(cron, locale);
  if (!meaning) return null;
  const freqKey = getFrequencyKey(cron);
  if (!freqKey) return meaning;
  const freq = intl.formatMessage({ id: FREQUENCY_KEYS[freqKey] });
  const lowered = meaning.charAt(0).toLowerCase() + meaning.slice(1);
  return `${freq}, ${lowered}`;
};

const formatInTimezone = (date: Date, tz: string): string => {
  try {
    // "sv-SE" yields an ISO-like "2026-07-16 08:00" rendering.
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return date.toISOString();
  }
};

// Next window occurrence [start, start+duration] for a start cron + duration.
const nextWindow = (
  cron: string,
  durationSeconds: number | null | undefined,
  tz: string
): { start: string; end: string } | null => {
  if (!cron?.trim() || !durationSeconds) return null;
  try {
    const start = CronExpressionParser.parse(cron, { tz }).next().toDate();
    const end = new Date(start.getTime() + durationSeconds * 1000);
    return {
      start: formatInTimezone(start, tz),
      end: formatInTimezone(end, tz)
    };
  } catch {
    return null;
  }
};

// ---- structured cron <-> fields ---------------------------------------------

// 'cron' is the advanced escape hatch: user hand-writes the full start cron and
// specifies the window length via an explicit duration (see below). All other
// kinds are structured presets driven by start time + end time.
type RepeatKind = 'daily' | 'weekly' | 'monthly' | 'cron';

// Monday-first weekday values (cron dow: 0=Sun..6=Sat).
const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

const weekdayLabel = (v: number, locale: string): string => {
  // 2024-01-07 is a Sunday (getUTCDay() === 0); offset to the wanted weekday.
  const d = new Date(Date.UTC(2024, 0, 7 + v));
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    timeZone: 'UTC'
  }).format(d);
};

// Short weekday name (e.g. "Mon") for the compact rule summary.
const weekdayLabelShort = (v: number, locale: string): string => {
  const d = new Date(Date.UTC(2024, 0, 7 + v));
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: 'UTC'
  }).format(d);
};

interface StructuredCron {
  repeat: RepeatKind;
  days: number[];
  hour: number;
  minute: number;
}

// Parse a start cron into structured fields; null when it isn't one of the
// simple shapes this editor produces (used only to seed initial UI state).
const parseStartCron = (cron: string): StructuredCron | null => {
  const p = cron?.trim().split(/\s+/);
  if (!p || p.length !== 5) return null;
  const [m, h, dom, mon, dow] = p;
  if (!/^\d+$/.test(m) || !/^\d+$/.test(h)) return null;
  const hour = +h;
  const minute = +m;
  if (mon !== '*') return null;
  if (dom === '*' && dow === '*')
    return { repeat: 'daily', days: [], hour, minute };
  if (dom === '*' && dow !== '*' && /^\d+(,\d+)*$/.test(dow))
    return {
      repeat: 'weekly',
      days: dow.split(',').map((x) => +x % 7),
      hour,
      minute
    };
  if (dow === '*' && dom !== '*' && /^\d+(,\d+)*$/.test(dom))
    return {
      repeat: 'monthly',
      days: dom.split(',').map(Number),
      hour,
      minute
    };
  return null;
};

const buildStartCron = (
  repeat: RepeatKind,
  days: number[],
  hour: number,
  minute: number
): string => {
  const hm = `${minute} ${hour}`;
  switch (repeat) {
    case 'daily':
      return `${hm} * * *`;
    case 'weekly':
      return `${hm} * * ${(days.length ? days : [1]).join(',')}`;
    case 'monthly':
      return `${hm} ${(days.length ? days : [1]).join(',')} * *`;
    default:
      // 'cron' mode doesn't build from structure; fall back to every day.
      return `${hm} * * *`;
  }
};

const pad2 = (n: number) => `${n}`.padStart(2, '0');
const parseTime = (v: string): { hour: number; minute: number } | null => {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(v?.trim() || '');
  return m ? { hour: +m[1], minute: +m[2] } : null;
};

// "HH:mm" <-> dayjs for the TimePicker (which works in dayjs objects). Uses
// hour/minute setters rather than format-string parsing to avoid depending on
// dayjs's customParseFormat plugin.
const toDayjs = (hhmm: string) => {
  const t = parseTime(hhmm);
  return t
    ? dayjs().hour(t.hour).minute(t.minute).second(0).millisecond(0)
    : null;
};

const MINUTES_PER_DAY = 1440;
const toMinutes = (t: { hour: number; minute: number }) =>
  t.hour * 60 + t.minute;

// Window length from start/end times (HH:mm). end <= start wraps to the next
// day (equal = a full 24h window); returns null if either time is malformed.
const durationFromTimes = (
  startText: string,
  endText: string
): number | null => {
  const s = parseTime(startText);
  const e = parseTime(endText);
  if (!s || !e) return null;
  let diff = toMinutes(e) - toMinutes(s);
  if (diff <= 0) diff += MINUTES_PER_DAY;
  return diff * 60;
};

// True when the window crosses midnight (end time lands on the next day).
const crossesMidnight = (startText: string, endText: string): boolean => {
  const s = parseTime(startText);
  const e = parseTime(endText);
  if (!s || !e) return false;
  return toMinutes(e) <= toMinutes(s);
};

// End time (HH:mm) from a start time + duration, used to seed the end-time
// input when reflecting a stored start_cron + duration_seconds.
const endTextFromDuration = (
  hour: number,
  minute: number,
  durationSeconds: number | null | undefined
): string => {
  if (!durationSeconds) return '18:00';
  const total = hour * 60 + minute + Math.round(durationSeconds / 60);
  const m = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};

type DurationUnit = 'minutes' | 'hours' | 'days';
const UNIT_SECONDS: Record<DurationUnit, number> = {
  minutes: 60,
  hours: 3600,
  days: 86400
};
const splitDuration = (
  seconds: number | null | undefined
): { value: number | null; unit: DurationUnit } => {
  if (!seconds) return { value: null, unit: 'hours' };
  if (seconds % UNIT_SECONDS.days === 0)
    return { value: seconds / UNIT_SECONDS.days, unit: 'days' };
  if (seconds % UNIT_SECONDS.hours === 0)
    return { value: seconds / UNIT_SECONDS.hours, unit: 'hours' };
  return { value: Math.round(seconds / UNIT_SECONDS.minutes), unit: 'minutes' };
};

// Compact duration text for the cron-mode summary (e.g. "9h", "45m", "2d").
const durationShort = (seconds: number | null | undefined): string => {
  const { value, unit } = splitDuration(seconds);
  if (!value) return '';
  const suffix = unit === 'minutes' ? 'm' : unit === 'hours' ? 'h' : 'd';
  return `${value}${suffix}`;
};

// -----------------------------------------------------------------------------

// Component-scoped styles (repo convention: prefer createStyles over new
// styled-components for new code). Nested class selectors match descendant
// elements exactly as before; theme tokens use the CSS variables.
const useStyles = createStyles(({ css }) => ({
  previewWrapper: css`
    margin: 0 0 4px;
    padding: 8px 12px;
    border-radius: 6px;
    background-color: var(--ant-color-fill-quaternary);
    font-size: 12px;
    line-height: 1.7;
    .meaning {
      color: var(--ant-color-text-secondary);
    }
    .next-title {
      color: var(--ant-color-text-tertiary);
      margin-top: 4px;
    }
    .next-item {
      color: var(--ant-color-text-secondary);
      font-variant-numeric: tabular-nums;
    }
    .error {
      color: var(--ant-color-error);
    }
  `,
  sectionCard: css`
    border: 1px solid var(--ant-color-border);
    border-radius: 8px;
    padding: 16px 12px 12px;
    margin-bottom: 8px;
    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      color: var(--ant-color-text);
      .title-help {
        margin-inline-start: 6px;
        color: var(--ant-color-text-tertiary);
        cursor: help;
      }
    }
    /* system-level timezone reflected once below the rules (all rules share it) */
    .tz-reflect {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 12px 0 0;
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
      cursor: help;
    }
    /* compact summary of the baseline (the top Replicas value) while enabled */
    .baseline-summary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 12px;
      font-size: 13px;
      cursor: help;
      .label {
        color: var(--ant-color-text-secondary);
      }
      .value {
        color: var(--ant-color-text);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
      .help {
        color: var(--ant-color-text-tertiary);
      }
    }
    .rules-label {
      font-size: 14px;
      color: var(--ant-color-text-tertiary);
      margin: 4px 0 12px;
    }
    .rules-hint {
      margin-top: 4px;
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
    }
    .rules-error {
      margin-top: 4px;
      font-size: 12px;
      color: var(--ant-color-error);
    }
    .rules-info {
      margin-top: 4px;
      font-size: 12px;
      color: var(--ant-color-text-tertiary);
    }
  `,
  // A rule is laid out like a Create-Cluster "Image Credential" entry: the
  // fields column on the left and a circular remove button on the right,
  // aligned with the first field's row (matching image-credential's delBtn).
  ruleRow: css`
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    .rule-body {
      flex: 1;
      min-width: 0;
    }
    .del-btn {
      width: 24px;
      margin-left: 10px;
      margin-top: 16px;
      flex: none;
    }
    /* stacked Seal fields spacing, matching the rest of the form */
    .fld {
      margin-bottom: 16px;
    }
    /* two equal columns (start time | end time, duration | unit) */
    .grid2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;
    }
    /* "+1" badge shown inside the End time field when the window crosses
       midnight (end <= start) */
    .next-day-badge {
      padding: 0 6px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      line-height: 18px;
      white-space: nowrap;
      color: var(--ant-color-warning);
      background: var(--ant-color-warning-bg);
      cursor: help;
    }
    .field-error {
      margin: 4px 0 8px;
      font-size: 12px;
      color: var(--ant-color-error);
    }
  `
}));

// One rule: structured (replicas / start time / duration / recurrence) with an
// optional raw-cron mode. Editable selections are held in local state so
// switching is immediate; on every change we write the canonical
// start_cron + duration_seconds back to the form.
const RuleEditor: React.FC<{
  name: number;
  serverTimezone?: string;
  onRemove: () => void;
  onChanged: () => void;
}> = ({ name, serverTimezone, onRemove, onChanged }) => {
  const intl = useIntl();
  const uiLocale = getLocale();
  const cronLocale = cronstrueLocaleMap[uiLocale] || 'en';
  const form = Form.useFormInstance<FormData>();
  const { styles } = useStyles();

  const path = (key: string) => ['scaling_schedule', 'rules', name, key];

  // Seed initial UI state from the form store (getFieldValue is always current
  // at mount, unlike the `rule` prop which lags a render behind Form.List).
  const initialCron: string = form.getFieldValue(path('start_cron')) || '';
  const initialParsed = useMemo(() => parseStartCron(initialCron), []);
  const initialDuration = useMemo(
    () => splitDuration(form.getFieldValue(path('duration_seconds'))),
    []
  );

  // 'cron' repeat = advanced raw-cron mode (start cron isn't one of the simple
  // structured shapes). Presets drive start_cron from start time + recurrence.
  const cronMode = !initialParsed && !!initialCron;
  const [repeat, setRepeat] = useState<RepeatKind>(
    cronMode ? 'cron' : (initialParsed?.repeat ?? 'daily')
  );
  const [days, setDays] = useState<number[]>(initialParsed?.days ?? []);
  const [timeText, setTimeText] = useState<string>(
    initialParsed
      ? `${pad2(initialParsed.hour)}:${pad2(initialParsed.minute)}`
      : '09:00'
  );
  const [endTimeText, setEndTimeText] = useState<string>(
    initialParsed
      ? endTextFromDuration(
          initialParsed.hour,
          initialParsed.minute,
          form.getFieldValue(path('duration_seconds'))
        )
      : '18:00'
  );
  // Explicit duration is only used in cron (advanced) mode; presets derive it
  // from start/end time.
  const [durationValue, setDurationValue] = useState<number | null>(
    initialDuration.value
  );
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(
    initialDuration.unit
  );
  // Canonical start_cron + replicas held locally so the inputs stay responsive
  // (a controlled value fed back through Form.useWatch on an unregistered
  // nested list field doesn't reliably re-render). We still write to the form
  // on every change for submission.
  const [cronText, setCronText] = useState<string>(initialCron);
  const [replicasVal, setReplicasVal] = useState<number | null>(
    form.getFieldValue(path('replicas')) ?? null
  );

  const setStartCron = (cron: string) => {
    setCronText(cron);
    form.setFieldValue(path('start_cron'), cron);
    onChanged();
  };

  // Recompute start_cron from the current structured selection + time.
  const writeCron = (
    nextRepeat: RepeatKind,
    nextDays: number[],
    nextTime: string
  ) => {
    const t = parseTime(nextTime);
    if (!t) return; // invalid time — keep last valid cron, show error below
    setStartCron(buildStartCron(nextRepeat, nextDays, t.hour, t.minute));
  };

  const writeDurationSeconds = (seconds: number | null) => {
    form.setFieldValue(path('duration_seconds'), seconds);
    onChanged();
  };

  // Preset window length: derived from the start/end time pair.
  const writeDurationFromTimes = (startText: string, endText: string) => {
    writeDurationSeconds(durationFromTimes(startText, endText));
  };

  // Cron mode explicit duration (value + unit).
  const writeDuration = (value: number | null, unit: DurationUnit) => {
    writeDurationSeconds(value ? value * UNIT_SECONDS[unit] : null);
  };

  const handleRepeatChange = (v: RepeatKind) => {
    if (v === 'cron') {
      // entering cron mode: seed the explicit duration from the current window
      // and keep the last built start_cron as the editable expression.
      const seconds = durationFromTimes(timeText, endTimeText);
      const split = splitDuration(seconds);
      setDurationValue(split.value);
      setDurationUnit(split.unit);
      setRepeat('cron');
      writeDurationSeconds(seconds);
      return;
    }
    // preset mode. When leaving cron mode, reseed start/end time from the
    // hand-written cron (if it parses) + the explicit duration.
    let startText = timeText;
    let endText = endTimeText;
    let nextDays = v === 'daily' ? [] : days.length ? days : [1];
    if (repeat === 'cron') {
      const p = parseStartCron(cronText);
      if (p) {
        startText = `${pad2(p.hour)}:${pad2(p.minute)}`;
        nextDays = v === 'daily' ? [] : p.days.length ? p.days : [1];
      }
      const st = parseTime(startText) || { hour: 9, minute: 0 };
      const curDuration = durationValue
        ? durationValue * UNIT_SECONDS[durationUnit]
        : null;
      endText = endTextFromDuration(st.hour, st.minute, curDuration);
    }
    setRepeat(v);
    setDays(nextDays);
    setTimeText(startText);
    setEndTimeText(endText);
    writeCron(v, nextDays, startText);
    writeDurationFromTimes(startText, endText);
  };
  const handleDaysChange = (v: number[]) => {
    setDays(v);
    writeCron(repeat, v, timeText);
  };
  const handleTimeChange = (v: string) => {
    setTimeText(v);
    writeCron(repeat, days, v);
    writeDurationFromTimes(v, endTimeText);
  };
  const handleEndTimeChange = (v: string) => {
    setEndTimeText(v);
    writeDurationFromTimes(timeText, v);
  };
  const handleDurationValue = (v: number | null) => {
    setDurationValue(v);
    writeDuration(v, durationUnit);
  };
  const handleUnitChange = (u: DurationUnit) => {
    setDurationUnit(u);
    writeDuration(durationValue, u);
  };

  const durationSeconds: number | null =
    repeat === 'cron'
      ? durationValue
        ? durationValue * UNIT_SECONDS[durationUnit]
        : null
      : durationFromTimes(timeText, endTimeText);
  const meaning = useMemo(
    () => readableMeaning(cronText, cronLocale, intl),
    [cronText, cronLocale, intl]
  );
  const tz = serverTimezone || getBrowserTimezone();
  const win = useMemo(
    () => nextWindow(cronText, durationSeconds, tz),
    [cronText, durationSeconds, tz]
  );
  // TimePicker only yields valid HH:mm, so no invalid-input state to track.
  const showCrossDay =
    repeat !== 'cron' && crossesMidnight(timeText, endTimeText);

  // One-line natural-language summary of the window, including the end time.
  // Structured presets read as "<days>, HH:mm → HH:mm (+1 day)"; cron mode
  // falls back to cronstrue's recurrence plus the explicit duration.
  const summaryText: string | null = (() => {
    if (repeat === 'cron') {
      if (!meaning) return null;
      const d = durationShort(durationSeconds);
      return d ? `${meaning} · ${d}` : meaning;
    }
    let dayPhrase: string;
    if (repeat === 'weekly') {
      const sel = WEEKDAY_VALUES.filter((v) => days.includes(v));
      dayPhrase = (sel.length ? sel : [1])
        .map((v) => weekdayLabelShort(v, uiLocale))
        .join(', ');
    } else if (repeat === 'monthly') {
      dayPhrase = intl.formatMessage(
        { id: 'models.form.scaling.summary.monthDays' },
        { days: (days.length ? days : [1]).join(', ') }
      );
    } else {
      dayPhrase = intl.formatMessage({
        id: 'models.form.scaling.repeat.daily'
      });
    }
    const suffix = showCrossDay
      ? ` (${intl.formatMessage({ id: 'models.form.scaling.nextDayBadge' })})`
      : '';
    return `${dayPhrase}, ${timeText} → ${endTimeText}${suffix}`;
  })();
  // In cron mode an unparseable expression should still surface an error.
  const showCronInvalid = repeat === 'cron' && !!cronText?.trim() && !meaning;

  const unitOptions = (['minutes', 'hours', 'days'] as DurationUnit[]).map(
    (u) => ({
      value: u,
      label: intl.formatMessage({ id: `models.form.scaling.unit.${u}` })
    })
  );
  const repeatOptions = (
    ['daily', 'weekly', 'monthly', 'cron'] as RepeatKind[]
  ).map((r) => ({
    value: r,
    label: intl.formatMessage({ id: `models.form.scaling.repeat.${r}` })
  }));
  const weekdayOptions = WEEKDAY_VALUES.map((v) => ({
    value: v,
    label: weekdayLabel(v, uiLocale)
  }));
  const monthdayOptions = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`
  }));

  return (
    <div className={styles.ruleRow}>
      <div className="rule-body">
        {/* Register the persisted rule fields with Form.List so they survive
            submit — the visible inputs are controlled by local state and write
            these via setFieldValue, but without a registered Form.Item the
            form (preserve={false}) prunes them and sends rules: []. */}
        <Form.Item name={[name, 'start_cron']} hidden noStyle>
          <input />
        </Form.Item>
        <Form.Item name={[name, 'duration_seconds']} hidden noStyle>
          <input />
        </Form.Item>
        <Form.Item name={[name, 'replicas']} hidden noStyle>
          <input />
        </Form.Item>

        {/* Replicas first, mirroring GCP's "min required instances". */}
        <div className="fld">
          <CInputNumber
            style={{ width: '100%' }}
            label={intl.formatMessage({
              id: 'models.form.scaling.windowReplicas'
            })}
            min={0}
            value={replicasVal as any}
            onChange={(v: any) => {
              setReplicasVal(v);
              form.setFieldValue(path('replicas'), v);
              onChanged();
            }}
          />
        </div>

        {/* Repeat comes before the time fields; 'cron' is one of its options. */}
        <div className="fld">
          <SealSelect
            style={{ width: '100%' }}
            label={intl.formatMessage({ id: 'models.form.scaling.repeat' })}
            value={repeat}
            options={repeatOptions}
            onChange={handleRepeatChange}
          />
        </div>

        {repeat === 'weekly' && (
          <div className="fld">
            <MultipleSelect
              mode="multiple"
              style={{ width: '100%' }}
              label={intl.formatMessage({
                id: 'models.form.scaling.weekdaysLabel'
              })}
              value={days}
              options={weekdayOptions}
              onChange={handleDaysChange}
            />
          </div>
        )}
        {repeat === 'monthly' && (
          <div className="fld">
            <MultipleSelect
              mode="multiple"
              style={{ width: '100%' }}
              label={intl.formatMessage({
                id: 'models.form.scaling.monthdaysLabel'
              })}
              value={days}
              options={monthdayOptions}
              onChange={handleDaysChange}
            />
          </div>
        )}

        {repeat === 'cron' ? (
          <>
            {/* Advanced: hand-written start cron + explicit window duration. */}
            <div className="fld">
              <CInput.Input
                label={intl.formatMessage({ id: 'models.form.scaling.cron' })}
                value={cronText}
                placeholder="0 9 * * 1-5"
                trim={false}
                onChange={(e: any) => setStartCron(e.target.value)}
              />
            </div>
            <div className="grid2">
              <CInputNumber
                style={{ width: '100%' }}
                label={intl.formatMessage({
                  id: 'models.form.scaling.duration'
                })}
                min={1}
                value={durationValue as any}
                onChange={(v: any) => handleDurationValue(v)}
              />
              <SealSelect
                style={{ width: '100%' }}
                label={intl.formatMessage({
                  id: 'models.form.scaling.durationUnit'
                })}
                value={durationUnit}
                options={unitOptions}
                onChange={handleUnitChange}
              />
            </div>
          </>
        ) : (
          <>
            {/* Start time + end time, one row (equal columns). TimePicker only
                yields valid HH:mm values, so no manual format validation. */}
            <div className="grid2">
              <TimePicker
                style={{ width: '100%' }}
                label={intl.formatMessage({
                  id: 'models.form.scaling.startTime'
                })}
                format="HH:mm"
                allowClear={false}
                value={toDayjs(timeText)}
                onChange={(d: any) =>
                  handleTimeChange(d ? d.format('HH:mm') : '')
                }
              />
              <TimePicker
                style={{ width: '100%' }}
                label={intl.formatMessage({
                  id: 'models.form.scaling.endTime'
                })}
                format="HH:mm"
                allowClear={false}
                value={toDayjs(endTimeText)}
                onChange={(d: any) =>
                  handleEndTimeChange(d ? d.format('HH:mm') : '')
                }
                // Replace the clock suffix with a "+1 day" badge when the window
                // rolls into the next day, right where the ambiguity is.
                suffixIcon={
                  showCrossDay ? (
                    <Tooltip
                      title={intl.formatMessage({
                        id: 'models.form.scaling.crossDay'
                      })}
                    >
                      <span className="next-day-badge">
                        {intl.formatMessage({
                          id: 'models.form.scaling.nextDayBadge'
                        })}
                      </span>
                    </Tooltip>
                  ) : undefined
                }
              />
            </div>
          </>
        )}

        {(summaryText || win || showCronInvalid) && (
          <div className={styles.previewWrapper}>
            {summaryText && (
              <div className="meaning">
                {intl.formatMessage({ id: 'models.form.scaling.meaning' })}:{' '}
                {summaryText}
              </div>
            )}
            {!summaryText && showCronInvalid && (
              <span className="error">
                {intl.formatMessage({ id: 'models.form.scaling.cron.invalid' })}
              </span>
            )}
            {win && (
              <>
                <div className="next-title">
                  {intl.formatMessage({ id: 'models.form.scaling.next' })}
                </div>
                <div className="next-item">
                  {win.start} → {win.end}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {/* Circular remove button on the right, like Image Credentials. */}
      <Button
        className="del-btn"
        size="small"
        shape="circle"
        type="default"
        icon={<MinusOutlined />}
        aria-label={intl.formatMessage({
          id: 'models.form.scaling.removeRule'
        })}
        title={intl.formatMessage({ id: 'models.form.scaling.removeRule' })}
        onClick={onRemove}
      />
    </div>
  );
};

// Return the start crons shared by two or more rules that ask for different
// replica counts — a genuine conflict since which one wins is order-dependent,
// unlike a plain overlap (resolved by "most recently started wins").
const startConflicts = (rules: any[]): string[] => {
  const byCron = new Map<string, Set<number>>();
  for (const r of rules || []) {
    const cron = (r?.start_cron || '').trim();
    if (!cron) continue;
    // Skip rules whose replicas isn't a number yet (e.g. mid-edit): a
    // null/undefined would count as a distinct value and falsely flag a
    // same-start conflict.
    if (typeof r?.replicas !== 'number') continue;
    if (!byCron.has(cron)) byCron.set(cron, new Set());
    byCron.get(cron)!.add(r.replicas);
  }
  return [...byCron.entries()]
    .filter(([, replicasSet]) => replicasSet.size > 1)
    .map(([cron]) => cron);
};

// Human-readable, comma-separated list of the conflicting start times.
const conflictTimesText = (crons: string[], locale: string): string =>
  crons.map((c) => describeCron(c, locale) || c).join('; ');

// Bounded overlap detection: expand each rule into [start, start+duration]
// intervals over the next ~5 weeks (capped per rule) and find rules whose
// windows intersect. Different start times only — identical starts are the
// conflict case above. This is informational: at runtime the later-starting
// window wins.
const OVERLAP_HORIZON_DAYS = 35;
const OVERLAP_MAX_OCCURRENCES = 300;

const ruleIntervals = (
  cron: string,
  durationSeconds: number,
  tz: string,
  from: Date,
  to: Date
): Array<[number, number]> => {
  const out: Array<[number, number]> = [];
  try {
    const it = CronExpressionParser.parse(cron, {
      tz,
      currentDate: from,
      endDate: to
    });
    for (let n = 0; n < OVERLAP_MAX_OCCURRENCES; n++) {
      let start: number;
      try {
        start = it.next().toDate().getTime();
      } catch {
        break; // past endDate
      }
      out.push([start, start + durationSeconds * 1000]);
    }
  } catch {
    // invalid cron — no intervals
  }
  return out;
};

// Two ascending interval lists intersect?
const intervalsIntersect = (
  a: Array<[number, number]>,
  b: Array<[number, number]>
): boolean => {
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const [as, ae] = a[i];
    const [bs, be] = b[j];
    if (as < be && bs < ae) return true;
    if (ae <= bs) i++;
    else j++;
  }
  return false;
};

const overlappingCrons = (rules: any[], tz: string): string[] => {
  const now = Date.now();
  const from = new Date(now);
  const to = new Date(now + OVERLAP_HORIZON_DAYS * 86400000);
  const items = (rules || [])
    .map((r) => ({
      cron: (r?.start_cron || '').trim(),
      dur: r?.duration_seconds as number | null | undefined
    }))
    .filter((x) => x.cron && x.dur)
    .map((x) => ({
      cron: x.cron,
      intervals: ruleIntervals(x.cron, x.dur as number, tz, from, to)
    }));

  const overlap = new Set<string>();
  for (let a = 0; a < items.length; a++) {
    for (let b = a + 1; b < items.length; b++) {
      if (items[a].cron === items[b].cron) continue; // same start = conflict
      if (intervalsIntersect(items[a].intervals, items[b].intervals)) {
        overlap.add(items[a].cron);
        overlap.add(items[b].cron);
      }
    }
  }
  return [...overlap];
};

const DEFAULT_RULE = {
  start_cron: '0 9 * * *',
  duration_seconds: 9 * 3600,
  replicas: 1,
  name: ''
};

const ScheduledScalingForm: React.FC = () => {
  const intl = useIntl();
  const form = Form.useFormInstance<FormData>();
  const { styles } = useStyles();
  const { onValuesChange } = useFormContext();
  const serverTimezone = useAtomValue(systemConfigAtom)?.timezone;
  const cronLocale = cronstrueLocaleMap[getLocale()] || 'en';
  const tz = serverTimezone || getBrowserTimezone();
  const enabled = Form.useWatch(['scaling_schedule', 'enabled'], form);
  const rules = Form.useWatch(['scaling_schedule', 'rules'], form);
  // While scheduling is on, the top Replicas field holds the baseline value.
  const baselineReplicas = Form.useWatch('replicas', form);
  const conflictCrons = enabled ? startConflicts(rules) : [];
  // Informational overlap (different start times, intersecting windows).
  const overlapCrons = useMemo(
    () => (enabled ? overlappingCrons(rules, tz) : []),
    [enabled, rules, tz]
  );

  const notifyChange = () => onValuesChange?.({}, form.getFieldsValue());

  const handleEnableToggle = (checked: boolean) => {
    if (checked) {
      const current = form.getFieldValue('scaling_schedule') || {};
      form.setFieldsValue({
        scaling_schedule: {
          enabled: true,
          // The top "Replicas" value doubles as the baseline (idle count); it
          // is written to baseline_replicas on submit.
          baseline_replicas:
            current.baseline_replicas ?? form.getFieldValue('replicas') ?? 0,
          rules:
            current.rules?.length > 0 ? current.rules : [{ ...DEFAULT_RULE }]
        }
      });
    } else {
      form.setFieldValue(['scaling_schedule', 'enabled'], false);
    }
    notifyChange();
  };

  return (
    <div className={styles.sectionCard}>
      <div className="section-title" style={{ marginBottom: enabled ? 12 : 0 }}>
        <span>
          {intl.formatMessage({ id: 'models.form.scaling' })}
          <Tooltip
            title={intl.formatMessage({
              id: 'models.form.scaling.enable.tips'
            })}
          >
            <QuestionCircleOutlined className="title-help" />
          </Tooltip>
        </span>
        <Form.Item
          noStyle
          name={['scaling_schedule', 'enabled']}
          valuePropName="checked"
        >
          <Switch
            size="small"
            onChange={handleEnableToggle}
            data-field="scaling_schedule.enabled"
          />
        </Form.Item>
      </div>

      {enabled && (
        <>
          {/* The top Replicas field doubles as the baseline while scheduling is
              on; surface its value here (explanation in the tooltip) instead of
              relabeling the field. */}
          <Tooltip
            title={intl.formatMessage({
              id: 'models.form.scaling.baselineNote'
            })}
          >
            <div className="baseline-summary">
              <span className="label">
                {intl.formatMessage({ id: 'models.form.scaling.baseline' })}:
              </span>
              <span className="value">{baselineReplicas ?? 0}</span>
              <InfoCircleOutlined className="help" />
            </div>
          </Tooltip>
          <Form.List
            name={['scaling_schedule', 'rules']}
            rules={[
              {
                validator: async (_r, value) => {
                  if (!value || value.length < 1) {
                    throw new Error(
                      intl.formatMessage({
                        id: 'models.form.scaling.rules.required'
                      })
                    );
                  }
                  const conflicts = startConflicts(value);
                  if (conflicts.length) {
                    throw new Error(
                      intl.formatMessage(
                        { id: 'models.form.scaling.conflict' },
                        { times: conflictTimesText(conflicts, cronLocale) }
                      )
                    );
                  }
                }
              }
            ]}
          >
            {(fields, { add, remove }) => (
              <>
                <div className="rules-label">
                  {intl.formatMessage({ id: 'models.form.scaling.rules' })}
                  <Tooltip
                    title={intl.formatMessage({
                      id: 'models.form.scaling.hint'
                    })}
                  >
                    <QuestionCircleOutlined
                      style={{
                        marginInlineStart: 6,
                        color: 'var(--ant-color-text-tertiary)',
                        cursor: 'help'
                      }}
                    />
                  </Tooltip>
                </div>
                {fields.map((field, i) => (
                  <Fragment key={field.key}>
                    {/* Dashed divider between rules, like Image Credentials. */}
                    {i !== 0 && (
                      <Divider variant="dashed" style={{ marginBlock: 20 }} />
                    )}
                    <RuleEditor
                      name={field.name}
                      serverTimezone={serverTimezone}
                      onRemove={() => {
                        remove(field.name);
                        notifyChange();
                      }}
                      onChanged={notifyChange}
                    />
                  </Fragment>
                ))}
                {/* Full-width filled "Add" button, matching the Image Credentials
                  / LabelSelector add action (not a dashed border). */}
                <Button
                  variant="filled"
                  color="default"
                  block
                  icon={<PlusOutlined />}
                  style={{
                    borderRadius: 'var(--border-radius-base)',
                    marginTop: 16
                  }}
                  onClick={() => add({ ...DEFAULT_RULE })}
                >
                  {intl.formatMessage({ id: 'models.form.scaling.addRule' })}
                </Button>
                {fields.length === 0 && (
                  <div className="rules-error">
                    {intl.formatMessage({
                      id: 'models.form.scaling.rules.required'
                    })}
                  </div>
                )}
                {conflictCrons.length > 0 && (
                  <div className="rules-error">
                    {intl.formatMessage(
                      { id: 'models.form.scaling.conflict' },
                      { times: conflictTimesText(conflictCrons, cronLocale) }
                    )}
                  </div>
                )}
                {overlapCrons.length > 0 && (
                  <div className="rules-info">
                    {intl.formatMessage(
                      { id: 'models.form.scaling.overlap' },
                      { times: conflictTimesText(overlapCrons, cronLocale) }
                    )}
                  </div>
                )}
              </>
            )}
          </Form.List>
          {/* Timezone is a system-wide setting shared by every rule, so reflect
              it once below the rules rather than inside each rule. */}
          <Tooltip
            title={intl.formatMessage({ id: 'models.form.scaling.tz.note' })}
          >
            <div className="tz-reflect">
              <ClockCircleOutlined />
              <span>
                {intl.formatMessage(
                  { id: 'models.form.scaling.tz.all' },
                  { tz }
                )}
              </span>
            </div>
          </Tooltip>
        </>
      )}
    </div>
  );
};

export default ScheduledScalingForm;
