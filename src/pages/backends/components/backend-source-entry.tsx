import SourceConfigEntry from '@/pages/_components/source-config';
import { querySourceProbe } from '@/pages/_components/source-config/probe';
import type { SourceScopeConfig } from '@/pages/_components/source-config/types';
import React from 'react';

// Two URL-only kinds of content, each with its own official source and its own
// configuration: the built-in backend versions and the community backend
// library. They stack as panels that expand independently — configuring one
// says nothing about the other. Built-in is the first (open) panel.
const backendSourceScope: SourceScopeConfig = {
  titleKey: 'backend.source.title',
  probe: querySourceProbe,
  slots: [
    {
      kind: 'built_in_backend',
      titleKey: 'backend.source.builtin.title',
      allowFile: false,
      officialDescriptionKey: 'backend.source.builtin.official'
    },
    {
      kind: 'community_backend',
      titleKey: 'backend.source.community.title',
      allowFile: false,
      officialDescriptionKey: 'backend.source.community.official'
    }
  ]
};

const BackendSourceEntry: React.FC<{ onSaved?: () => void }> = ({
  onSaved
}) => <SourceConfigEntry config={backendSourceScope} onSaved={onSaved} />;

export default BackendSourceEntry;
