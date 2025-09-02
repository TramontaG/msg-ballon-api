export const bubbleStyles: Record<
	string,
	{
		bubbleColor: string;
		textColor: string;
		quotedBarColor: string;
		quotedHeaderColor: string;
		quotedTextColor: string;
		timeColor: string;
		authorColor: string; // <- novo
	}
> = {
	// whatsapp web dark
	whatsappDark: {
		bubbleColor: '#111317',
		textColor: '#ffffff',
		quotedBarColor: '#22c55e',
		quotedHeaderColor: '#22c55e',
		quotedTextColor: '#d1d5db',
		timeColor: '#9ca3af',
		authorColor: '#128c7t', // azul claro pro nome
	},

	// whatsapp claro
	whatsappLight: {
		bubbleColor: '#ffffff',
		textColor: '#111827',
		quotedBarColor: '#22c55e',
		quotedHeaderColor: '#16a34a',
		quotedTextColor: '#374151',
		timeColor: '#6b7280',
		authorColor: '#128c7t',
	},

	// telegram dark
	telegramDark: {
		bubbleColor: '#17212b',
		textColor: '#e5e7eb',
		quotedBarColor: '#2a9df4',
		quotedHeaderColor: '#38bdf8',
		quotedTextColor: '#cbd5e1',
		timeColor: '#94a3b8',
		authorColor: '#f9fafb',
	},

	// telegram light
	telegramLight: {
		bubbleColor: '#ffffff',
		textColor: '#111827',
		quotedBarColor: '#2a9df4',
		quotedHeaderColor: '#0284c7',
		quotedTextColor: '#374151',
		timeColor: '#6b7280',
		authorColor: '#1d4ed8',
	},

	// iMessage dark
	iMessageDark: {
		bubbleColor: '#0a84ff',
		textColor: '#ffffff',
		quotedBarColor: '#60a5fa',
		quotedHeaderColor: '#bfdbfe',
		quotedTextColor: '#e0f2fe',
		timeColor: '#f1f5f9',
		authorColor: '#ffffff',
	},

	// iMessage light
	iMessageLight: {
		bubbleColor: '#e5e5ea',
		textColor: '#000000',
		quotedBarColor: '#2563eb',
		quotedHeaderColor: '#1d4ed8',
		quotedTextColor: '#374151',
		timeColor: '#6b7280',
		authorColor: '#111827',
	},

	// business dark
	businessDark: {
		bubbleColor: '#1f2937',
		textColor: '#f9fafb',
		quotedBarColor: '#facc15',
		quotedHeaderColor: '#fde047',
		quotedTextColor: '#e5e7eb',
		timeColor: '#d1d5db',
		authorColor: '#fbbf24',
	},

	// business light
	businessLight: {
		bubbleColor: '#f9fafb',
		textColor: '#111827',
		quotedBarColor: '#f59e0b',
		quotedHeaderColor: '#b45309',
		quotedTextColor: '#374151',
		timeColor: '#6b7280',
		authorColor: '#b45309',
	},
};
