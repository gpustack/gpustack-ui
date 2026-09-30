type Props = {
  label: React.ReactNode;
  displayName?: React.ReactNode;
  description?: string;
};

const UserOptionContent: React.FC<Props> = ({
  label,
  displayName,
  description
}) => {
  const primaryText = displayName ?? label;
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      {primaryText}
      {description && description !== primaryText && (
        <span
          style={{
            fontSize: 'var(--ant-font-size-sm)',
            color: 'var(--ant-color-text-tertiary)',
            marginInlineStart: 4
          }}
        >
          [{description}]
        </span>
      )}
    </span>
  );
};

export default UserOptionContent;

export const renderUserOption = (option: any) => (
  <UserOptionContent
    label={option.label}
    displayName={option.data?.displayName}
    description={option.data?.description}
  />
);
