// Un color distinto por proyecto, por posición en la lista (ambas listas —sidebar
// y home— van ordenadas por nombre y sin archivados, así que el índice coincide).
export const PROJECT_DOT_PALETTE = [
	'#2563eb',
	'#16a34a',
	'#ea580c',
	'#7c3aed',
	'#db2777',
	'#0891b2',
	'#ca8a04',
	'#dc2626'
];

export const projectDotColor = (index: number): string =>
	PROJECT_DOT_PALETTE[index % PROJECT_DOT_PALETTE.length];

// Color estable derivado de un string (para avatares de usuario, etc.).
export function colorFromKey(key: string): string {
	let h = 0;
	for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
	return PROJECT_DOT_PALETTE[h % PROJECT_DOT_PALETTE.length];
}
