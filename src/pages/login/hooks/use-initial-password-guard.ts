import { INITIAL_PASSWORD_KEY, USER_INFO_KEY, userAtom } from '@/atoms/user';
import { clearAtomStorage, nsSessionJSONStorage } from '@/atoms/utils';
import { nsLocalJSONStorage } from '@gpustack/core-ui/utils';
import { useEffect, useState } from 'react';
import { logout } from '../apis';

/**
 * Escape hatch for a forced password change the UI can no longer finish.
 *
 * `require_password_change` rides on `userAtom` (localStorage) while the
 * initial password only lives in the tab that logged in
 * (`sessionStorage`), so opening the UI in a *new* tab mid-flow renders a
 * change form with no `current_password` to submit: the backend answers
 * "Incorrect current password" on every attempt, and the layout redirect
 * pins the user to `/login` with no route back to the login form.
 * Nothing in the UI can recover the credential, so end the session and
 * let the user log in again.
 *
 * Deliberately decided ONCE, from storage, at mount — not from the atoms
 * on every render. The state it detects can only be inherited from a
 * previous page load; nothing that happens while this page is alive can
 * legitimately create it. Watching the atoms instead means every
 * intermediate render during login is a chance to misfire — logging in
 * writes `require_password_change` (via `fetchUserInfo` → `app.tsx`) and
 * the credential (via `useLocalAuth`) in two separate steps, and any
 * order change between them would strand the user on the login form.
 * A one-shot boot check has no such window.
 *
 * Storage is read directly because `userAtom` has no `getOnInit`: at
 * first render it is still `null` whatever localStorage holds.
 *
 * Returns whether the session is unrecoverable, so the caller can render
 * the login form straight away instead of flashing a dead change form
 * for the length of the logout round-trip.
 */
export const useInitialPasswordGuard = (): boolean => {
  const [credentialLost, setCredentialLost] = useState(() => {
    const storedUser = nsLocalJSONStorage.getItem(USER_INFO_KEY, null);
    const storedPassword = nsSessionJSONStorage.getItem(
      INITIAL_PASSWORD_KEY,
      ''
    );
    return !!storedUser?.require_password_change && !storedPassword;
  });

  useEffect(() => {
    if (!credentialLost) {
      return;
    }
    // `logout` clears `userAtom`, and that is what releases the layout
    // redirect and swaps this page back to the login form.
    logout()
      .catch(() => {
        // Server-side logout failed (offline, 5xx). Drop the local
        // identity anyway — keeping it just re-renders the dead form.
        clearAtomStorage(userAtom);
      })
      .finally(() => {
        // Hand the render branch back to `userInfo`: the identity is
        // gone, so it resolves to the login form on its own, and a login
        // in this same page load must not be second-guessed.
        setCredentialLost(false);
      });
    // Boot check — runs once, never re-armed for this page load.
  }, []);

  return credentialLost;
};
