import {LineType, AnimKeyframe, AnimVector} from '../model';
import {vec3, quat} from 'gl-matrix';

const findKeyframesRes = {
    frame: 0,
    left: null,
    right: null
};

export function lerp (left: number, right: number, t: number): number {
    return left * (1 - t) + right * t;
}

function bezier (left: number, outTan: number, inTan: number, right: number, t: number): number {
    const inverseFactor = 1 - t,
        inverseFactorTimesTwo = inverseFactor * inverseFactor,
        factorTimes2 = t * t,
        factor1 = inverseFactorTimesTwo * inverseFactor,
        factor2 = 3 * t * inverseFactorTimesTwo,
        factor3 = 3 * factorTimes2 * inverseFactor,
        factor4 = factorTimes2 * t;

    return left * factor1 + outTan * factor2 + inTan * factor3 + right * factor4;
}

function hermite (left: number, outTan: number, inTan: number, right: number, t: number): number {
    const factorTimes2 = t * t,
        factor1 = factorTimes2 * (2 * t - 3) + 1,
        factor2 = factorTimes2 * (t - 2) + t,
        factor3 = factorTimes2 * (t - 1),
        factor4 = factorTimes2 * (3 - 2 * t);

    return left * factor1 + outTan * factor2 + inTan * factor3 + right * factor4;
}

export function findKeyframes (animVector: AnimVector, frame: number, from: number, to: number):
        null | {frame: number, left: AnimKeyframe, right: AnimKeyframe} {
    if (!animVector) {
        return null;
    }

    const array = animVector.Keys;
    let first = 0;
    let count = array.length;

    if (count === 0) {
        return null;
    }

    if (array[0].Frame > to) {
        return null;
    } else if (array[count - 1].Frame < from) {
        return null;
    }

    while (count > 0) {
        const step = count >> 1;
        if (array[first + step].Frame <= frame) {
            first = first + step + 1;
            count -= step + 1;
        } else {
            count = step;
        }
    }

    if (first === array.length || array[first].Frame > to) {
        if (first > 0 && array[first - 1].Frame >= from) {
            findKeyframesRes.frame = frame;
            findKeyframesRes.left = array[first - 1];
            findKeyframesRes.right = array[first - 1];

            return findKeyframesRes;
        } else {
            return null;
        }
    }
    if (first === 0 || array[first - 1].Frame < from) {
        if (array[first].Frame <= to) {
            findKeyframesRes.frame = frame;
            findKeyframesRes.left = array[first];
            findKeyframesRes.right = array[first];

            return findKeyframesRes;
        } else {
            return null;
        }
    }

    findKeyframesRes.frame = frame;
    findKeyframesRes.left = array[first - 1];
    findKeyframesRes.right = array[first];

    return findKeyframesRes;
}

export function interpNum (frame: number, left: AnimKeyframe, right: AnimKeyframe, lineType: LineType): number|null {
    if (left.Frame === right.Frame) {
        return left.Vector[0];
    }

    const t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (lineType === LineType.DontInterp) {
        return left.Vector[0];
    } else if (lineType === LineType.Bezier) {
        return bezier(left.Vector[0], left.OutTan[0], right.InTan[0], right.Vector[0], t);
    } else if (lineType === LineType.Hermite) {
        return hermite(left.Vector[0], left.OutTan[0], right.InTan[0], right.Vector[0], t);
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

    const t = (frame - left.Frame) / (right.Frame - left.Frame);

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

    const t = (frame - left.Frame) / (right.Frame - left.Frame);

    if (lineType === LineType.DontInterp) {
        return left.Vector as quat;
    } else if (lineType === LineType.Hermite || lineType === LineType.Bezier) {
        return quat.sqlerp(out, left.Vector as quat, left.OutTan as quat, right.InTan as quat, right.Vector as quat, t);
    } else {
        return quat.slerp(out, left.Vector as quat, right.Vector as quat, t);
    }
}
