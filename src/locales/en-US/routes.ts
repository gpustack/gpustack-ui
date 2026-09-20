export default {
  'routes.title': 'Routes',
  'routes.button.add': 'Add Route',
  'routes.table.routeTargets': 'Route Targets',
  'routes.table.traffic': 'Traffic Share',
  'routes.table.setAsFallback': 'Set as Fallback',
  'routes.form.target.title': 'Route Targets',
  'routes.form.target.add': 'Add Route Target',
  'routes.form.target.advanced': 'Advanced',
  'routes.form.target.fallback': 'Fallback Route Target',
  'routes.form.target.weight': 'Weight',
  'routes.form.target.moveUp': 'Move up',
  'routes.form.target.moveDown': 'Move down',
  'routes.form.target.remove': 'Remove',
  'routes.form.target.model': 'Model',
  'routes.form.metadata.title': 'Metadata',
  'routes.form.metadata.add': 'Add Metadata',
  'routes.table.label.fallback': 'Fallback',
  'routes.form.metadata.size': 'Size',
  'routes.form.metadata.activeSize': 'Active Size',
  'routes.form.metadata.tags': 'Tags',
  'routes.form.metadata.maxTokens': 'Max Tokens',
  'routes.form.metadata.dimension': 'Dimensions',
  'routes.form.metadata.license': 'Licenses',
  'routes.form.metadata.releaseDate': 'Release Date',
  'routes.form.metadata.languages': 'Languages',
  'routes.form.metadata.icons': 'Icon',
  'routes.form.metadata.uploadIcon': 'Upload Icon',
  'routes.form.fallback.warning':
    'Changes to fallback route target take effect after one minute.',
  'routes.form.weight.tips': 'Target traffic weight.',
  'routes.lb.routeBy': 'Route By',
  'routes.table.lbMode': 'Route By',
  'routes.lb.mode.weighted': 'Target Weight',
  'routes.lb.mode.policy': 'Policy',
  // Form-mode labels live apart from the list badges: the form asks for the
  // user's intent (routing method), the list shows the server-derived result
  // (weighted / policy / invalid).
  'routes.lb.form.mode.weighted': 'Target Weight',
  'routes.lb.form.mode.policy': 'Policy',
  'routes.lb.form.mode.weighted.tips':
    'Split traffic across targets by weight; every target must have a weight greater than 0.',
  'routes.lb.form.mode.policy.tips':
    'Targets are picked by the enabled policy plugins (Policy), or round-robin when none is enabled.',
  'routes.lb.mode.invalid': 'Invalid',
  'routes.lb.mode.invalid.tooltip':
    'Mixed weights detected: this route is unavailable — the gateway refuses to serve it. Set every target weight to >0, or all to 0.',
  'routes.lb.sessionAffinity': 'Session Affinity',
  'routes.lb.sessionAffinity.tips':
    'Route requests of the same session to the same target; sessions are identified by an ordered key chain (header or body key).',
  'routes.lb.sessionKeys': 'Session Keys (Ordered, First Match Wins)',
  'routes.lb.sessionKeys.source.header': 'Header',
  'routes.lb.sessionKeys.source.bodyKey': 'Body Key',
  'routes.lb.sessionKeys.keyPlaceholder': 'Key name, e.g. session-id',
  'routes.lb.sessionKeys.add': 'Add session key',
  'routes.lb.sessionKeys.required':
    'At least one session key is required when session affinity is enabled',
  'routes.lb.sessionKeys.keyRequired': 'Please enter a key name',
  'routes.lb.leastLoad': 'Least Inflight Request',
  'routes.lb.leastLoad.tips':
    'Score targets by their number of inflight requests and prefer routing requests to the target with the fewest inflight requests.',
  'routes.lb.influence': 'Weight',
  'routes.lb.weight.mixed':
    'Weighted mode requires every target to have a weight greater than 0. To use policy routing, switch the LB mode.',
  'routes.form.target.maxRunningRequests': 'Max Inflight Request per Instance'
};
