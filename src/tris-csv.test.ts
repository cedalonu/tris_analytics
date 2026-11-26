import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTrisCSV } from './tris-csv';

const header = 'CONCURSO,ID,R1,R2,R3,R4,R5,FECHA,PRIMOS,REPETIDOS';

test('parses BOM and CRLF, ignores ID and preserves five digits in order', () => {
    const csv = '\\uFEFF' + header + '\r\n' +
        '102,abc,0,1,2,3,4,25/11/2026,2,0\r\n' +
        '101,xyz,9,8,7,6,5,24/11/2026,1,0\r\n';
    const draws = parseTrisCSV(csv);
    assert.deepEqual(draws.map(d => d.num), [101, 102]);
    assert.deepEqual(draws[0].digits, [9, 8, 7, 6, 5]);
    assert.equal(draws[1].date, '25/11/2026');
});

test('accepts supplemental columns', () => {
    const draws = parseTrisCSV(header + '\n1,x,1,2,3,4,5,date,extra,extra');
    assert.equal(draws.length, 1);
});

test('rejects malformed contest numbers and digits', () => {
    for (const bad of ['1x', '1.5', '0']) {
        assert.throws(() => parseTrisCSV(header + `\\n${bad},x,1,2,3,4,5,date`));
    }
    for (const bad of ['10', '3x', '3.0', '']) {
        assert.throws(() => parseTrisCSV(header + `\\n1,x,1,2,${bad},4,5,date`));
    }
});

test('rejects duplicate contests, missing dates, wrong headers and empty data', () => {
    assert.throws(() => parseTrisCSV(header + '\n1,x,1,2,3,4,5,date\n1,y,1,2,3,4,5,date'), /duplicado/);
    assert.throws(() => parseTrisCSV(header + '\n1,x,1,2,3,4,5,'));
    assert.throws(() => parseTrisCSV('A,B,C,D,E,F,G,H\n1,x,1,2,3,4,5,date'), /Encabezado/);
    assert.throws(() => parseTrisCSV(header), /no contiene/);
});
