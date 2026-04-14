precision mediump float;

varying vec3 vNormal;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform sampler2D uMaskSampler;
uniform vec3 uReplaceableColor;
uniform float uReplaceableType;
uniform float uLayerAlpha;
uniform float uDiscardAlphaLevel;
uniform mat3 uTVertexAnim;
uniform float uUseReplaceableMask;
uniform float uWireframe;

float hypot (vec2 z) {
    float t;
    float x = abs(z.x);
    float y = abs(z.y);
    t = min(x, y);
    x = max(x, y);
    t = t / x;
    return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);
}

void main(void) {
    if (uWireframe > 0.) {
        gl_FragColor = vec4(1.);
        return;
    }

    vec2 texCoord = (uTVertexAnim * vec3(vTextureCoord.s, vTextureCoord.t, 1.)).st;
    vec4 maskColor = uUseReplaceableMask > 0. ? texture2D(uMaskSampler, texCoord) : vec4(0.0);
    float diffuseAlpha = maskColor.a;
    float teamMask = uUseReplaceableMask > 0. ? 1.0 - diffuseAlpha : 1.0;

    if (uReplaceableType == 0.) {
        gl_FragColor = texture2D(uSampler, texCoord);
    } else if (uReplaceableType == 1.) {
        if (uUseReplaceableMask > 0.) {
            gl_FragColor = vec4(mix(uReplaceableColor, maskColor.rgb, diffuseAlpha), 1.0);
        } else {
            gl_FragColor = vec4(uReplaceableColor, 1.0);
        }
    } else if (uReplaceableType == 2.) {
        float dist = hypot(texCoord - vec2(0.5, 0.5)) * 2.;
        float truncateDist = clamp(1. - dist * 1.4, 0., 1.);
        float alpha = sin(truncateDist);
        if (uUseReplaceableMask > 0.) {
            gl_FragColor = vec4(mix(uReplaceableColor * alpha, maskColor.rgb, diffuseAlpha), alpha);
        } else {
            gl_FragColor = vec4(uReplaceableColor * alpha * teamMask, alpha * teamMask);
        }
    }

    gl_FragColor *= uLayerAlpha;

    // A negative threshold means "discard near-black texels" for additive color-keyed effects.
    if (uDiscardAlphaLevel < 0.) {
        if (max(gl_FragColor.r, max(gl_FragColor.g, gl_FragColor.b)) < -uDiscardAlphaLevel) {
            discard;
        }
    } else if (gl_FragColor[3] < uDiscardAlphaLevel) {
        discard;
    }
}
