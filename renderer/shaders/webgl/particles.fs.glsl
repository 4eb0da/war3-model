precision mediump float;

varying vec2 vTextureCoord;
varying vec4 vColor;

uniform sampler2D uSampler;
uniform vec3 uReplaceableColor;
uniform float uReplaceableType;
uniform float uDiscardAlphaLevel;

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
    vec2 coords = vec2(vTextureCoord.s, vTextureCoord.t);
    if (uReplaceableType == 0.) {
        gl_FragColor = texture2D(uSampler, coords);
    } else if (uReplaceableType == 1.) {
        gl_FragColor = vec4(uReplaceableColor, 1.0);
    } else if (uReplaceableType == 2.) {
        float dist = hypot(coords - vec2(0.5, 0.5)) * 2.;
        float truncateDist = clamp(1. - dist * 1.4, 0., 1.);
        float alpha = sin(truncateDist);
        gl_FragColor = vec4(uReplaceableColor * alpha, 1.0);
    }
    gl_FragColor *= vColor;

    if (gl_FragColor[3] < uDiscardAlphaLevel) {
        discard;
    }
}
