type UserName = {
  username?: string | null;
  full_name?: string | null;
};

export const formatUserOption = (user: UserName, fallback = '') => {
  const username = user.username?.trim();
  const fullName = user.full_name?.trim();
  const displayName = fullName || username || fallback;

  return {
    label: fullName && username ? `${fullName} [${username}]` : displayName,
    displayName,
    description: username
  };
};

type SearchOption = {
  label?: unknown;
  description?: unknown;
  data?: { description?: unknown };
};

export const matchesUserOption = (input: string, option?: SearchOption) => {
  const keyword = input.toLowerCase();
  return [option?.label, option?.description ?? option?.data?.description].some(
    (value) =>
      String(value ?? '')
        .toLowerCase()
        .includes(keyword)
  );
};
