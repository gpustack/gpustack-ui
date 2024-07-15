export default (initialState: { currentUser?: Global.UserInfo }) => {
  const canSeeAdmin = !!(
    initialState &&
    initialState.currentUser &&
    initialState.currentUser.is_admin
  );
  return {
    canSeeAdmin,
    canDelete: true,
    canLogin: true
  };
};
