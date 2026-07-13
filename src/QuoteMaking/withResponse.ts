import * as canvas from 'canvas';
import {
	loadImageFromInput,
	drawCircularAvatar,
	drawInitialsAvatar,
} from './Shapes/drawAvatar';
import { roundRect, wrapText, drawBalloonArrow } from './Shapes';
import { getPrimaryFamily } from '../Fonts/state';
import { drawTextWithEmoji, measureTextWithEmoji } from './Emoji';

type BubbleOptions = {
	mode?: 'normal' | 'reply';
	side?: 'left' | 'right';
	bubbleColor?: string;
	textColor?: string;
	quotedBarColor?: string;
	quotedHeaderColor?: string;
	quotedTextColor?: string;
	timeColor?: string;
	bubbleRadius?: number;
	authorColor?: string;
	authorFont?: string;
	quotedFont?: string;
	bodyFont?: string;
	timeFont?: string;
	authorToBodyGap?: number;
	width?: number;
	avatarSize?: number;
	avatarBorderColor?: string;
	avatarBorderWidth?: number;
	replyMediaSrc?: string;
};

const drawImageCover = (
	ctx: canvas.CanvasRenderingContext2D,
	img: canvas.Image,
	x: number,
	y: number,
	w: number,
	h: number
) => {
	const imageRatio = img.width / img.height;
	const rectRatio = w / h;

	let sx = 0;
	let sy = 0;
	let sw = img.width;
	let sh = img.height;

	if (imageRatio > rectRatio) {
		sw = img.height * rectRatio;
		sx = (img.width - sw) / 2;
	} else {
		sh = img.width / rectRatio;
		sy = (img.height - sh) / 2;
	}

	ctx.drawImage(img as any, sx, sy, sw, sh, x, y, w, h);
};

const drawRoundedImage = (
	ctx: canvas.CanvasRenderingContext2D,
	img: canvas.Image,
	x: number,
	y: number,
	w: number,
	h: number,
	radius: number
) => {
	ctx.save();
	ctx.beginPath();
	const rr = Math.min(radius, w / 2, h / 2);
	ctx.moveTo(x + rr, y);
	ctx.arcTo(x + w, y, x + w, y + h, rr);
	ctx.arcTo(x + w, y + h, x, y + h, rr);
	ctx.arcTo(x, y + h, x, y, rr);
	ctx.arcTo(x, y, x + w, y, rr);
	ctx.closePath();
	ctx.clip();
	drawImageCover(ctx, img, x, y, w, h);
	ctx.restore();
};

