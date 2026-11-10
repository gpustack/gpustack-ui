import {
  CopyButton,
  HighlightCode,
  TextAttribute,
  useCoreUIContext
} from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Descriptions, Flex, Modal, Tabs, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { useState } from 'react';
import { routerCommandExamples } from './router-command-examples';

const messagePrefix = 'models.form.roles.router.command.';
const variables = [
  { names: ['{{worker_ip}}'], description: 'workerIp' },
  { names: ['{{port}}'], description: 'port' },
  { names: ['{{ports.prometheus}}'], description: 'ports' },
  {
    names: ['prefill', 'decode'],
    description: 'peers',
    usages: [
      '{% for p in prefill %}{{p.url}} {% endfor %}',
      '{% for d in decode %}{{d.url}} {% endfor %}'
    ]
  },
  { names: ['{{p.url}}'], description: 'peerUrl' },
  { names: ['{{p.ip}}', '{{p.port}}'], description: 'peerAddress' },
  { names: ['{{p.ports.bootstrap}}'], description: 'peerPorts' },
  {
    names: ['prefill_urls', 'decode_urls'],
    description: 'urls',
    usages: ["{{prefill_urls | join(',')}}", "{{decode_urls | join(',')}}"]
  },
  { names: ['{{model_name}}'], description: 'modelName' }
];
const useStyles = createStyles(({ css }) => ({
  trigger: css`
    height: auto;
    padding: 0;
    font-size: var(--ant-font-size-sm);
  `,
  reference: css`
    .ant-descriptions-item-label {
      width: 210px;
    }
  `,
  code: css`
    border: 1px solid var(--ant-color-border-secondary);
    border-radius: var(--ant-border-radius);
    overflow: hidden;
  `
}));

/** Clickable reference with selectable, copyable examples outside the tooltip. */
const RouterCommandHelp = ({ mode }: { mode?: string }) => {
  const intl = useIntl();
  const { config } = useCoreUIContext();
  const { styles } = useStyles();
  const [open, setOpen] = useState(false);
  const text = (key: string) => intl.formatMessage({ id: messagePrefix + key });
  const managed = !!mode && mode !== 'custom';
  return (
    <>
      <Button
        type="link"
        className={styles.trigger}
        onClick={() => setOpen(true)}
      >
        {text('help')}
      </Button>
      <Modal
        open={open}
        title={text('title')}
        width={760}
        centered
        destroyOnHidden
        onCancel={() => setOpen(false)}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        footer={
          <Button onClick={() => setOpen(false)}>
            {intl.formatMessage({ id: 'common.button.close' })}
          </Button>
        }
      >
        <Typography.Paragraph type="secondary">
          {text('priority')}
        </Typography.Paragraph>
        <Tabs
          defaultActiveKey="examples"
          items={[
            {
              key: 'examples',
              label: text('examples'),
              children: (
                <Flex vertical gap="large">
                  {routerCommandExamples(mode).map((example) => (
                    <Flex key={example.key} vertical gap="small">
                      <Flex align="center" justify="space-between" gap="small">
                        <Typography.Text strong>
                          {text(
                            `example.${example.key === 'current' && !managed ? 'generic' : example.key}`
                          )}
                          {example.key === 'current' && managed && (
                            <TextAttribute>{mode}</TextAttribute>
                          )}
                        </Typography.Text>
                        <CopyButton
                          text={example.command}
                          btnText={text('copy')}
                        />
                      </Flex>
                      <Typography.Text type="secondary">
                        {text(
                          example.generic
                            ? 'example.generic.note'
                            : 'example.note'
                        )}
                      </Typography.Text>
                      <div className={styles.code}>
                        <HighlightCode
                          code={example.command}
                          lang="plaintext"
                          theme={config.theme}
                          showHeader={false}
                          copyable={false}
                          xScrollable
                          style={{ fontSize: 13, lineHeight: 1.7 }}
                        />
                      </div>
                    </Flex>
                  ))}
                </Flex>
              )
            },
            {
              key: 'variables',
              label: text('variables'),
              children: (
                <Flex vertical gap="middle">
                  <Descriptions
                    className={styles.reference}
                    column={1}
                    size="small"
                    bordered
                    items={variables.map((variable) => ({
                      key: variable.description,
                      label: (
                        <Flex vertical gap={4}>
                          {variable.names.map((name) => (
                            <Typography.Text key={name} code>
                              {name}
                            </Typography.Text>
                          ))}
                        </Flex>
                      ),
                      children: (
                        <Flex vertical gap="small">
                          <span>{text(`vars.${variable.description}`)}</span>
                          {variable.usages?.map((usage) => (
                            <Typography.Text key={usage} code>
                              {usage}
                            </Typography.Text>
                          ))}
                        </Flex>
                      )
                    }))}
                  />
                  <Typography.Text type="secondary">
                    {text('syntax')}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    {text('membership')}
                  </Typography.Text>
                </Flex>
              )
            }
          ]}
        />
      </Modal>
    </>
  );
};

export default RouterCommandHelp;
