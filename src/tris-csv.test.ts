import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTrisCSV } from './tris-csv';

const header = 'CONCURSO,ID,R1,R2,R3,R4,R5,FECHA,PRIMOS,REPETIDOS';
const NL = String.fromCharCode(10);
const CRLF = String.fromCharCode(13) + NL;

test('parsea BOM y CRLF, ignora ID y conserva los cinco dígitos en orden', () => {
    const csv = String.fromCharCode(0xfeff) + header + CRLF +
        '102,abc,0,1,2,3,4,25/11/2026,2,0' + CRLF +
        '101,xyz,9,8,7,6,5,24/11/2026,1,0' + CRLF;
    const draws = parseTrisCSV(csv);
    assert.deepEqual(draws.map(d => d.num), [101, 102]);
    assert.deepEqual(draws[0].digits, [9, 8, 7, 6, 5]);
    assert.equal(draws[1].date, '25/11/2026');
});

test('acepta columnas suplementarias', () => {
    const draws = parseTrisCSV(header + NL + '1,x,1,2,3,4,5,date,extra,extra');
    assert.equal(draws.length, 1);
});

test('rechaza concursos y dígitos malformados', () => {
    for (const bad of ['1x', '1.5', '0']) {
        assert.throws(() => parseTrisCSV(header + NL + bad + ',x,1,2,3,4,5,date'));
    }
    for (const bad of ['10', '3x', '3.0', '']) {
        assert.throws(() => parseTrisCSV(header + NL + '1,x,1,2,' + bad + ',4,5,date'));
    }
});

test('rechaza duplicados, fechas ausentes, encabezados incorrectos y datos vacíos', () => {
    assert.throws(() => parseTrisCSV(header + NL + '1,x,1,2,3,4,5,date' + NL + '1,y,1,2,3,4,5,date'), /duplicado/);
    assert.throws(() => parseTrisCSV(header + NL + '1,x,1,2,3,4,5,'));
    assert.throws(() => parseTrisCSV('A,B,C,D,E,F,G,H' + NL + '1,x,1,2,3,4,5,date'), /Encabezado/);
    assert.throws(() => parseTrisCSV(header), /no contiene/);
});
