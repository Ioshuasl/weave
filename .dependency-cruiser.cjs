/** Regras de arquitetura do Weave (camadas por módulo + fronteiras entre módulos). */

const MODULE = '^weave/src/(modules/components/[^/]+|modules/[^/]+)/';
const LAYER_INDEX =
  '^weave/src/modules/(components/[^/]+|[^/]+)/(domain|application|infrastructure|ui)/index\\.ts$';
const DOMAIN = '^weave/src/(modules/.+/domain|shared/domain)/';
const COMPOSITION_ROOT = '^weave/src/[^/]+\\.tsx?$';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Ciclos de dependência impedem evoluir módulos de forma independente.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      comment: 'domain não depende de framework, DOM, estado global nem de camadas externas.',
      from: { path: DOMAIN },
      to: {
        path: [
          '/(application|infrastructure|ui|hooks)/',
          '^node_modules/',
        ],
        pathNot: ['^node_modules/csstype/', '^node_modules/@types/', '^node_modules/uuid/'],
      },
    },
    {
      name: 'uuid-only-via-createId',
      severity: 'error',
      comment: 'Geração de IDs centralizada em shared/domain/id.ts.',
      from: { pathNot: '^weave/src/shared/domain/id\\.ts$' },
      to: { path: '^node_modules/uuid/' },
    },
    {
      name: 'application-not-to-ui',
      severity: 'error',
      from: { path: '/application/' },
      to: { path: '/ui/' },
    },
    {
      name: 'infrastructure-not-to-outer-layers',
      severity: 'error',
      from: { path: '/infrastructure/' },
      to: { path: '/(application|ui)/' },
    },
    {
      name: 'ui-not-to-infrastructure',
      severity: 'warn',
      comment: 'Fase 2: ui deve depender de portas em application, não de infrastructure.',
      from: { path: '/ui/' },
      to: { path: '/infrastructure/' },
    },
    {
      name: 'module-public-api-only',
      severity: 'error',
      comment: 'Entre módulos, importe apenas a API pública da camada (<modulo>/<camada>/index.ts).',
      from: { path: MODULE },
      to: {
        path: '^weave/src/modules/',
        pathNot: ['^weave/src/$1/', LAYER_INDEX],
      },
    },
    {
      name: 'composition-root-public-api-only',
      severity: 'error',
      from: { path: COMPOSITION_ROOT },
      to: { path: '^weave/src/modules/', pathNot: LAYER_INDEX },
    },
    {
      name: 'designer-is-top-level',
      severity: 'error',
      comment: 'Somente o composition root (Weave.tsx) conhece o designer.',
      from: { path: '^weave/src/', pathNot: ['^weave/src/modules/designer/', COMPOSITION_ROOT] },
      to: { path: '^weave/src/modules/designer/' },
    },
    {
      name: 'modules-not-to-composition-root',
      severity: 'error',
      from: { path: '^weave/src/(modules|shared)/' },
      to: { path: COMPOSITION_ROOT },
    },
    {
      name: 'shared-not-to-modules',
      severity: 'error',
      from: { path: '^weave/src/shared/' },
      to: { path: '^weave/src/modules/' },
    },
    {
      name: 'demo-uses-weave-public-api',
      severity: 'error',
      comment: 'O demo consome o pacote "weave" apenas pelo entry point.',
      from: { path: '^demo/' },
      to: { path: '^weave/', pathNot: ['^weave/src/index\\.ts$', '^weave/src/styles/'] },
    },
    {
      name: 'weave-not-to-demo',
      severity: 'error',
      from: { path: '^weave/' },
      to: { path: '^demo/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    combinedDependencies: false,
    preserveSymlinks: false,
  },
};
