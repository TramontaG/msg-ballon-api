/**
 * Shared singleton that holds the primary font family chosen at startup.
 * Using a module-level variable avoids circular imports between index.ts
 * and the canvas rendering code.
 */
let _primaryFamily = 'sans-serif';

export function setPrimaryFamily(family: string): void {
	_primaryFamily = family;
}

export function getPrimaryFamily(): string {
	return _primaryFamily;
}
