import {vec3, quat, mat4} from 'gl-matrix';

export function mat4fromRotationOrigin (out: mat4, rotation: quat, origin: vec3): mat4 {
    const x = rotation[0], y = rotation[1], z = rotation[2], w = rotation[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2,

        ox = origin[0],
        oy = origin[1],
        oz = origin[2];

    out[0] = (1 - (yy + zz));
    out[1] = (xy + wz);
    out[2] = (xz - wy);
    out[3] = 0;
    out[4] = (xy - wz);
    out[5] = (1 - (xx + zz));
    out[6] = (yz + wx);
    out[7] = 0;
    out[8] = (xz + wy);
    out[9] = (yz - wx);
    out[10] = (1 - (xx + yy));
    out[11] = 0;
    out[12] = ox - (out[0] * ox + out[4] * oy + out[8] * oz);
    out[13] = oy - (out[1] * ox + out[5] * oy + out[9] * oz);
    out[14] = oz - (out[2] * ox + out[6] * oy + out[10] * oz);
    out[15] = 1;

    return out;
}

/**
 * Rotate a 3D vector around the z-axis
 * @param {vec3} out The receiving vec3
 * @param {vec3} a The vec3 point to rotate
 * @param {Number} c The angle of rotation
 * @returns {vec3} out
 */
export function vec3RotateZ (out: vec3, a: vec3, c: number): vec3 {
    out[0] = a[0] * Math.cos(c) - a[1] * Math.sin(c);
    out[1] = a[0] * Math.sin(c) + a[1] * Math.cos(c);
    out[2] = a[2];

    return out;
}

export function rand (from: number, to: number): number {
    return from + Math.random() * (to - from);
}

export function degToRad (angle: number): number {
    return angle * Math.PI / 180;
}

export function getShader (gl: WebGLRenderingContext, source: string, type: number): WebGLShader {
    const shader: WebGLShader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

export function isWebGL2 (gl: WebGLRenderingContext | WebGL2RenderingContext): gl is WebGL2RenderingContext {
    return gl instanceof WebGL2RenderingContext;
}

export const LAYER_TEXTURE_NAME_MAP = {
    'TextureID': 0,
    'NormalTextureID': 1,
    'ORMTextureID': 2,
    'EmissiveTextureID': 3,
    'TeamColorTextureID': 4,
    'ReflectionsTextureID': 5
};

export const LAYER_TEXTURE_ID_MAP = [
    'TextureID',
    'NormalTextureID',
    'ORMTextureID',
    'EmissiveTextureID',
    'TeamColorTextureID',
    'ReflectionsTextureID'
];
