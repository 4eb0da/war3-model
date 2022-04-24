declare module 'parse-dds' {
    export interface DdsInfo {
        shape: [number, number];
        images: {
            offset: number;
            length: number;
            shape: [number, number];
        }[];
        format: 'dxt1' | 'dxt3' | 'dxt5' | 'rgba32f';
        flags: number;
        cubemap: boolean;
    }

    export default function parse(buffer: ArrayBuffer): DdsInfo;
}