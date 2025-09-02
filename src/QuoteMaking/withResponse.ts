import * as canvas from 'canvas';
import {
	loadImageFromInput,
	drawCircularAvatar,
	drawInitialsAvatar,
} from './Shapes/drawAvatar';
import { roundRect, wrapText, drawBalloonArrow } from './Shapes';

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
	const padY = 24;
	const betweenQuoteAndBody = 10;
	const betweenBodyAndTime = 8;
	const barW = 5;
	const barGap = 8;

	const authorFont = opts.authorFont ?? 'bold 36px Arial';
	const quotedFont = opts.quotedFont ?? '32px Arial';
	const bodyFont = opts.bodyFont ?? '32px Arial';
	const timeFont = opts.timeFont ?? '24px Arial';

	// === MEDIÇÃO ===
	const meas = canvas
		.createCanvas(1, 1)
		.getContext('2d') as canvas.CanvasRenderingContext2D;
	const bubbleX = avatarSize + spacing;
	const bubbleW = width - bubbleX;
	const textMaxW = bubbleW - padX * 2;

	let quotedH = 0;
	let quotedLines: string[] = [];
	let authorH = 0;
	let quotedLineH = 0;

	if (mode === 'reply' && replyAuthor && replySnippet) {
		meas.font = authorFont;
		const aMet = meas.measureText(replyAuthor);
		authorH = Math.ceil(
			(aMet.actualBoundingBoxAscent ?? 14) + (aMet.actualBoundingBoxDescent ?? 4)
		);

		meas.font = quotedFont;
		const qMet = meas.measureText('Mg');
		quotedLineH =
			Math.ceil(
				(qMet.actualBoundingBoxAscent ?? 12) + (qMet.actualBoundingBoxDescent ?? 4)
			) + 2;
		quotedLines = wrapText(meas, replySnippet, textMaxW - barW - barGap);
		quotedH = authorH + 4 + quotedLines.length * (quotedLineH + 4);
	}

	meas.font = bodyFont;
	const bMet = meas.measureText('Mg');
	const bodyLineH =
		Math.ceil(
			(bMet.actualBoundingBoxAscent ?? 15) + (bMet.actualBoundingBoxDescent ?? 5)
		) + 3;
	const bodyLines = wrapText(meas, bodyText, textMaxW);
	const bodyH = bodyLines.length * bodyLineH;

	meas.font = timeFont;
	const tMet = meas.measureText(timeText);
	const timeH = Math.ceil(
		(tMet.actualBoundingBoxAscent ?? 10) + (tMet.actualBoundingBoxDescent ?? 3)
	);

	const bubbleH =
		padY +
		(mode === 'reply' ? quotedH + betweenQuoteAndBody : 0) +
		bodyH +
		betweenBodyAndTime +
		timeH +
		padY * 2;

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
	let y = padY / 2;

	if (mode === 'reply' && replyAuthor && replySnippet) {
		// barra
		ctx.fillStyle = quotedBarColor;
		ctx.fillRect(x, y, barW, quotedH + 8 + quotedLines.length);

		const qx = x + barW + barGap;
		ctx.font = authorFont;
		ctx.fillStyle = quotedHeaderColor;
		ctx.textBaseline = 'top';
		ctx.fillText(replyAuthor, qx, y);
		y += authorH + 8 + 4;

		ctx.font = quotedFont;
		ctx.fillStyle = quotedTextColor;
		for (const ln of quotedLines) {
			ctx.fillText(ln, qx, y);
			y += quotedLineH + 4;
		}

		y += betweenQuoteAndBody;
	}

	ctx.fillStyle = opts?.authorColor ?? '#128c7t';
	ctx.textBaseline = 'top';
	ctx.font = authorFont;
	ctx.fillText(
		msgAuthor.length > 15 ? msgAuthor.slice(0, 14) + '...' : msgAuthor,
		x,
		y
	);

	// avança Y pelo autor + gap
	let m = ctx.measureText(msgAuthor);
	const authorDrawnHeight =
		m.actualBoundingBoxAscent + (m.actualBoundingBoxDescent ?? 0);
	y += authorDrawnHeight + (opts?.authorToBodyGap ?? 12);

	ctx.font = bodyFont;
	ctx.fillStyle = textColor;
	for (const ln of bodyLines) {
		ctx.fillText(ln, x, y);
		y += bodyLineH;
	}

	y += betweenBodyAndTime;
	ctx.font = timeFont;
	ctx.fillStyle = timeColor;
	const timeWidth = ctx.measureText(timeText).width;
	ctx.fillText(timeText, bubbleX + bubbleW - padX - timeWidth, y);

	return c.toBuffer('image/png');
}
