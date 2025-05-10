struct VSOut {
    @builtin(position) position: vec4f,
    @location(0) texCoord: vec2f,
};

@vertex fn vs(
    @location(0) position: vec2f
) -> VSOut {
    var vsOutput: VSOut;
    vsOutput.position = vec4f(position * 2.0 - 1.0, 0.0, 1.0);
    vsOutput.texCoord = vec2f(position.x, 1.0 - position.y);
    return vsOutput;
}

@group(0) @binding(0) var textureSampler: sampler;
@group(0) @binding(1) var textureView: texture_2d<f32>;

@fragment fn fs(
    fsInput: VSOut
) -> @location(0) vec4f {
    return textureSample(textureView, textureSampler, fsInput.texCoord);
}