export enum BLPType {
    BLP0,
    BLP1,
    BLP2
}

export enum BLPContent {
    JPEG = 0,
    Direct = 1
}

export interface BLPMipMap {
    offset: number;
    size: number;
}

export interface BLPImage {
    type: BLPType;
    width: number;
    height: number;
    content: BLPContent;
    alphaBits: number;
    mipmaps: BLPMipMap[];
    data: ArrayBuffer;
}
