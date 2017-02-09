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
        return <vec3> left.Vector;
    }

    let t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (lineType === LineType.DontInterp) {
        return <vec3> left.Vector;
    } else if (lineType === LineType.Bezier) {
        return vec3.bezier(out, <vec3> left.Vector, <vec3> left.OutTan, <vec3> right.InTan, <vec3> right.Vector, t);
    } else if (lineType === LineType.Hermite) {
        return vec3.hermite(out, <vec3> left.Vector, <vec3> left.OutTan, <vec3> right.InTan, <vec3> right.Vector, t);
    } else {
        return vec3.lerp(out, <vec3> left.Vector, <vec3> right.Vector, t);
    }
}

export function interpQuat (out: quat, frame: number, left: AnimKeyframe, right: AnimKeyframe,
                            lineType: LineType): quat {
    if (left.Frame === right.Frame) {
        return <quat> left.Vector;
    }

    let t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (lineType === LineType.DontInterp) {
        return <quat> left.Vector;
    } else if (lineType === LineType.Hermite || lineType === LineType.Bezier) {
        return quat.sqlerp(out, <quat> left.Vector, <quat> left.OutTan, <quat> right.InTan, <quat> right.Vector, t);
    } else {
        return quat.slerp(out, <quat> left.Vector, <quat> right.Vector, t);
    }
}