export async function createMessageBubble(
	replyAuthor: string | null, // autor do snippet se reply, senão null
	replySnippet: string | null, // texto do snippet se reply, senão null
	bodyText: string, // corpo da mensagem
	timeText: string, // horário
	msgAuthor: string, // autor da mensagem (para avatar iniciais)
	avatarSrc?: string,
	opts: BubbleOptions = {}
): Promise<Buffer> {
	const mode = opts.mode ?? 'normal';
	const side = opts.side ?? 'left';
	const width = opts.width ?? 400;
	const bubbleRadius = opts.bubbleRadius ?? 16;
	const avatarSize = opts.avatarSize ?? 80;
	const spacing = 8;

	const bubbleColor = opts.bubbleColor ?? '#111317';
	const textColor = opts.textColor ?? '#ffffff';
	const quotedBarColor = opts.quotedBarColor ?? '#22c55e';
	const quotedHeaderColor = opts.quotedHeaderColor ?? '#22c55e';
	const quotedTextColor = opts.quotedTextColor ?? '#d1d5db';
	const timeColor = opts.timeColor ?? '#9ca3af';

	const padX = 14;
	const topPad = 12;
	const bottomPad = 18;
	const betweenQuoteAndBody = 14;
	const betweenAuthorAndQuote = 16;
	const betweenBodyAndTime = 8;
	const barW = 5;
	const barGap = 8;
	const replyIndent = 18;

	const family = `"${getPrimaryFamily()}"`;
	const authorFont = opts.authorFont ?? `bold 36px ${family}`;
	const quotedFont = opts.quotedFont ?? `32px ${family}`;
	const bodyFont = opts.bodyFont ?? `32px ${family}`;
	const timeFont = opts.timeFont ?? `24px ${family}`;

	// === MEDIÇÃO ===
	const meas = canvas
		.createCanvas(1, 1)
		.getContext('2d') as canvas.CanvasRenderingContext2D;
	const bubbleX = avatarSize + spacing;
	const bubbleW = width - bubbleX;
	const textMaxW = bubbleW - padX * 2;
	const replyMaxW = textMaxW - replyIndent;

	let quotedH = 0;
	let quotedLines: string[] = [];
	let authorH = 0;
	let quotedLineH = 0;
	let quotedMedia: canvas.Image | null = null;
	let quotedMediaW = 0;
	let quotedMediaH = 0;

	const hasReplyContent = mode === 'reply' && replyAuthor && (replySnippet || opts.replyMediaSrc);

	if (hasReplyContent) {
		meas.font = authorFont;
		const aMet = meas.measureText(replyAuthor);
		authorH = Math.ceil(
			(aMet.actualBoundingBoxAscent ?? 14) + (aMet.actualBoundingBoxDescent ?? 4)
		);

		if (opts.replyMediaSrc) {
			quotedMedia = await loadImageFromInput(opts.replyMediaSrc);
			const maxMediaW = replyMaxW - barW - barGap;
			const maxMediaH = 140;
			const mediaRatio = quotedMedia.width / quotedMedia.height;
			quotedMediaW = maxMediaW;
			quotedMediaH = quotedMediaW / mediaRatio;

			if (quotedMediaH > maxMediaH) {
				quotedMediaH = maxMediaH;
				quotedMediaW = quotedMediaH * mediaRatio;
			}
		}

		meas.font = quotedFont;
		const qMet = meas.measureText('Mg');
		quotedLineH =
			Math.ceil(
				(qMet.actualBoundingBoxAscent ?? 12) + (qMet.actualBoundingBoxDescent ?? 4)
			) + 2;
		quotedLines = replySnippet
			? wrapText(meas, replySnippet, replyMaxW - barW - barGap)
			: [];
		quotedH =
			authorH +
			4 +
			(quotedMedia ? quotedMediaH + 10 : 0) +
			quotedLines.length * (quotedLineH + 5);
	}

	meas.font = bodyFont;
	const bMet = meas.measureText('Mg');
	const bodyLineH =
		Math.ceil(
			(bMet.actualBoundingBoxAscent ?? 15) + (bMet.actualBoundingBoxDescent ?? 5)
		) + 3;
	const bodyLines = wrapText(meas, bodyText, textMaxW);
	const bodyH = bodyLines.length * bodyLineH;

	meas.font = authorFont;
	const msgAuthorMet = meas.measureText(msgAuthor);
	const msgAuthorH = Math.ceil(
		(msgAuthorMet.actualBoundingBoxAscent ?? 14) +
			(msgAuthorMet.actualBoundingBoxDescent ?? 4)
	);

	meas.font = timeFont;
	const tMet = meas.measureText(timeText);
	const timeH = Math.ceil(
		(tMet.actualBoundingBoxAscent ?? 10) + (tMet.actualBoundingBoxDescent ?? 3)
	);

	const bubbleH =
		topPad +
		msgAuthorH +
		(hasReplyContent ? betweenAuthorAndQuote + quotedH + betweenQuoteAndBody : 0) +
		(!hasReplyContent ? opts?.authorToBodyGap ?? 12 : 0) +
		bodyH +
		betweenBodyAndTime +
		timeH +
		bottomPad;

	const height = Math.max(bubbleH, avatarSize);

	// === DESENHO ===
	const c = canvas.createCanvas(width, height);
	const ctx = c.getContext('2d') as canvas.CanvasRenderingContext2D;

	// avatar
	const avatarCX = avatarSize / 2;
	const avatarCY = avatarSize / 2;
	let imgLoaded = false;
	if (avatarSrc) {
		try {
			const img = await loadImageFromInput(avatarSrc);
			drawCircularAvatar(ctx, img, avatarCX, avatarCY, avatarSize, {
				borderWidth: opts.avatarBorderWidth ?? 2,
				borderColor: opts.avatarBorderColor ?? '#ffffff',
				shadowBlur: 6,
				shadowColor: 'rgba(0,0,0,0.25)',
			});
			imgLoaded = true;
		} catch {}
	}
	if (!imgLoaded) {
		const initials = msgAuthor
			.trim()
			.split(/\s+/)
			.map(w => w[0])
			.slice(0, 2)
			.join('');
		drawInitialsAvatar(ctx, initials, avatarCX, avatarCY, avatarSize);
	}

	// balão
	ctx.fillStyle = bubbleColor;
	roundRect(ctx, bubbleX, 0, bubbleW, bubbleH, bubbleRadius);

	const arrowSize = 12;
	const arrowHeight = 18;
	drawBalloonArrow(
		ctx,
		bubbleX + arrowSize,
		0,
		arrowSize * 2,
		arrowHeight * 2,
		side,
		bubbleColor
	);

	// textos
	let x = bubbleX + padX;
	let y = topPad;

	ctx.fillStyle = opts?.authorColor ?? '#128c7t';
	ctx.textBaseline = 'top';
	ctx.font = authorFont;
	// message author is a plain name — no emoji needed
	ctx.fillText(
		msgAuthor.length > 15 ? msgAuthor.slice(0, 14) + '...' : msgAuthor,
		x,
		y
	);
	y += msgAuthorH + (hasReplyContent ? betweenAuthorAndQuote : opts?.authorToBodyGap ?? 12);

	if (hasReplyContent) {
		const replyX = x + replyIndent;
		// barra
		ctx.fillStyle = quotedBarColor;
		ctx.fillRect(replyX, y, barW, quotedH + 10 + quotedLines.length);

		const qx = replyX + barW + barGap;
		ctx.font = authorFont;
		ctx.fillStyle = quotedHeaderColor;
		ctx.textBaseline = 'top';
		// reply author is a plain name — no emoji needed
		ctx.fillText(replyAuthor, qx, y);
		y += authorH + 12;

		if (quotedMedia) {
			drawRoundedImage(ctx, quotedMedia, qx, y, quotedMediaW, quotedMediaH, 8);
			y += quotedMediaH + 10;
		}

		ctx.font = quotedFont;
		ctx.fillStyle = quotedTextColor;
		for (const ln of quotedLines) {
			await drawTextWithEmoji(ctx, ln, qx, y);
			y += quotedLineH + 5;
		}

		y += betweenQuoteAndBody;
	}

	ctx.font = bodyFont;
	ctx.fillStyle = textColor;
	for (const ln of bodyLines) {
		await drawTextWithEmoji(ctx, ln, x, y);
		y += bodyLineH;
	}

	y += betweenBodyAndTime;
	ctx.font = timeFont;
	ctx.fillStyle = timeColor;
	const timeWidth = measureTextWithEmoji(ctx, timeText);
	await drawTextWithEmoji(ctx, timeText, bubbleX + bubbleW - padX - timeWidth, y - 2);

	return c.toBuffer('image/png');
}
