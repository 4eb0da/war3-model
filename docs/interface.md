## Exported functions and class

```ts
// MDL
function parseMDL(str: string): Model;
function generateMDL(model: Model): string;

// MDX
function parseMDX(buffer: ArrayBuffer): Model;
function generateMDX(model: Model): ArrayBuffer;

// BLP
function decodeBLP(buffer: ArrayBuffer): BLPImage;
function getBLPImageData(blp: BLPImage, mipmapLevel: number): ImageData;

// ModelRenderer
// vec3, mat4, quat - types from "gl-matrix" package
class ModelRenderer {
    constructor(model: Model);

    destroy (): void;
    initGL (glContext: WebGLRenderingContext): void;
    setTextureImage (path: string, img: HTMLImageElement, flags: TextureFlags): void;
    setTextureImageData (path: string, imageData: ImageData[], flags: TextureFlags): void;
    setCamera (cameraPos: vec3, cameraQuat: quat): void
    // Sets current animation
    setSequence (index: number): void;
    setTeamColor (color: vec3): void;
    update (delta: number): void;
    render (mvMatrix: mat4, pMatrix: mat4): void;
}
```

## Useful interfaces

```ts
// see in https://github.com/4eb0da/war3-model/blob/master/model.ts
interface Model { ... }

// see in https://github.com/4eb0da/war3-model/blob/master/blp/blpimage.ts
interface BLPImage { ... }
```