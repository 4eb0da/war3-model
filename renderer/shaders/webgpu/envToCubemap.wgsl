const invAtan: vec2f = vec2f(0.1591, 0.3183);

struct VSUniforms {
    mvMatrix: mat4x4f,
    pMatrix: mat4x4f,
}

@group(0) @binding(0) var<uniform> vsUniforms: VSUniforms;
@group(1) @binding(0) var fsUniformSampler: sampler;
@group(1) @binding(1) var fsUniformTexture: texture_2d<f32>;

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
    var out: VSOut;
    out.position = vsUniforms.pMatrix * vsUniforms.mvMatrix * vec4f(in.vertexPosition, 1);
    out.localPos = in.vertexPosition;
    return out;
}

fn SampleSphericalMap(v: vec3f) -> vec2f {
    // vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    var uv: vec2f = vec2f(atan2(v.x, v.y), asin(-v.z));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

@fragment fn fs(
    in: VSOut
) -> @location(0) vec4f {
    let uv: vec2f = SampleSphericalMap(normalize(in.localPos)); // make sure to normalize localPos
    let color: vec3f = textureSample(fsUniformTexture, fsUniformSampler, uv).rgb;

    return vec4f(color, 1.0);
}
