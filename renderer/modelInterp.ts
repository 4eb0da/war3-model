import {AnimVector} from '../model';
import {interpNum, interpVec3, interpQuat} from './interp';
import {vec3, quat} from 'gl-matrix';
import {RendererData} from './rendererData';

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
        let res = this.findKeyframes(animVector);
        if (!res) {
            return null;
        }
        return interpNum(res.frame, res.left, res.right, animVector.LineType);
    }

    public vec3 (out: vec3, animVector: AnimVector): vec3|null {
        let res = this.findKeyframes(animVector);
        if (!res) {
            return null;
        }
        return interpVec3(out, res.frame, res.left, res.right, animVector.LineType);
    }

    public quat (out: quat, animVector: AnimVector): quat|null {
        let res = this.findKeyframes(animVector);
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

    private findLocalFrame (animVector: AnimVector) {
        if (typeof animVector.GlobalSeqId === 'number') {
            return {
                frame: this.rendererData.globalSequencesFrames[animVector.GlobalSeqId],
                from: 0,
                to: this.rendererData.model.GlobalSequences[animVector.GlobalSeqId]
            };
        } else {
            return {
                frame: this.rendererData.frame,
                from: this.rendererData.animationInfo.Interval[0],
                to: this.rendererData.animationInfo.Interval[1]
            };
        }
    }

    private findKeyframes (animVector: AnimVector) {
        if (!animVector) {
            return null;
        }

        let {frame, from, to} = this.findLocalFrame(animVector);

        let array = animVector.Keys;
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
            let step = count >> 1;
            if (array[first + step].Frame <= frame) {
                first = first + step + 1;
                count -= step + 1;
            } else {
                count = step;
            }
        }

        if (first === 0) {
            return null;
        }
        if (first === array.length || array[first].Frame > to) {
            if (array[first - 1].Frame >= from) {
                return {
                    frame,
                    left: array[first - 1],
                    right: array[first - 1]
                };
            } else {
                return null;
            }
        }
        if (array[first - 1].Frame < from) {
            if (array[first].Frame <= to) {
                return {
                    frame,
                    left: array[first],
                    right: array[first]
                };
            } else {
                return null;
            }
        }

        return {
            frame,
            left: array[first - 1],
            right: array[first]
        };
    }
}
