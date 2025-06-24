precision mediump float;

varying vec3 vNormal;
varying vec2 vTextureCoord;

uniform sampler2D uSampler;
uniform vec3 uReplaceableColor;
uniform float uReplaceableType;
uniform float uDiscardAlphaLevel;
uniform mat3 uTVertexAnim;
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

    if (uReplaceableType == 0.) {
        gl_FragColor = texture2D(uSampler, texCoord);
    } else if (uReplaceableType == 1.) {
        gl_FragColor = vec4(uReplaceableColor, 1.0);
    } else if (uReplaceableType == 2.) {
        float dist = hypot(texCoord - vec2(0.5, 0.5)) * 2.;
        float truncateDist = clamp(1. - dist * 1.4, 0., 1.);
        float alpha = sin(truncateDist);
        gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);
    }

    // hand-made alpha-test
    if (gl_FragColor[3] < uDiscardAlphaLevel) {
        discard;
    }
}
