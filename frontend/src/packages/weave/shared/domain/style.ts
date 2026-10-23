import type { Properties } from 'csstype';

/** Declaração de estilo CSS independente de framework (mesma base de `React.CSSProperties`) */
export type StyleDeclaration = Properties<string | number>;
