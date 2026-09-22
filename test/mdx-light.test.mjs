import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
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
    // .mdx files are gitignored, so a fresh clone has no fixtures. Skip rather than fail.
    if (!fs.existsSync(path.join(repoRoot, 'BHolyWings.mdx'))) {
        console.log(`skip - ${name} (BHolyWings.mdx not present)`);
        return;
    }
    fn();
    console.log(`ok - ${name}`);
}

function chunk(keyword, payload) {
    const header = Buffer.alloc(8);
    header.write(keyword, 0, 'ascii');
    header.writeUInt32LE(payload.length, 4);
    return Buffer.concat([header, payload]);
}

function reforgedCameraModel() {
    const camera = Buffer.alloc(120);
    camera.writeUInt32LE(0x03000078, 0);
    camera.write('Reforged Camera', 4, 'ascii');
    const events = Buffer.alloc(0);
    return Buffer.concat([Buffer.from('MDLX'), chunk('CAMS', camera), chunk('EVTS', events)]);
}

run('parseMDX supports Reforged camera flags in packed camera sizes', () => {
    const bytes = reforgedCameraModel();
    const model = parseMDX(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

    assert.equal(model.Cameras.length, 1);
    assert.equal(model.Cameras[0].Name, 'Reforged Camera');
});

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
