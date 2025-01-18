// broadcast channel hook

import { useEffect, useRef } from 'react';

export const useBroadcast = () => {
  const broadcastChannel = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastChannel.current = new BroadcastChannel('broadcast_channel');

    return () => {
      broadcastChannel.current?.close();
      console.log('broadcast channel closed');
    };
  }, []);

  return { broadcastChannel };
};
