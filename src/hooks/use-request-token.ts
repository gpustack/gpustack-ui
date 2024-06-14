import axiso from 'axios';

export default function useRequestToken() {
  const { source } = axiso.CancelToken;
  return source;
}
