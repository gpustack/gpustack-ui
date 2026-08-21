import SourceConfigEntry from '@/pages/_components/source-config';
import { querySourceProbe } from '@/pages/_components/source-config/probe';
import type { SourceScopeConfig } from '@/pages/_components/source-config/types';
import React from 'react';
import { catalogSourceTemplate } from '../../config';

// The catalog is the one kind that accepts an inline file, so its custom branch
// offers Yaml File beside URL. A single kind, so the drawer shows its form
// directly rather than in a panel.
const catalogSourceScope: SourceScopeConfig = {
  titleKey: 'models.catalog.source.title',
  probe: querySourceProbe,
  slots: [
    {
      kind: 'catalog',
      allowFile: true,
      officialDescriptionKey: 'models.catalog.source.official',
      contentTemplate: catalogSourceTemplate
    }
  ]
};

const CatalogSourceEntry: React.FC<{ onSaved?: () => void }> = ({
  onSaved
}) => <SourceConfigEntry config={catalogSourceScope} onSaved={onSaved} />;

export default CatalogSourceEntry;
