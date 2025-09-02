import * as canvas from 'canvas';

export const roundRect = (
	ctx: canvas.CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
) => {
	const rr = Math.min(r, w / 2, h / 2);
	ctx.beginPath();
	ctx.moveTo(x + rr, y);
	ctx.arcTo(x + w, y, x + w, y + h, rr);
	ctx.arcTo(x + w, y + h, x, y + h, rr);
	ctx.arcTo(x, y + h, x, y, rr);
	ctx.arcTo(x, y, x + w, y, rr);
	ctx.closePath();
	ctx.fill();
};

export const wrapText = (
	ctx: canvas.CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxLines = 20,
	ellipsis = '…'
) => {
	const lines: string[] = [];
	const paragraphs = text.replace(/\r\n?/g, '\n').split('\n');

	const seg =
		typeof (Intl as any).Segmenter !== 'undefined'
			? new (Intl as any).Segmenter('pt', { granularity: 'grapheme' })
			: null;

	const splitGraphemes = (s: string) =>
		seg ? Array.from(seg.segment(s), (x: any) => x.segment) : Array.from(s);

	for (const p of paragraphs) {
		if (!p) {
			// linha vazia (parágrafo)
			lines.push('');
			continue;
		}

		const words = p.split(/(\s+)/).filter(Boolean); // inclui os espaços como tokens
		let current = '';

		const flush = () => {
			lines.push(current.trimEnd());
			current = '';
		};

		for (const token of words) {
			const test = current + token;
			if (ctx.measureText(test).width <= maxWidth) {
				current = test;
				continue;
			}

			// token sozinho já estoura? quebra por grafema
			if (ctx.measureText(token).width > maxWidth) {
				const chars = splitGraphemes(token);
				let buf = current;
				for (const ch of chars) {
					const t2 = buf + ch;
					if (ctx.measureText(t2).width <= maxWidth) {
						buf = t2;
					} else {
						lines.push(buf.trimEnd());
						buf = ch;
						if (lines.length >= maxLines) break;
					}
				}
				current = buf;
			} else {
				// fecha a linha atual e começa outra com o token
				if (current) flush();
				current = token.trimStart(); // evita começar com espaço
			}

			if (lines.length >= maxLines) break;
		}
		if (lines.length >= maxLines) break;
		if (current) flush();
	}

	// aplica reticências se excedeu maxLines
	if (lines.length > maxLines) {
		const clipped = lines.slice(0, maxLines);
		let last = clipped[clipped.length - 1];
		while (ctx.measureText(last + ellipsis).width > maxWidth && last.length > 0) {
			last = last.slice(0, -1);
		}
		clipped[clipped.length - 1] = last + ellipsis;
		return clipped;
	}

	return lines;
};

/**
 * Desenha a "setinha" do balão de mensagem.
 * @param ctx context 2D do canvas
 * @param x Posição X do canto onde a setinha encosta no balão
 * @param y Posição Y do topo da setinha
 * @param size Largura/base da setinha em px
 * @param height Altura da setinha em px
 * @param side 'left' para balão do lado esquerdo, 'right' para balão do lado direito
 * @param color Cor de preenchimento (normalmente igual à do balão)
 */
export const drawBalloonArrow = (
	ctx: canvas.CanvasRenderingContext2D,
	x: number,
	y: number,
	size: number,
	height: number,
	side: 'left' | 'right',
	color: string
) => {
	ctx.beginPath();

	if (side === 'left') {
		// Triângulo apontando para a esquerda
		ctx.moveTo(x, y); // canto superior (encostado no balão)
		ctx.lineTo(x - size, y); // ponta da seta
		ctx.lineTo(x, y + height); // canto inferior
	} else {
		// Triângulo apontando para a direita
		ctx.moveTo(x, y); // canto superior (encostado no balão)
		ctx.lineTo(x + size, y); // ponta da seta
		ctx.lineTo(x, y + height); // canto inferior
	}

	ctx.closePath();
	ctx.fillStyle = color;
	ctx.fill();
};
