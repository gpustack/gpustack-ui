import { Form } from 'antd';
import { useFormContext } from '../config/form-context';
import { routerCommandSource } from '../utils/pd-router-command';

/** Resolve Router help from the role's own launch configuration. */
export default function useRouterCommandHelp(namePrefix?: (string | number)[]) {
  const form = Form.useFormInstance();
  const { flatBackendOptions = [] } = useFormContext();
  const mode = Form.useWatch(['disaggregation', 'mode'], {
    form,
    preserve: true
  });
  const roles = Form.useWatch('roles', { form, preserve: true });
  if (!namePrefix || form.getFieldValue([...namePrefix, 'name']) !== 'router') {
    return null;
  }
  const role =
    roles?.[namePrefix[1] as number] || form.getFieldValue(namePrefix);
  const definition = flatBackendOptions.find(
    (item) => item.value === role?.backend
  );
  const launch = routerCommandSource(role, definition);
  const fallback = routerCommandSource(
    { ...role, run_command: null },
    definition
  );
  const managed = !!mode && mode !== 'custom';
  return {
    mode,
    managed,
    ...launch,
    source: launch.source === 'recipe' && !managed ? 'missing' : launch.source,
    required: !managed && !fallback.command
  };
}
