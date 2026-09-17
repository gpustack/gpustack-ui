import SourceConfigEntry from '@/pages/_components/source-config';
import { querySourceProbe } from '@/pages/_components/source-config/probe';
import type { SourceScopeConfig } from '@/pages/_components/source-config/types';
import React from 'react';
import { providerSourceTemplate } from '../config';

// The one kind no OTA server publishes: the provider catalog is assembled from
// what this release carries and what installed extensions add, so there is no
// official file to follow and no schedule to keep. The editor still needs a
// starting point, and the server serves that baseline itself — without it, a
// document written from scratch would silently drop every provider an extension
// contributes.
const cacheProviderSourceScope: SourceScopeConfig = {
  titleKey: 'kvCache.source.manage',
  entryLabelKey: 'kvCache.source.manage',
  probe: querySourceProbe,
  slots: [
    {
      kind: 'cache-provider',
      allowFile: true,
      published: false,
      // No official address to follow, so the URL box would open empty with
      // nothing to act on; the editor is where the baseline is downloaded.
      primaryType: 'file',
      emptyHintKey: 'common.source.empty.hint.builtin',
      officialDescriptionKey: 'kvCache.source.builtin',
      contentTemplate: providerSourceTemplate
    }
  ]
};

const ProviderSourceEntry: React.FC<{ onSaved?: () => void }> = ({
  onSaved
}) => <SourceConfigEntry config={cacheProviderSourceScope} onSaved={onSaved} />;

export default ProviderSourceEntry;
