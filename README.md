# war3-model
TypeScript-based mdl/mdx (Warcraft 3 model formats) converter/renderer

## Demo
* [MDL/MDX converter (also json-like structure-previewer)](https://4eb0da.github.io/war3-model/convert/convert.html)
* [WebGL model previewer](https://4eb0da.github.io/war3-model/preview/preview.html)
* [BLP previewer (BLP1 decoder only)](https://4eb0da.github.io/war3-model/decodeblp/decodeblp.html)
* [Simple model optimizer](https://4eb0da.github.io/war3-model/optframes/optframes.html)

## Usage

* [Usage in Node.js or with bundler (e.g. webpack)](docs/node.md)
* [Usage in browser as external script](docs/browser-global.md)
* [Usage in browser as ES Module directly](docs/browser-es.md)
* [Exported APIs](docs/interface.md)
* [How to render model in browser](docs/how-to-render.md)

```bash
npm i war3-model --save
```

MDL parsing/generation
```typescript
import { parseMDL, generateMDL } from 'war3-model';

let model = parseMDL('...');
let mdl = generateMDL(model);
console.log(mdl);
```

BLP => PNG node.js cli converter
```typescript
import * as fs from 'fs';
import { PNG } from 'pngjs';
import { decodeBLP, getBLPImageData } from 'war3-model';

let blp = decode(new Uint8Array(fs.readFileSync(process.argv[2])).buffer);
let imageData = getImageData(blp, 0);
let png = new PNG({width: blp.width, height: blp.height, inputHasAlpha: true});

png.data = Buffer.from(imageData.data.buffer);

fs.writeFileSync('out.png', PNG.sync.write(png));
```

## Is it good enough?

100% of both old classic Warcraft 3 and Reforged models can be parsed.

After conversion `mdx binary file` -> `in-memory structure` -> `mdx binary file` ~99.7% (8753/8773) of them would be byte-to-byte identical (some of them contains unused data).

## Reforged format is supported

New versions 900 (not sure), 1000 and 1100 are supported in parsers, generators and viewer.

## MDL/MDX support

* Format versions 800 (classic War3), 900 (not tested), 1000 and 1100 (Reforged)
* All standart features like Sequences, Bones, Cameras, etc
* Multiple texture chunks (mdx only)
* Multiple sequences/nodes with the same name (not quite sure is it feature or not, but War3 actually contains such models)
* SoundTrack not supported

## Renderer support

* Standart geometry/animation
* Custom team color setting
* ReplaceableId 1/2
* Global sequences
* Alpha blending and multiple layers
* TextureAnimation
* Billboarded/BillboardedLockXYZ, w/o DontInherit/CameraAnchored
* RibbonEmitter (w/o Gravity and TextureSlot/Color animation)
* ParticleEmitter2 (with Tail/Head/Both/Squirt(?))
* Reforged PBR lightning (orm textures, specular, normal mapping, env textures, etc)
* No Light nodes support (Light, Unshaded, etc)
* No render priority support (PriorityPlane and others)
* BLP / DDS are supported

## BLP support

* BLP1 only (not BLP0 and BLP2 support)
* Decoder only, no encoder
* Direct & jpeg data
* Variable alpha (8/4/1/0 bit, but tested only 8/0)
* API for getting all mipmap level's data

## DDS support

* dxt1, dxt3, dxt5, ati2 (also known as bc5)

## Thanks

* Magos (MDX specification, War3 Model Editor app/source)
* GhostWolf (aka flowtsohg) (MDX specification, BLP decoder code)
* Алексей (MdlVis app/source)
* Dr Super Good (BLP specification)

## Licence

MIT Licence
