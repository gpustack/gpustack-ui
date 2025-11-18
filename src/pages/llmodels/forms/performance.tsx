import React from 'react';

import KVCacheForm from './kv-cache';
import SpeculativeDecode from './speculative-decode';

const Performance: React.FC = () => {
  return (
    <>
      <div data-field="extended_kv_cache.enabled"></div>

      <KVCacheForm></KVCacheForm>
      <SpeculativeDecode></SpeculativeDecode>
    </>
  );
};

export default Performance;
