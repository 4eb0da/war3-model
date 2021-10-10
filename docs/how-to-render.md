## How to render model in browser

First of all, you need to get the model somehow. Load as external file, allow to user to provide it or maybe some other way.
Then you need all textures, so the model would render properly.

Place `<canvas>` in page somewhere, get it's rendering context and do some initial setup:

```ts
const canvas = document.querySelector('canvas');
try {
    gl = canvas.getContext('webgl');

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
} catch (err) {
    alert(err);
}
```

Create renderer instance:

```ts
const modelRenderer = new ModelRenderer(model);
```

Set textures:
```ts
modelRenderer.setTextureImage('somename.blp', img, textureFlags);
```

Init camera and model-view / projection martices:
```ts
...
mat4.perspective(pMatrix, Math.PI / 4 , canvas.width / canvas.height, 0.1, 10000.0);
mat4.lookAt(mvMatrix, cameraPos, cameraTarget, cameraUp);
```

And then call `update` + `setCamera` + `render` methods on `requestAnimationFrame`:

```ts
requestAnimationFrame(tick);

function tick(timestamp: number) {
    const delta = timstamp - start;
    modelRenderer.update(delta);
    modelRenderer.setCamera(cameraPos, cameraQuat);
    modelRenderer.render(mvMatrix, pMatrix);
}
```

This doc missing a lot of nuances, but the basic plan should be more clear now.

For detailed info please see [example source](https://github.com/4eb0da/war3-model/blob/master/docs/preview/preview.ts)