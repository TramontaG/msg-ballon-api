import { bubbleStyles } from 'src/QuoteMaking/Styles';
import { z } from 'zod';

// ---------- Validações ----------
const hexColor = z
	.string()
	.regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color');

const styleOverrideSchema = z
	.object({
		bubbleColor: hexColor.optional(),
		textColor: hexColor.optional(),
		quotedBarColor: hexColor.optional(),
		quotedHeaderColor: hexColor.optional(),
		quotedTextColor: hexColor.optional(),
		timeColor: hexColor.optional(),
		authorColor: hexColor.optional(),
	})
	.strict()
	.optional();

export const payloadSchema = z
	.object({
		mode: z.enum(['normal', 'reply']).default('normal'),
		side: z.enum(['left', 'right']).default('left'),
		style: z.string().optional(), // chave do bubbleStyles
		override: styleOverrideSchema,

		// conteúdo
		bodyText: z.string().min(1, 'bodyText is required').max(4000),
		msgAuthor: z.string().min(1, 'msgAuthor is required').max(120),
		timeText: z.string().default(''), // ex.: "12:37" — deixe vazio se não quiser

		// reply-only
		replyAuthor: z.string().max(120).optional(),
		replySnippet: z.string().max(4000).optional(),

		// mídia
		avatarSrc: z
			.string()
			.refine(
				s => {
					// aceita URL ou base64 “puro” (heurística simples)
					return /^https?:\/\//.test(s) || /^[A-Za-z0-9+/=\s]+$/.test(s);
				},
				{ message: 'avatarSrc must be a URL or base64 string' }
			)
			.optional(),

		// layout / fontes
		width: z.number().int().min(200).max(1200).default(400),
		avatarSize: z.number().int().min(24).max(160).default(64),
		bubbleRadius: z.number().int().min(0).max(32).optional(),
		fonts: z
			.object({
				authorFont: z.string().optional(), // fonte do quote header (no modo reply)
				quotedFont: z.string().optional(), // fonte do quote snippet (no modo reply)
				bodyFont: z.string().optional(), // fonte do corpo da mensagem
				timeFont: z.string().optional(), // fonte do timestamp
			})
			.partial()
			.optional(),
	})
	.superRefine((val, ctx) => {
		if (val.mode === 'reply') {
			if (!val.replyAuthor)
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'replyAuthor is required when mode=reply',
					path: ['replyAuthor'],
				});
			if (!val.replySnippet)
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'replySnippet is required when mode=reply',
					path: ['replySnippet'],
				});
		}
	});

// ---------- Util: montar paleta final ----------
type StyleKey = keyof typeof bubbleStyles;

export function resolveStyle(
	styleKey: string | undefined,
	override: z.infer<typeof styleOverrideSchema> | undefined
) {
	const base =
		styleKey && bubbleStyles[styleKey as StyleKey]
			? bubbleStyles[styleKey as StyleKey]
			: bubbleStyles['whatsappDark']; // fallback

	return {
		...base,
		...(override ?? {}),
	};
}
