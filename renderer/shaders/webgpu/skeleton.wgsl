struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;

struct VSIn {
    @location(0) vertexPosition: vec3f,
    @location(1) color: vec3f,
}

struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) color: vec3f,
}

@vertex fn vs(
    in: VSIn
) -> VSOut {
    var position: vec4f = vec4f(in.vertexPosition, 1.0);

    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * position;
    out.color = in.color;
    return out;
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    return vec4f(in.color, 1);
}
