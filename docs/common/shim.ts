if (!Float32Array.prototype.reverse) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Float32Array.prototype.reverse = Array.prototype.reverse;
}

export {}