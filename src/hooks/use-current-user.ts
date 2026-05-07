import { useModel } from '@@/plugin-model';

export default function useCurrentUser() {
  const cu = useModel?.('@@initialState')?.initialState?.currentUser;
  if (!cu) return undefined;
  return {
    ...cu,
    fullName: cu.full_name ?? cu.fullName,
    isAdmin: cu.is_admin ?? cu.isAdmin
  };
}
