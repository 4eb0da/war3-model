import {AnimKeyframe, AnimVector} from '../model';
import {findKeyframes, interpNum, interpVec3, interpQuat} from './interp';
import {vec3, quat} from 'gl-matrix';
import {RendererData} from './rendererData';

const findLocalFrameRes = {
    frame: 0,
    from: 0,
    to: 0
};

export class ModelInterp {
    public static maxAnimVectorVal (vector: AnimVector|number): number {
        if (typeof vector === 'number') {
            return vector;
        }

        let max = vector.Keys[0].Vector[0];

        for (let i = 1; i < vector.Keys.length; ++i) {
            if (vector.Keys[i].Vector[0] > max) {
                max = vector.Keys[i].Vector[0];
            }
        }

        return max;
    }

    private rendererData: RendererData;

    constructor (rendererData: RendererData) {
        this.rendererData = rendererData;
    }

    public num (animVector: AnimVector): number|null {
        const res = this.findKeyframes(animVector);
        if (!res) {
            return null;
        }
        return interpNum(res.frame, res.left, res.right, animVector.LineType);
    }

    public vec3 (out: vec3, animVector: AnimVector): vec3|null {
        const res = this.findKeyframes(animVector);
        if (!res) {
            return null;
        }
        return interpVec3(out, res.frame, res.left, res.right, animVector.LineType);
    }

    public quat (out: quat, animVector: AnimVector): quat|null {
        const res = this.findKeyframes(animVector);
        if (!res) {
            return null;
        }
        return interpQuat(out, res.frame, res.left, res.right, animVector.LineType);
    }

    public animVectorVal (vector: AnimVector|number, defaultVal: number): number {
        let res;

        if (typeof vector === 'number') {
            res = vector;
        } else {
            res = this.num(vector);
            if (res === null) {
                res = defaultVal;
            }
        }

        return res;
    }

    public findKeyframes (animVector: AnimVector): null | {frame: number, left: AnimKeyframe, right: AnimKeyframe} {
        if (!animVector) {
            return null;
        }

        const {frame, from, to} = this.findLocalFrame(animVector);

        return findKeyframes(animVector, frame, from, to);
    }

    public findLocalFrame (animVector: AnimVector): {frame: number, from: number, to: number} {
        if (typeof animVector.GlobalSeqId === 'number') {
            findLocalFrameRes.frame = this.rendererData.globalSequencesFrames[animVector.GlobalSeqId];
            findLocalFrameRes.from = 0;
            findLocalFrameRes.to = this.rendererData.model.GlobalSequences[animVector.GlobalSeqId];
        } else {
            findLocalFrameRes.frame = this.rendererData.frame;
            findLocalFrameRes.from = this.rendererData.animationInfo.Interval[0];
            findLocalFrameRes.to = this.rendererData.animationInfo.Interval[1];
        }
        return findLocalFrameRes;
    }
}
