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
