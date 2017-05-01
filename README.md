# war3-model
TypeScript-based mdl/mdx (Warcraft 3 model formats) converter/renderer

## Demo
* [MDL/MDX converter (also json-like structure-previewer)](https://4eb0da.github.io/war3-model/convert.html)
* [WebGL model previewer (png/jpg textures requires second drag&drop; blp not supported)](https://4eb0da.github.io/war3-model/preview.html)

## Usage
```typescript
import {parse as parseMDL} from '../../parsers/mdl';
import {generate as generateMDL} from '../../generators/mdl';

let model = parseMDL('...');
let mdl = generateMDL(model);
console.log(mdl);
```

## MDL/MDX support
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
* No light support (normals, light, Unshaded, etc)
* No render priority support (PriorityPlane and others)
* No blp support
