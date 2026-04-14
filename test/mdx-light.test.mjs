import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseMDX, generateMDX } from '../dist/es/war3-model.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function readModel(fileName) {
    const filePath = path.join(repoRoot, fileName);
    const buffer = fs.readFileSync(filePath);
    return parseMDX(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}

function run(name, fn) {
    fn();
    console.log(`ok - ${name}`);
}

run('parseMDX supports light chunks without static visibility', () => {
    const model = readModel('BHolyWings.mdx');

    assert.ok(model.Lights.length > 0);
    assert.equal(typeof model.Lights[0].Visibility, 'object');
    assert.ok(model.Lights[0].Visibility.Keys.length > 0);
});

run('parseMDX supports light chunks with static visibility', () => {
    const model = readModel('BHolyWings.mdx');

    model.Lights[0].Visibility = 0.5;

    const mdx = generateMDX(model);
    const reparsed = parseMDX(mdx);

    assert.equal(reparsed.Lights.length, model.Lights.length);
    assert.equal(reparsed.Lights[0].Visibility, 0.5);
});

console.log('all tests passed');
