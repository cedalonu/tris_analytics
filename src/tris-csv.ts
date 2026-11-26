export interface Draw {
    num: number;
    win: number[];
    digits: number[];
    date: string;
}

function isDigitsOnly(value: string, exactLength?: number): boolean {
    return value.length > 0
        && (exactLength === undefined || value.length === exactLength)
        && Array.from(value).every(char => char >= '0' && char <= '9');
}

/** Parser estricto del CSV local de TRIS. */
export function parseTrisCSV(text: string): Draw[] {
    const withoutBom = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    const lines = withoutBom.trim().split('\n').map(line => line.endsWith('\r') ? line.slice(0, -1) : line);
    if (lines.length < 2) throw new Error('El CSV no contiene sorteos.');
    const header = lines[0].split(',').map(value => value.trim().replace(String.fromCharCode(0xfeff), '').toUpperCase());
    const required = ['CONCURSO', 'ID', 'R1', 'R2', 'R3', 'R4', 'R5', 'FECHA'];
    if (required.some((name, index) => header[index] !== name)) {
        throw new Error('Encabezado inválido. Se espera CONCURSO,ID,R1,R2,R3,R4,R5,FECHA.');
    }
    const draws: Draw[] = [];
    const seen = new Set<number>();
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',');
        if (cols.length < 8) throw new Error(`Fila ${i + 1}: faltan columnas obligatorias.`);
        const numText = (cols[0] ?? '').trim();
        const digitTexts = [2, 3, 4, 5, 6].map(index => (cols[index] ?? '').trim());
        const num = isDigitsOnly(numText) ? Number(numText) : Number.NaN;
        const digits = digitTexts.map(value => isDigitsOnly(value, 1) ? Number(value) : Number.NaN);
        const date = (cols[7] ?? '').trim();
        if (!Number.isSafeInteger(num) || num <= 0 || digits.some(d => !Number.isInteger(d)) || !date) {
            throw new Error(`Fila ${i + 1}: concurso, cinco dígitos o fecha inválidos.`);
        }
        if (seen.has(num)) throw new Error(`Fila ${i + 1}: concurso duplicado (${num}).`);
        seen.add(num);
        draws.push({ num, win: digits, digits, date });
    }
    if (!draws.length) throw new Error('No se encontraron sorteos válidos.');
    return draws.sort((a, b) => a.num - b.num);
}
