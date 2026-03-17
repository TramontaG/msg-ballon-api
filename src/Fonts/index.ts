import * as canvas from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { setPrimaryFamily } from './state';

type FontVariant = {
	weight: 'normal' | 'bold';
	style: 'normal' | 'italic';
};

/**
 * Derives canvas font weight/style from the filename variant suffix.
 * e.g. "MyFont-BoldItalic.ttf" → { weight: 'bold', style: 'italic' }
 */
function variantFromFilename(filename: string): FontVariant {
	const base = path.basename(filename, path.extname(filename)).toLowerCase();
	const bold = base.endsWith('-bold') || base.endsWith('-bolditalic');
	const italic = base.endsWith('-italic') || base.endsWith('-bolditalic');
	return {
		weight: bold ? 'bold' : 'normal',
		style: italic ? 'italic' : 'normal',
	};
}

/**
 * Derives the font family name from the filename.
 * e.g. "MyFont-Bold.ttf" → "MyFont"
 */
function familyFromFilename(filename: string): string {
	const base = path.basename(filename, path.extname(filename));
	const dashIdx = base.lastIndexOf('-');
	return dashIdx > 0 ? base.slice(0, dashIdx) : base;
}

/**
 * Scans the project-level /fonts directory and registers every .ttf/.otf file
 * found there with the canvas renderer.
 *
 * Returns the list of family names that were registered.
 */
function loadCustomFonts(fontsDir: string): string[] {
	const families = new Set<string>();

	if (!fs.existsSync(fontsDir)) {
		return [];
	}

	const files = fs.readdirSync(fontsDir).filter(f => /\.(ttf|otf)$/i.test(f));

	for (const file of files) {
		const fullPath = path.join(fontsDir, file);
		const family = familyFromFilename(file);
		const { weight, style } = variantFromFilename(file);

		try {
			canvas.registerFont(fullPath, { family, weight, style });
			families.add(family);
			console.log(`[fonts] Registered custom font: ${family} (${weight} ${style}) from ${file}`);
		} catch (e) {
			console.warn(`[fonts] Failed to register ${file}:`, e);
		}
	}

	return [...families];
}

/**
 * Registers the system Noto Sans fonts as a fallback.
 * Returns the family name if successful, null otherwise.
 */
function loadSystemFallback(): string | null {
	const notoBase = '/usr/share/fonts/truetype/noto';
	const variants: Array<{ file: string; weight: 'normal' | 'bold'; style: 'normal' | 'italic' }> = [
		{ file: 'NotoSans-Regular.ttf',    weight: 'normal', style: 'normal' },
		{ file: 'NotoSans-Bold.ttf',       weight: 'bold',   style: 'normal' },
		{ file: 'NotoSans-Italic.ttf',     weight: 'normal', style: 'italic' },
		{ file: 'NotoSans-BoldItalic.ttf', weight: 'bold',   style: 'italic' },
	];

	let anyLoaded = false;
	for (const { file, weight, style } of variants) {
		const fullPath = path.join(notoBase, file);
		if (fs.existsSync(fullPath)) {
			try {
				canvas.registerFont(fullPath, { family: 'Noto Sans', weight, style });
				anyLoaded = true;
			} catch (e) {
				console.warn(`[fonts] Could not register system font ${file}:`, e);
			}
		}
	}

	if (anyLoaded) {
		console.log('[fonts] Loaded system fallback: Noto Sans');
		return 'Noto Sans';
	}

	return null;
}

export type FontSetup = {
	/** The primary font family to use in canvas font strings */
	primaryFamily: string;
	/** All families that were successfully registered */
	registeredFamilies: string[];
};

/**
 * Initialises fonts for the canvas renderer.
 *
 * Priority:
 * 1. Custom fonts from <projectRoot>/fonts/ — first family found becomes primary
 * 2. System Noto Sans as fallback
 * 3. "sans-serif" as last resort (relies on OS defaults)
 */
export function setupFonts(projectRoot: string): FontSetup {
	const fontsDir = path.join(projectRoot, 'fonts');
	const customFamilies = loadCustomFonts(fontsDir);

	if (customFamilies.length > 0) {
		console.log(`[fonts] Using custom font as primary: "${customFamilies[0]}"`);
		setPrimaryFamily(customFamilies[0]);
		return { primaryFamily: customFamilies[0], registeredFamilies: customFamilies };
	}

	const fallback = loadSystemFallback();
	if (fallback) {
		setPrimaryFamily(fallback);
		return { primaryFamily: fallback, registeredFamilies: [fallback] };
	}

	console.warn('[fonts] No fonts loaded — falling back to OS sans-serif');
	setPrimaryFamily('sans-serif');
	return { primaryFamily: 'sans-serif', registeredFamilies: [] };
}
