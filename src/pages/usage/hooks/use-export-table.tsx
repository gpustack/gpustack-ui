import { getGPUStackPlugin } from '@/plugins';
import { useIntl } from '@umijs/max';
import type { BreakdownFilters, UsageExportSheet } from '../config/types';
import useExportUsage from '../services/use-export-usage';
import type { BreakdownExtraTab } from '../token-tab/components/breakdown-tabs';

// The bottom tables of the Tokens tab, as export sheets. Each is an
// INDEPENDENT breakdown query over the shared filters — which is exactly what
// the `sheets` contract expresses and what a single `group_by` cannot (that
// would be one table grouped by three dimensions at once).
//
// The sheet key is the backend dimension name, not the tab key: it names the
// CSV member (`by_route.csv`) that customer scripts match on, so it must not
// follow the UI's labels.
const BUILT_IN_SHEETS: {
  key: string;
  labelId: string;
  // Users are only visible org-wide; in self scope the backend rejects
  // grouping by user (privacy), and the tab is hidden too.
  requiresAllScope?: boolean;
}[] = [
  { key: 'route', labelId: 'usage.tabs.models' },
  { key: 'user', labelId: 'usage.table.users', requiresAllScope: true },
  { key: 'api_key', labelId: 'usage.tabs.apikeys' }
];

const useExportTable = () => {
  const intl = useIntl();
  const { exporting, exportWithPreflight } = useExportUsage();

  const exportTable = async (params: {
    filters: BreakdownFilters;
    dateRange: { start_date: string; end_date: string };
    scope: string;
  }) => {
    const { filters, dateRange, scope } = params;

    // Plugin-contributed sub-tabs (the enterprise Organization breakdown) are
    // resolved through the same descriptor and visibility check the tab strip
    // uses, so the workbook always contains exactly the tables on screen —
    // previously they were missing from the export entirely.
    const extraTabs: BreakdownExtraTab[] =
      getGPUStackPlugin()?.usage?.breakdownExtraTabs ?? [];

    const sheets: UsageExportSheet[] = [
      ...BUILT_IN_SHEETS.filter(
        (sheet) => !sheet.requiresAllScope || scope === 'all'
      ).map((sheet) => ({
        key: sheet.key,
        group_by: [sheet.key],
        name: intl.formatMessage({ id: sheet.labelId })
      })),
      ...extraTabs
        .filter((tab) => (tab.isVisible ? tab.isVisible({ scope }) : true))
        .map((tab) => ({
          // A breakdown sub-tab is a grouping dimension by definition, so its
          // key doubles as `group_by`.
          key: tab.key,
          group_by: [tab.key],
          name: intl.formatMessage({ id: tab.labelId })
        }))
    ];

    await exportWithPreflight({
      start_date: dateRange.start_date,
      end_date: dateRange.end_date,
      scope,
      filters,
      sheets
    });
  };

  return { exportTable, exporting };
};

export default useExportTable;
