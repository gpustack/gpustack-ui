import SourceConfigEntry from '@/pages/_components/source-config';
import { querySourceProbe } from '@/pages/_components/source-config/probe';
import type { SourceScopeConfig } from '@/pages/_components/source-config/types';
import React from 'react';

// Two URL-only kinds of content, each with its own official source and its own
// configuration: the built-in backend versions and the community backend
// library. They sit behind a tab bar — configuring one says nothing about the
// other. Built-in is the tab that opens.
const backendSourceScope: SourceScopeConfig = {
  titleKey: 'backend.source.title',
  probe: querySourceProbe,
  slots: [
    {
      kind: 'built-in-backend',
      titleKey: 'backend.source.builtin.title',
      // What this kind is a list of: the image versions the built-in backends
      // are published at.
      iconType: 'icon-version',
      allowFile: false,
      officialDescriptionKey: 'backend.source.builtin.official'
    },
    {
      kind: 'community-backend',
      titleKey: 'backend.source.community.title',
      // The same icon the Add menu marks a community backend with
      // (`hooks/use-create-backend.tsx`).
      iconType: 'icon-public',
      allowFile: false,
      officialDescriptionKey: 'backend.source.community.official'
    }
  ]
};

const BackendSourceEntry: React.FC<{ onSaved?: () => void }> = ({
  onSaved
}) => <SourceConfigEntry config={backendSourceScope} onSaved={onSaved} />;

export default BackendSourceEntry;
