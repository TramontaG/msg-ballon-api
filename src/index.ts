import express from 'express';
import { createMessageBubble } from './QuoteMaking/withResponse';
import { payloadSchema, resolveStyle } from './Validation';
const app = express();
const PORT = process.env.PORT || 3699;

const avatarSrc = 'https://randomuser.me/api/portraits/women/31.jpg';

app.get('/status', (req, res) => {
	res.send('Server is running');
});

app.use(
	express.json({
		limit: '5mb',
		type: ['application/json', 'application/*+json', 'text/json'],
	})
);

app.post('/render', async (req, res, next) => {
	try {
		const parsed = payloadSchema.safeParse(req.body);
		if (!parsed.success) {
			return res.status(400).json({
				error: 'Bad Request',
				details: parsed.error.flatten(),
			});
		}
		const {
			mode,
			side,
			style,
			override,
			bodyText,
			msgAuthor,
			timeText,
			replyAuthor,
			replySnippet,
			avatarSrc,
			width,
			avatarSize,
			bubbleRadius,
			fonts,
		} = parsed.data;

		// validação semântica extra (ex.: strings muito vazias com apenas espaços)
		const trimmedBody = bodyText.trim();
		if (!trimmedBody) {
			return res.status(422).json({
				error: 'Unprocessable Entity',
				message: 'bodyText must not be empty after trimming',
			});
		}

		const palette = resolveStyle(style, override);

		// monta opções pra função de render
		const opts = {
			mode,
			side,
			width,
			avatarSize,
			bubbleRadius,
			// cores/paleta
			bubbleColor: palette.bubbleColor,
			textColor: palette.textColor,
			quotedBarColor: palette.quotedBarColor,
			quotedHeaderColor: palette.quotedHeaderColor,
			quotedTextColor: palette.quotedTextColor,
			timeColor: palette.timeColor,
			authorColor: palette.authorColor,
			// fontes (opcionais)
			...(fonts?.authorFont ? { authorFont: fonts.authorFont } : {}),
			...(fonts?.quotedFont ? { quotedFont: fonts.quotedFont } : {}),
			...(fonts?.bodyFont ? { bodyFont: fonts.bodyFont } : {}),
			...(fonts?.timeFont ? { timeFont: fonts.timeFont } : {}),
		} as any;

		// chama o renderer unificado
		const buffer = await createMessageBubble(
			mode === 'reply' ? replyAuthor ?? null : null,
			mode === 'reply' ? replySnippet ?? null : null,
			trimmedBody,
			timeText ?? '',
			msgAuthor,
			avatarSrc,
			opts
		);

		res.setHeader('Content-Type', 'image/png');
		// opcional: cache curto (ajuste conforme sua infra)
		res.setHeader('Cache-Control', 'no-store');
		return res.status(200).send(buffer);
	} catch (err: any) {
		// erros previsíveis (problema ao carregar imagem, etc.)
		if (
			err?.name === 'Error' &&
			/image|loadImage|Unsupported/.test(String(err?.message))
		) {
			return res.status(422).json({
				error: 'Unprocessable Entity',
				message: 'Failed to load avatarSrc image',
				details: String(err?.message),
			});
		}

		res.status(500).json({
			error: 'Internal Server Error',
			message: 'An unexpected error occurred',
		});
		console.error('Unexpected error:', err);
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
