import assert from 'node:assert/strict';
import test from 'node:test';
import { instanceDeleteMessages } from '../instance-recreation';
import {
  membershipUpdateNotice,
  membershipUpdatePolicy
} from '../pd-membership';

for (const policy of ['dynamic', 'restart', 'manual'] as const) {
  test(`catalog policy ${policy} selects its notice`, () => {
    const mode = {
      name: 'arbitrary-mode',
      display_name: 'Arbitrary',
      backends: [],
      router: { membership_update: policy }
    };
    assert.equal(membershipUpdatePolicy(mode), policy);
    assert.equal(
      membershipUpdateNotice(mode),
      `models.pd.membership.${policy}`
    );
    assert.equal(
      instanceDeleteMessages({ roles: [{}] }, mode).tip,
      policy === 'dynamic' ? undefined : `models.pd.instance.delete.${policy}`
    );
  });
}

test('a user router command requires manual peer updates even for dynamic recipes', () => {
  const mode = {
    name: 'arbitrary',
    display_name: 'Arbitrary',
    backends: [],
    router: { membership_update: 'dynamic' as const }
  };
  const roles = [{ name: 'router', run_command: 'my-router' }];
  assert.equal(membershipUpdatePolicy(mode, roles), 'manual');
  assert.equal(
    membershipUpdateNotice(mode, roles),
    'models.pd.membership.manual'
  );
  assert.equal(
    instanceDeleteMessages({ roles }, mode).tip,
    'models.pd.instance.delete.manual'
  );
});

for (const [command, expected] of [
  ['vllm-router --port {{port}}', 'manual'],
  ['  ', 'dynamic'],
  ["router --workers {{ prefill_urls | join(',') }}", 'restart'],
  ['router {% for p in prefill %}--peer {{p.url}} {% endfor %}', 'restart'],
  ['router --tag prefill_urls', 'manual'],
  ['router --prefill fixed --decode fixed', 'manual']
] as const) {
  test(`runtime command ${command} reports ${expected} membership`, () => {
    const mode = {
      name: 'vllm-nixl',
      display_name: 'NIXL',
      backends: ['vLLM'],
      router: { membership_update: 'dynamic' as const }
    };
    assert.equal(
      membershipUpdatePolicy(mode, [{ name: 'router', run_command: command }]),
      expected
    );
  });
}

test('stale configuration takes priority over automatic router recreation', () => {
  assert.equal(
    instanceDeleteMessages(
      { roles: [{}], stale: true },
      {
        name: 'arbitrary',
        display_name: 'Arbitrary',
        backends: [],
        router: { membership_update: 'restart' }
      }
    ).tip,
    'models.pd.instance.delete.stale'
  );
});

test('missing catalog policy does not promise dynamic membership', () => {
  assert.equal(
    membershipUpdatePolicy({
      name: 'older-server',
      display_name: 'Older',
      backends: []
    }),
    undefined
  );
  assert.equal(membershipUpdateNotice(undefined), undefined);
});

test('a custom PD recipe refreshes peer-dependent templates by restart', () => {
  assert.equal(
    membershipUpdatePolicy(
      {
        name: 'custom',
        display_name: 'Custom',
        backends: [],
        router: { membership_update: 'manual' }
      },
      [
        {
          name: 'router',
          run_command: "router --workers {{decode_urls | join(',')}}"
        }
      ]
    ),
    'restart'
  );
});

test('membership refresh states show a localized router progress notice', async () => {
  const { routerMembershipUpdating } = await import('../pd-membership');
  assert.equal(
    routerMembershipUpdating(
      'waiting for upstream registration; router membership changed; rebuilding router'
    ),
    true
  );
  assert.equal(
    routerMembershipUpdating(
      'roles not ready: router; waiting for router startup after membership update'
    ),
    true
  );
  assert.equal(
    routerMembershipUpdating(
      'router membership changed; restart the deployment to apply configuration'
    ),
    false
  );
  assert.equal(routerMembershipUpdating(undefined), false);
});

for (const modeName of ['custom', 'vllm-nixl']) {
  test(`${modeName} uses the selected backend command for membership`, () => {
    const mode = {
      name: modeName,
      display_name: 'PD',
      backends: [],
      router: { membership_update: 'dynamic' as const }
    };
    const roles = [{ name: 'router', backend: 'router-custom' }];
    const definition = {
      value: 'router-custom',
      default_run_command: "router --peers {{decode_urls | join(',')}}"
    };
    assert.equal(membershipUpdatePolicy(mode, roles, definition), 'restart');
    assert.equal(
      membershipUpdatePolicy(mode, roles, {
        ...definition,
        default_run_command: 'static-router'
      }),
      'manual'
    );
    assert.equal(
      membershipUpdatePolicy(
        mode,
        [{ ...roles[0], run_command: 'own-router' }],
        definition
      ),
      'manual'
    );
    assert.equal(membershipUpdatePolicy(mode, roles), undefined);
    assert.equal(
      membershipUpdatePolicy(mode, [{ name: 'router' }], definition),
      'dynamic'
    );
  });
}
