import { queryUserDirectory } from '@/pages/users/apis';
import { useEffect, useState } from 'react';

// Module-level cache: the directory is fetched once per app session and
// shared by every consumer (owner columns on the Instances / Public Keys /
// Storage tables, the template owner tags, the create-instance template
// picker). A failed fetch clears the cache so the next consumer retries.
let directoryPromise: Promise<Map<number, string>> | null = null;

const fetchDirectory = (): Promise<Map<number, string>> => {
  directoryPromise ??= queryUserDirectory({ page: -1 })
    .then(
      (res) =>
        new Map(
          (res.items || [])
            .filter((u) => u.id != null)
            .map((u) => [u.id as number, u.username])
        )
    )
    .catch((error) => {
      directoryPromise = null;
      throw error;
    });
  return directoryPromise;
};

/**
 * id → username map of all users, for resolving `owner_principal_id`
 * to a display name (a USER principal's id IS the user's id).
 *
 * Only fetches when `enabled` — callers gate on platform admin, since
 * `/user-directory` 403s for regular users (who only ever see their
 * own resources anyway). Returns an empty map until loaded.
 */
export default function useUserDirectory(enabled: boolean) {
  const [users, setUsers] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    fetchDirectory()
      .then((map) => {
        if (alive) setUsers(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);

  return users;
}
