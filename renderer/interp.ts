import {LineType, AnimKeyframe} from '../model';
import {vec3, quat} from 'gl-matrix';

export function lerp (left: number, right: number, t: number) {
    return left * (1 - t) + right * t;
}

export function interpNum (frame: number, left: AnimKeyframe, right: AnimKeyframe, lineType: LineType): number|null {
    if (left.Frame === right.Frame) {
        return left.Vector[0];
    }

    let t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (lineType === LineType.DontInterp) {
        return left.Vector[0];
        // } else if (animVector.LineType === 'Bezier') {
        //     return vec3.bezier(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
        // } else if (animVector.LineType === 'Hermite') {
        //     return vec3.hermite(out, left.Vector, left.OutTan, right.InTan, right.Vector, t);
    } else {
        // Linear
        return lerp(left.Vector[0], right.Vector[0], t);
    }
}

export function interpVec3 (out: vec3, frame: number, left: AnimKeyframe, right: AnimKeyframe,
                            lineType: LineType): vec3 {
    if (left.Frame === right.Frame) {
        return left.Vector as vec3;
    }

    let t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (lineType === LineType.DontInterp) {
        return left.Vector as vec3;
    } else if (lineType === LineType.Bezier) {
        return vec3.bezier(out, left.Vector as vec3, left.OutTan as vec3, right.InTan as vec3, right.Vector as vec3, t);
    } else if (lineType === LineType.Hermite) {
        return vec3.hermite(out, left.Vector as vec3, left.OutTan as vec3,
            right.InTan as vec3, right.Vector as vec3, t);
    } else {
        return vec3.lerp(out, left.Vector as vec3, right.Vector as vec3, t);
    }
}

export function interpQuat (out: quat, frame: number, left: AnimKeyframe, right: AnimKeyframe,
                            lineType: LineType): quat {
    if (left.Frame === right.Frame) {
        return left.Vector as quat;
    }

    let t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (lineType === LineType.DontInterp) {
        return left.Vector as quat;
    } else if (lineType === LineType.Hermite || lineType === LineType.Bezier) {
        return quat.sqlerp(out, left.Vector as quat, left.OutTan as quat, right.InTan as quat, right.Vector as quat, t);
    } else {
        return quat.slerp(out, left.Vector as quat, right.Vector as quat, t);
    }
}
