import * as canvas from 'canvas';
import * as https from 'https';
import * as http from 'http';

// ---------------------------------------------------------------------------
// Emoji detection & segmentation
// ---------------------------------------------------------------------------

/**
 * Regex that matches a single emoji grapheme cluster (including ZWJ sequences,
 * variation selectors, skin-tone modifiers, keycaps, flags, etc.).
 */
const EMOJI_REGEX =
	/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F(?:\u20E3)?|(?:\p{Regional_Indicator}){2}|[\u{1F1E0}-\u{1F1FF}][\u{1F1E0}-\u{1F1FF}]|(?:\p{Emoji}(?:\u200D\p{Emoji})+\uFE0F?)/gu;

export type TextSegment =
	| { kind: 'text'; value: string }
	| { kind: 'emoji'; value: string };

/**
 * Splits a string into alternating text / emoji segments.
 */
export function splitIntoSegments(text: string): TextSegment[] {
	const segments: TextSegment[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(EMOJI_REGEX)) {
		const start = match.index!;
		if (start > lastIndex) {
			segments.push({ kind: 'text', value: text.slice(lastIndex, start) });
		}
		segments.push({ kind: 'emoji', value: match[0] });
		lastIndex = start + match[0].length;
	}

	if (lastIndex < text.length) {
		segments.push({ kind: 'text', value: text.slice(lastIndex) });
	}

	return segments;
}

/**
 * Returns true if the string contains at least one emoji character.
 */
export function hasEmoji(text: string): boolean {
	EMOJI_REGEX.lastIndex = 0;
	return EMOJI_REGEX.test(text);
}

// ---------------------------------------------------------------------------
// Twemoji image fetching with in-memory cache
// ---------------------------------------------------------------------------

const imageCache = new Map<string, canvas.Image>();

/**
 * Converts an emoji string to its Twemoji CDN URL.
 * Uses the standard codepoint-based SVG/PNG approach.
 */
function emojiToTwemojiUrl(emoji: string): string {
	// Build the codepoint sequence (skip VS-16 \uFE0F for the key lookup)
	const codepoints = [...emoji]
		.map(ch => ch.codePointAt(0)!.toString(16))
		.filter(cp => cp !== 'fe0f') // strip variation selector
		.join('-');

	return `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15/assets/72x72/${codepoints}.png`;
}

function fetchImage(url: string): Promise<canvas.Image> {
	return new Promise((resolve, reject) => {
		const protocol = url.startsWith('https') ? https : http;
		protocol
			.get(url, res => {
				if (res.statusCode !== 200) {
					res.resume();
					return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
				}
				const chunks: Buffer[] = [];
				res.on('data', (chunk: Buffer) => chunks.push(chunk));
				res.on('end', () => {
					const buf = Buffer.concat(chunks);
					const img = new canvas.Image();
					img.onload = () => resolve(img);
					img.onerror = reject;
					img.src = buf;
				});
			})
			.on('error', reject);
	});
}

/**
 * Loads the Twemoji image for the given emoji string.
 * Results are cached in memory for the lifetime of the process.
 * Returns null if the image cannot be loaded (emoji will be skipped).
 */
export async function loadEmojiImage(emoji: string): Promise<canvas.Image | null> {
	if (imageCache.has(emoji)) {
		return imageCache.get(emoji)!;
	}

	const url = emojiToTwemojiUrl(emoji);
	try {
		const img = await fetchImage(url);
		imageCache.set(emoji, img);
		return img;
	} catch {
		// Cache a null sentinel so we don't hammer the CDN
		imageCache.set(emoji, null as unknown as canvas.Image);
		return null;
	}
}

// ---------------------------------------------------------------------------
// Measurement helpers
// ---------------------------------------------------------------------------

/**
 * Returns the rendered width of a text string that may contain emojis.
 * Emojis are treated as a square glyph whose side equals the current font size.
 */
export function measureTextWithEmoji(
	ctx: canvas.CanvasRenderingContext2D,
	text: string
): number {
	const emojiSize = getFontSize(ctx.font);
	const segments = splitIntoSegments(text);
	let w = 0;
	for (const seg of segments) {
		if (seg.kind === 'emoji') {
			w += emojiSize;
		} else {
			w += ctx.measureText(seg.value).width;
		}
	}
	return w;
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

/**
 * Draws a single line of text (which may contain emojis) on the canvas.
 * Emoji images are loaded lazily and drawn at `emojiSize × emojiSize`.
 *
 * @param ctx    Canvas 2D context (font, fillStyle, textBaseline must already be set)
 * @param text   The string to draw (may contain emojis)
 * @param x      Left edge
 * @param y      Top/baseline edge (respects ctx.textBaseline)
 */
export async function drawTextWithEmoji(
	ctx: canvas.CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number
): Promise<void> {
	const emojiSize = getFontSize(ctx.font);
	const segments = splitIntoSegments(text);

	// Pre-load all emoji images in parallel
	const emojiSegments = segments.filter(s => s.kind === 'emoji');
	await Promise.all(emojiSegments.map(s => loadEmojiImage(s.value)));

	// Measure the line height from a reference character to align emoji vertically
	const refMetrics = ctx.measureText('Mg');
	const lineTop = computeLineTop(ctx, y, refMetrics);
	const lineHeight =
		(refMetrics.actualBoundingBoxAscent ?? emojiSize * 0.8) +
		(refMetrics.actualBoundingBoxDescent ?? emojiSize * 0.2);

	let cx = x;
	for (const seg of segments) {
		if (seg.kind === 'text') {
			ctx.fillText(seg.value, cx, y);
			cx += ctx.measureText(seg.value).width;
		} else {
			const img = imageCache.get(seg.value);
			if (img) {
				// Center the emoji image within the line's bounding box
				const imgY = lineTop + (lineHeight - emojiSize) / 2;
				ctx.drawImage(img, cx, imgY, emojiSize, emojiSize);
			}
			cx += emojiSize;
		}
	}
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the numeric font-size (in px) from a canvas font string like
 * "bold 32px MyFont". Falls back to 16 if parsing fails.
 */
function getFontSize(font: string): number {
	const m = font.match(/(\d+(?:\.\d+)?)px/);
	return m ? parseFloat(m[1]) : 16;
}

/**
 * Returns the Y coordinate of the top of the text's bounding box given the
 * current textBaseline and the measured ascent/descent of a reference string.
 *
 * This is used to place an emoji image so its top-left aligns with the top of
 * the text's ink, regardless of which textBaseline is active.
 */
function computeLineTop(
	ctx: canvas.CanvasRenderingContext2D,
	y: number,
	metrics: canvas.TextMetrics
): number {
	const ascent = metrics.actualBoundingBoxAscent ?? 0;
	const descent = metrics.actualBoundingBoxDescent ?? 0;
	const lineHeight = ascent + descent;

	const baseline = ctx.textBaseline as string;
	if (baseline === 'top' || baseline === 'hanging') {
		return y;
	}
	if (baseline === 'middle') {
		return y - lineHeight / 2;
	}
	// 'alphabetic' | 'ideographic' | 'bottom'
	return y - ascent;
}
