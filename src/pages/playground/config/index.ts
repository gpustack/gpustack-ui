export const Roles = {
  User: 'user',
  Assistant: 'assistant',
  System: 'system'
};
export const playGroundRoles = [
  {
    key: Roles.User,
    label: 'playground.user'
  },
  {
    key: Roles.Assistant,
    label: 'playground.assitant'
  }
];

export const formatMessageParams = (messageList: any[]) => {
  const result: any[] = [];

  messageList.forEach((item) => {
    const { role, content, title, imgs, uid } = item;
    content?.forEach((contentItem: any) => {
      if (contentItem.type === 'text') {
        result.push({
          role,
          content: contentItem.text
        });
      }
      if (contentItem.type === 'image_url') {
        result.push({
          role,
          content: [
            {
              ...contentItem
            }
          ]
        });
      }
    });
  });
  return result;
};
