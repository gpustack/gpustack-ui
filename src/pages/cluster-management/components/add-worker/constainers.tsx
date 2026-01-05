import styled from 'styled-components';

export const Title = styled.div`
  font-weight: 500;
`;

export const ConfigWrapper = styled.div`
  padding: 12px 16px;
  margin-bottom: 16px;
  border: 1px solid var(--ant-color-split);
  border-radius: var(--ant-border-radius);
  background-color: var(--ant-color-fill-tertiary);
  background: var(--ant-color-info-bg);
  border: var(--ant-line-width) var(--ant-line-type)
    var(--ant-color-info-border);
  .config-content {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .label {
      color: var(--ant-color-text);
    }
  }
`;

export const SwitchWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  border: 1px solid var(--ant-color-border);
  padding: 12px;
  gap: 8px;
  .tips {
    color: var(--ant-color-text-secondary);
  }
  .button {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

export const Tips = styled.div`
  margin-top: 0px;
  color: var(--ant-color-text-tertiary);
`;

export const NotesWrapper = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 400;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1.25;
  li {
    margin-left: 0px !important;
  }
`;

export const Container = styled.div`
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  .command-info {
    margin-bottom: 8px;
  }
`;

export const Content = styled.div`
  margin-top: 16px;
`;
