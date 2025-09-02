import * as canvas from 'canvas';

/** Carrega uma imagem a partir de URL ou base64 (com ou sem prefixo data:) */
export async function loadImageFromInput(src: string): Promise<canvas.Image> {
	const isDataUrl = /^data:image\/[a-zA-Z]+;base64,/.test(src);
	const isPureBase64 = /^[A-Za-z0-9+/=\s]+$/.test(src) && src.length > 512; // heurística

	const normalized = isDataUrl
		? src
		: isPureBase64
		? `data:image/png;base64,${src.replace(/\s+/g, '')}`
		: src;

	return await canvas.loadImage(normalized);
}

/** Desenha uma imagem “coberta” no retângulo, tipo object-fit: cover */
function drawImageCover(
	ctx: canvas.CanvasRenderingContext2D,
	img: canvas.Image,
	x: number,
	y: number,
	w: number,
	h: number
) {
	const ir = img.width / img.height;
	const rr = w / h;

	let sx = 0,
		sy = 0,
		sw = img.width,
		sh = img.height;
	if (ir > rr) {
		// imagem mais “larga” => corta laterais
		const targetW = img.height * rr;
		sx = (img.width - targetW) / 2;
		sw = targetW;
	} else {
		// imagem mais “alta” => corta topo/baixo
		const targetH = img.width / rr;
		sy = (img.height - targetH) / 2;
		sh = targetH;
	}
	ctx.drawImage(img as any, sx, sy, sw, sh, x, y, w, h);
}

/** Desenha a imagem como avatar circular com opções de borda e sombra */
export function drawCircularAvatar(
	ctx: canvas.CanvasRenderingContext2D,
	img: canvas.Image,
	xCenter: number,
	yCenter: number,
	size: number,
	opts?: {
		borderColor?: string;
		borderWidth?: number; // px
		shadowBlur?: number;
		shadowColor?: string;
	}
) {
	const r = size / 2;
	const x = xCenter - r;
	const y = yCenter - r;

	// sombra (aplicada no conteúdo recortado)
	if (opts?.shadowBlur) {
		ctx.save();
		ctx.shadowBlur = opts.shadowBlur;
		ctx.shadowColor = opts.shadowColor ?? 'rgba(0,0,0,0.25)';
	}

	// máscara circular
	ctx.save();
	ctx.beginPath();
	ctx.arc(xCenter, yCenter, r, 0, Math.PI * 2);
	ctx.closePath();
	ctx.clip();

	// desenha a imagem “cover”
	drawImageCover(ctx, img, x, y, size, size);

	ctx.restore(); // sai do clip

	// borda/anel
	if (opts?.borderWidth && opts.borderWidth > 0) {
		ctx.beginPath();
		ctx.arc(xCenter, yCenter, r - opts.borderWidth / 2, 0, Math.PI * 2);
		ctx.strokeStyle = opts.borderColor ?? '#ffffff';
		ctx.lineWidth = opts.borderWidth;
		ctx.stroke();
	}

	if (opts?.shadowBlur) ctx.restore();
}

/** Fallback: desenha iniciais caso não dê para carregar a imagem */
export function drawInitialsAvatar(
	ctx: canvas.CanvasRenderingContext2D,
	initials: string,
	xCenter: number,
	yCenter: number,
	size: number,
	background = '#94a3b8',
	color = '#ffffff',
	font = 'bold 28px Arial'
) {
	const r = size / 2;
	ctx.save();
	ctx.beginPath();
	ctx.arc(xCenter, yCenter, r, 0, Math.PI * 2);
	ctx.closePath();
	ctx.fillStyle = background;
	ctx.fill();

	ctx.font = font;
	ctx.fillStyle = color;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(initials.toUpperCase(), xCenter, yCenter);
	ctx.restore();
}
