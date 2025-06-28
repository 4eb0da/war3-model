struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var fsUniformSampler: sampler;
@group(1) @binding(1) var fsUniformTexture: texture_cube<f32>;

struct VSIn {
    @location(0) vertexPosition: vec3f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) localPos: vec3f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    let rotView: mat4x4f = mat4x4f(
        vec4f(vsUniforms.mvMatrix[0].xyz, 0),
        vec4f(vsUniforms.mvMatrix[1].xyz, 0),
        vec4f(vsUniforms.mvMatrix[2].xyz, 0),
        vec4f(0, 0, 0, 1)
    );

    let clipPos: vec4f = vsUniforms.pMatrix * rotView * 1000. * vec4f(in.vertexPosition, 1.0);

    var out: VSOut;
    out.position = clipPos;
    out.localPos = in.vertexPosition;
    return out;
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    return textureSample(fsUniformTexture, fsUniformSampler, in.localPos);
}
