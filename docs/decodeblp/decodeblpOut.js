(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BLPType;
(function (BLPType) {
    BLPType[BLPType["BLP0"] = 0] = "BLP0";
    BLPType[BLPType["BLP1"] = 1] = "BLP1";
    BLPType[BLPType["BLP2"] = 2] = "BLP2";
})(BLPType = exports.BLPType || (exports.BLPType = {}));
var BLPContent;
(function (BLPContent) {
    BLPContent[BLPContent["JPEG"] = 0] = "JPEG";
    BLPContent[BLPContent["Direct"] = 1] = "Direct";
})(BLPContent = exports.BLPContent || (exports.BLPContent = {}));
//# sourceMappingURL=blpimage.js.map
},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var decodeJPEG = require("../third_party/decoder");
var blpimage_1 = require("./blpimage");
function keyword(view, offset) {
    return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}
function uint32(view, offset) {
    return view.getUint32(offset * 4, true);
}
function bitVal(data, bitCount, index) {
    // only 1, 4 or 8 bits
    var byte = data[Math.floor(index * bitCount / 8)], valsPerByte = 8 / bitCount;
    return (byte >> (valsPerByte - index % valsPerByte - 1)) & ((1 << bitCount) - 1);
}
// node.js have no native ImageData
function createImageData(width, height) {
    if (typeof ImageData !== 'undefined') {
        return new ImageData(width, height);
    }
    else {
        return {
            width: width,
            height: height,
            data: new Uint8ClampedArray(width * height * 4)
        };
    }
}
function decode(arrayBuffer) {
    var view = new DataView(arrayBuffer);
    var image = {
        type: blpimage_1.BLPType.BLP1,
        width: 0,
        height: 0,
        content: blpimage_1.BLPContent.JPEG,
        alphaBits: 0,
        mipmaps: [],
        data: arrayBuffer,
    };
    var type = keyword(view, 0);
    if (type === 'BLP0' || type === 'BLP2') {
        throw new Error('BLP0/BLP2 not supported');
    }
    if (type !== 'BLP1') {
        throw new Error('Not a blp image');
    }
    image.content = uint32(view, 1);
    if (image.content !== blpimage_1.BLPContent.JPEG && image.content !== blpimage_1.BLPContent.Direct) {
        throw new Error('Unknown BLP content');
    }
    image.alphaBits = uint32(view, 2);
    image.width = uint32(view, 3);
    image.height = uint32(view, 4);
    for (var i = 0; i < 16; ++i) {
        var mipmap = {
            offset: uint32(view, 7 + i),
            size: uint32(view, 7 + 16 + i)
        };
        if (mipmap.size > 0) {
            image.mipmaps.push(mipmap);
        }
        else {
            break;
        }
    }
    return image;
}
exports.decode = decode;
function getImageData(blp, mipmapLevel) {
    var view = new DataView(blp.data), uint8Data = new Uint8Array(blp.data), mipmap = blp.mipmaps[mipmapLevel];
    if (blp.content === blpimage_1.BLPContent.JPEG) {
        var headerSize = uint32(view, 39), data = new Uint8Array(headerSize + mipmap.size);
        data.set(uint8Data.subarray(40 * 4, 40 * 4 + headerSize));
        data.set(uint8Data.subarray(mipmap.offset, mipmap.offset + mipmap.size), headerSize);
        return decodeJPEG(data);
    }
    else {
        var palette = new Uint8Array(blp.data, 39 * 4, 256 * 4), width = blp.width / (1 << mipmapLevel), height = blp.height / (1 << mipmapLevel), size = width * height, alphaData = new Uint8Array(blp.data, mipmap.offset + size, Math.ceil(size * blp.alphaBits / 8)), imageData = createImageData(width, height), valPerAlphaBit = 255 / ((1 << blp.alphaBits) - 1);
        for (var i = 0; i < size; ++i) {
            var paletteIndex = view.getUint8(mipmap.offset + i) * 4;
            // BGRA order
            imageData.data[i * 4] = palette[paletteIndex + 2];
            imageData.data[i * 4 + 1] = palette[paletteIndex + 1];
            imageData.data[i * 4 + 2] = palette[paletteIndex];
            if (blp.alphaBits > 0) {
                imageData.data[i * 4 + 3] = bitVal(alphaData, blp.alphaBits, i) * valPerAlphaBit;
            }
            else {
                imageData.data[i * 4 + 3] = 255;
            }
        }
        return imageData;
    }
}
exports.getImageData = getImageData;
//# sourceMappingURL=decode.js.map
},{"../third_party/decoder":4,"./blpimage":1}],3:[function(require,module,exports){
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var decode_1 = require("../../blp/decode");
document.addEventListener('DOMContentLoaded', function init() {
    var container = document.querySelector('.container');
    var preview = document.querySelector('.preview');
    var save = document.querySelector('.save');
    var label = document.querySelector('.label');
    var dropTarget;
    container.addEventListener('dragenter', function onDragEnter(event) {
        dropTarget = event.target;
        container.classList.add('container_drag');
        event.preventDefault();
    });
    container.addEventListener('dragleave', function onDragLeave(event) {
        if (event.target === dropTarget) {
            container.classList.remove('container_drag');
        }
    });
    container.addEventListener('dragover', function onDragLeave(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });
    container.addEventListener('drop', function onDrop(event) {
        event.preventDefault();
        container.classList.remove('container_drag');
        var file = event.dataTransfer.files && event.dataTransfer.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function () {
            try {
                var blp = decode_1.decode(reader.result);
                console.log(blp);
                clearPreview();
                container.classList.add('container_hidden');
                for (var i = 0; i < blp.mipmaps.length; ++i) {
                    var imageData = decode_1.getImageData(blp, i);
                    var canvas = document.createElement('canvas');
                    canvas.width = imageData.width;
                    canvas.height = imageData.height;
                    var ctx = canvas.getContext('2d');
                    ctx.putImageData(imageData, 0, 0);
                    var previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    var previewLabel = document.createElement('div');
                    previewLabel.className = 'preview-item__label';
                    previewLabel.textContent = imageData.width + "x" + imageData.height;
                    previewItem.appendChild(canvas);
                    previewItem.appendChild(previewLabel);
                    preview.appendChild(previewItem);
                }
            }
            catch (err) {
                showError(err);
            }
        };
        reader.readAsArrayBuffer(file);
    });
    function clearPreview() {
        preview.innerHTML = '';
    }
    function showError(err) {
        clearPreview();
        container.classList.remove('container_hidden');
        label.textContent = err;
        console.error(err);
    }
});
//# sourceMappingURL=decodeblp.js.map
},{"../../blp/decode":2}],4:[function(require,module,exports){
/*
 Copyright 2011 notmasteryet

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// - The JPEG specification can be found in the ITU CCITT Recommendation T.81
//   (www.w3.org/Graphics/JPEG/itu-t81.pdf)
// - The JFIF specification can be found in the JPEG File Interchange Format
//   (www.w3.org/Graphics/JPEG/jfif3.pdf)
// - The Adobe Application-Specific JPEG markers in the Supporting the DCT Filters
//   in PostScript Level 2, Technical Note #5116
//   (partners.adobe.com/public/developer/en/ps/sdk/5116.DCT_Filter.pdf)

// NOTE: This file was edited to match the crude usage of the JPG format by Blizzard for their BLP1 format.

var JpegImage = (function jpegImage() {
    "use strict";
    var dctZigZag = new Int32Array([
        0,
        1,  8,
        16,  9,  2,
        3, 10, 17, 24,
        32, 25, 18, 11, 4,
        5, 12, 19, 26, 33, 40,
        48, 41, 34, 27, 20, 13,  6,
        7, 14, 21, 28, 35, 42, 49, 56,
        57, 50, 43, 36, 29, 22, 15,
        23, 30, 37, 44, 51, 58,
        59, 52, 45, 38, 31,
        39, 46, 53, 60,
        61, 54, 47,
        55, 62,
        63
    ]);

    var dctCos1  =  4017   // cos(pi/16)
    var dctSin1  =   799   // sin(pi/16)
    var dctCos3  =  3406   // cos(3*pi/16)
    var dctSin3  =  2276   // sin(3*pi/16)
    var dctCos6  =  1567   // cos(6*pi/16)
    var dctSin6  =  3784   // sin(6*pi/16)
    var dctSqrt2 =  5793   // sqrt(2)
    var dctSqrt1d2 = 2896  // sqrt(2) / 2

    function constructor() {
    }

    function buildHuffmanTable(codeLengths, values) {
        var k = 0, code = [], i, j, length = 16;
        while (length > 0 && !codeLengths[length - 1])
            length--;
        code.push({children: [], index: 0});
        var p = code[0], q;
        for (i = 0; i < length; i++) {
            for (j = 0; j < codeLengths[i]; j++) {
                p = code.pop();
                p.children[p.index] = values[k];
                while (p.index > 0) {
                    p = code.pop();
                }
                p.index++;
                code.push(p);
                while (code.length <= i) {
                    code.push(q = {children: [], index: 0});
                    p.children[p.index] = q.children;
                    p = q;
                }
                k++;
            }
            if (i + 1 < length) {
                // p here points to last code
                code.push(q = {children: [], index: 0});
                p.children[p.index] = q.children;
                p = q;
            }
        }
        return code[0].children;
    }

    function getBlockBufferOffset(component, row, col) {
        return 64 * ((component.blocksPerLine + 1) * row + col);
    }

    function decodeScan(data, offset,
                        frame, components, resetInterval,
                        spectralStart, spectralEnd,
                        successivePrev, successive) {
        var precision = frame.precision;
        var samplesPerLine = frame.samplesPerLine;
        var scanLines = frame.scanLines;
        var mcusPerLine = frame.mcusPerLine;
        var progressive = frame.progressive;
        var maxH = frame.maxH, maxV = frame.maxV;

        var startOffset = offset, bitsData = 0, bitsCount = 0;

        function readBit() {
            if (bitsCount > 0) {
                bitsCount--;
                return (bitsData >> bitsCount) & 1;
            }
            bitsData = data[offset++];
            if (bitsData == 0xFF) {
                var nextByte = data[offset++];
                if (nextByte) {
                    throw "unexpected marker: " + ((bitsData << 8) | nextByte).toString(16);
                }
                // unstuff 0
            }
            bitsCount = 7;
            return bitsData >>> 7;
        }

        function decodeHuffman(tree) {
            var node = tree;
            var bit;
            while ((bit = readBit()) !== null) {
                node = node[bit];
                if (typeof node === 'number')
                    return node;
                if (typeof node !== 'object')
                    throw "invalid huffman sequence";
            }
            return null;
        }

        function receive(length) {
            var n = 0;
            while (length > 0) {
                var bit = readBit();
                if (bit === null) return;
                n = (n << 1) | bit;
                length--;
            }
            return n;
        }

        function receiveAndExtend(length) {
            var n = receive(length);
            if (n >= 1 << (length - 1))
                return n;
            return n + (-1 << length) + 1;
        }

        function decodeBaseline(component, offset) {
            var t = decodeHuffman(component.huffmanTableDC);
            var diff = t === 0 ? 0 : receiveAndExtend(t);
            component.blockData[offset] = (component.pred += diff);
            var k = 1;
            while (k < 64) {
                var rs = decodeHuffman(component.huffmanTableAC);
                var s = rs & 15, r = rs >> 4;
                if (s === 0) {
                    if (r < 15)
                        break;
                    k += 16;
                    continue;
                }
                k += r;
                var z = dctZigZag[k];
                component.blockData[offset + z] = receiveAndExtend(s);
                k++;
            }
        }

        function decodeDCFirst(component, offset) {
            var t = decodeHuffman(component.huffmanTableDC);
            var diff = t === 0 ? 0 : (receiveAndExtend(t) << successive);
            component.blockData[offset] = (component.pred += diff);
        }

        function decodeDCSuccessive(component, offset) {
            component.blockData[offset] |= readBit() << successive;
        }

        var eobrun = 0;
        function decodeACFirst(component, offset) {
            if (eobrun > 0) {
                eobrun--;
                return;
            }
            var k = spectralStart, e = spectralEnd;
            while (k <= e) {
                var rs = decodeHuffman(component.huffmanTableAC);
                var s = rs & 15, r = rs >> 4;
                if (s === 0) {
                    if (r < 15) {
                        eobrun = receive(r) + (1 << r) - 1;
                        break;
                    }
                    k += 16;
                    continue;
                }
                k += r;
                var z = dctZigZag[k];
                component.blockData[offset + z] = receiveAndExtend(s) * (1 << successive);
                k++;
            }
        }

        var successiveACState = 0, successiveACNextValue;
        function decodeACSuccessive(component, offset) {
            var k = spectralStart, e = spectralEnd, r = 0;
            while (k <= e) {
                var z = dctZigZag[k];
                switch (successiveACState) {
                    case 0: // initial state
                        var rs = decodeHuffman(component.huffmanTableAC);
                        var s = rs & 15, r = rs >> 4;
                        if (s === 0) {
                            if (r < 15) {
                                eobrun = receive(r) + (1 << r);
                                successiveACState = 4;
                            } else {
                                r = 16;
                                successiveACState = 1;
                            }
                        } else {
                            if (s !== 1)
                                throw "invalid ACn encoding";
                            successiveACNextValue = receiveAndExtend(s);
                            successiveACState = r ? 2 : 3;
                        }
                        continue;
                    case 1: // skipping r zero items
                    case 2:
                        if (component.blockData[offset + z]) {
                            component.blockData[offset + z] += (readBit() << successive);
                        } else {
                            r--;
                            if (r === 0)
                                successiveACState = successiveACState == 2 ? 3 : 0;
                        }
                        break;
                    case 3: // set value for a zero item
                        if (component.blockData[offset + z]) {
                            component.blockData[offset + z] += (readBit() << successive);
                        } else {
                            component.blockData[offset + z] = successiveACNextValue << successive;
                            successiveACState = 0;
                        }
                        break;
                    case 4: // eob
                        if (component.blockData[offset + z]) {
                            component.blockData[offset + z] += (readBit() << successive);
                        }
                        break;
                }
                k++;
            }
            if (successiveACState === 4) {
                eobrun--;
                if (eobrun === 0)
                    successiveACState = 0;
            }
        }

        function decodeMcu(component, decode, mcu, row, col) {
            var mcuRow = (mcu / mcusPerLine) | 0;
            var mcuCol = mcu % mcusPerLine;
            var blockRow = mcuRow * component.v + row;
            var blockCol = mcuCol * component.h + col;
            var offset = getBlockBufferOffset(component, blockRow, blockCol);
            decode(component, offset);
        }

        function decodeBlock(component, decode, mcu) {
            var blockRow = (mcu / component.blocksPerLine) | 0;
            var blockCol = mcu % component.blocksPerLine;
            var offset = getBlockBufferOffset(component, blockRow, blockCol);
            decode(component, offset);
        }

        var componentsLength = components.length;
        var component, i, j, k, n;
        var decodeFn;
        if (progressive) {
            if (spectralStart === 0)
                decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
            else
                decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
        } else {
            decodeFn = decodeBaseline;
        }

        var mcu = 0, marker;
        var mcuExpected;
        if (componentsLength == 1) {
            mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
        } else {
            mcuExpected = mcusPerLine * frame.mcusPerColumn;
        }
        if (!resetInterval) {
            resetInterval = mcuExpected;
        }

        var h, v;
        while (mcu < mcuExpected) {
            // reset interval stuff
            for (i = 0; i < componentsLength; i++) {
                components[i].pred = 0;
            }
            eobrun = 0;

            if (componentsLength == 1) {
                component = components[0];
                for (n = 0; n < resetInterval; n++) {
                    decodeBlock(component, decodeFn, mcu);
                    mcu++;
                }
            } else {
                for (n = 0; n < resetInterval; n++) {
                    for (i = 0; i < componentsLength; i++) {
                        component = components[i];
                        h = component.h;
                        v = component.v;
                        for (j = 0; j < v; j++) {
                            for (k = 0; k < h; k++) {
                                decodeMcu(component, decodeFn, mcu, j, k);
                            }
                        }
                    }
                    mcu++;
                }
            }

            // find marker
            bitsCount = 0;
            marker = (data[offset] << 8) | data[offset + 1];
            if (marker <= 0xFF00) {
                throw "marker was not found";
            }

            if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
                offset += 2;
            } else {
                break;
            }
        }

        return offset - startOffset;
    }

    // A port of poppler's IDCT method which in turn is taken from:
    //   Christoph Loeffler, Adriaan Ligtenberg, George S. Moschytz,
    //   "Practical Fast 1-D DCT Algorithms with 11 Multiplications",
    //   IEEE Intl. Conf. on Acoustics, Speech & Signal Processing, 1989,
    //   988-991.
    function quantizeAndInverse(component, blockBufferOffset, p) {
        var qt = component.quantizationTable;
        var v0, v1, v2, v3, v4, v5, v6, v7, t;
        var i;

        // dequant
        for (i = 0; i < 64; i++) {
            p[i] = component.blockData[blockBufferOffset + i] * qt[i];
        }

        // inverse DCT on rows
        for (i = 0; i < 8; ++i) {
            var row = 8 * i;

            // check for all-zero AC coefficients
            if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 &&
                p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 &&
                p[7 + row] == 0) {
                t = (dctSqrt2 * p[0 + row] + 512) >> 10;
                p[0 + row] = t;
                p[1 + row] = t;
                p[2 + row] = t;
                p[3 + row] = t;
                p[4 + row] = t;
                p[5 + row] = t;
                p[6 + row] = t;
                p[7 + row] = t;
                continue;
            }

            // stage 4
            v0 = (dctSqrt2 * p[0 + row] + 128) >> 8;
            v1 = (dctSqrt2 * p[4 + row] + 128) >> 8;
            v2 = p[2 + row];
            v3 = p[6 + row];
            v4 = (dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128) >> 8;
            v7 = (dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128) >> 8;
            v5 = p[3 + row] << 4;
            v6 = p[5 + row] << 4;

            // stage 3
            t = (v0 - v1+ 1) >> 1;
            v0 = (v0 + v1 + 1) >> 1;
            v1 = t;
            t = (v2 * dctSin6 + v3 * dctCos6 + 128) >> 8;
            v2 = (v2 * dctCos6 - v3 * dctSin6 + 128) >> 8;
            v3 = t;
            t = (v4 - v6 + 1) >> 1;
            v4 = (v4 + v6 + 1) >> 1;
            v6 = t;
            t = (v7 + v5 + 1) >> 1;
            v5 = (v7 - v5 + 1) >> 1;
            v7 = t;

            // stage 2
            t = (v0 - v3 + 1) >> 1;
            v0 = (v0 + v3 + 1) >> 1;
            v3 = t;
            t = (v1 - v2 + 1) >> 1;
            v1 = (v1 + v2 + 1) >> 1;
            v2 = t;
            t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
            v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
            v7 = t;
            t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
            v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
            v6 = t;

            // stage 1
            p[0 + row] = v0 + v7;
            p[7 + row] = v0 - v7;
            p[1 + row] = v1 + v6;
            p[6 + row] = v1 - v6;
            p[2 + row] = v2 + v5;
            p[5 + row] = v2 - v5;
            p[3 + row] = v3 + v4;
            p[4 + row] = v3 - v4;
        }

        // inverse DCT on columns
        for (i = 0; i < 8; ++i) {
            var col = i;

            // check for all-zero AC coefficients
            if (p[1*8 + col] == 0 && p[2*8 + col] == 0 && p[3*8 + col] == 0 &&
                p[4*8 + col] == 0 && p[5*8 + col] == 0 && p[6*8 + col] == 0 &&
                p[7*8 + col] == 0) {
                t = (dctSqrt2 * p[i+0] + 8192) >> 14;
                p[0*8 + col] = t;
                p[1*8 + col] = t;
                p[2*8 + col] = t;
                p[3*8 + col] = t;
                p[4*8 + col] = t;
                p[5*8 + col] = t;
                p[6*8 + col] = t;
                p[7*8 + col] = t;
                continue;
            }

            // stage 4
            v0 = (dctSqrt2 * p[0*8 + col] + 2048) >> 12;
            v1 = (dctSqrt2 * p[4*8 + col] + 2048) >> 12;
            v2 = p[2*8 + col];
            v3 = p[6*8 + col];
            v4 = (dctSqrt1d2 * (p[1*8 + col] - p[7*8 + col]) + 2048) >> 12;
            v7 = (dctSqrt1d2 * (p[1*8 + col] + p[7*8 + col]) + 2048) >> 12;
            v5 = p[3*8 + col];
            v6 = p[5*8 + col];

            // stage 3
            t = (v0 - v1 + 1) >> 1;
            v0 = (v0 + v1 + 1) >> 1;
            v1 = t;
            t = (v2 * dctSin6 + v3 * dctCos6 + 2048) >> 12;
            v2 = (v2 * dctCos6 - v3 * dctSin6 + 2048) >> 12;
            v3 = t;
            t = (v4 - v6 + 1) >> 1;
            v4 = (v4 + v6 + 1) >> 1;
            v6 = t;
            t = (v7 + v5 + 1) >> 1;
            v5 = (v7 - v5 + 1) >> 1;
            v7 = t;

            // stage 2
            t = (v0 - v3 + 1) >> 1;
            v0 = (v0 + v3 + 1) >> 1;
            v3 = t;
            t = (v1 - v2 + 1) >> 1;
            v1 = (v1 + v2 + 1) >> 1;
            v2 = t;
            t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
            v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
            v7 = t;
            t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
            v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
            v6 = t;

            // stage 1
            p[0*8 + col] = v0 + v7;
            p[7*8 + col] = v0 - v7;
            p[1*8 + col] = v1 + v6;
            p[6*8 + col] = v1 - v6;
            p[2*8 + col] = v2 + v5;
            p[5*8 + col] = v2 - v5;
            p[3*8 + col] = v3 + v4;
            p[4*8 + col] = v3 - v4;
        }

        // convert to 8-bit integers
        for (i = 0; i < 64; ++i) {
            var index = blockBufferOffset + i;
            var q = p[i];
            q = (q <= -2056) ? 0 : (q >= 2024) ? 255 : (q + 2056) >> 4;
            component.blockData[index] = q;
        }
    }

    function buildComponentData(frame, component) {
        var lines = [];
        var blocksPerLine = component.blocksPerLine;
        var blocksPerColumn = component.blocksPerColumn;
        var samplesPerLine = blocksPerLine << 3;
        var computationBuffer = new Int32Array(64);

        var i, j, ll = 0;
        for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
            for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
                var offset = getBlockBufferOffset(component, blockRow, blockCol)
                quantizeAndInverse(component, offset, computationBuffer);
            }
        }
        return component.blockData;
    }

    function clampToUint8(a) {
        return a <= 0 ? 0 : a >= 255 ? 255 : a | 0;
    }

    constructor.prototype = {
        load: function load(path) {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = (function() {
                // TODO catch parse error
                var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
                this.parse(data);
                if (this.onload)
                    this.onload();
            }).bind(this);
            xhr.send(null);
        },

        loadFromBuffer: function loadFromBuffer(arrayBuffer) {
            this.parse(arrayBuffer);
            if (this.onload)
                this.onload();
        },

        parse: function parse(data) {

            function readUint16() {
                var value = (data[offset] << 8) | data[offset + 1];
                offset += 2;
                return value;
            }

            function readDataBlock() {
                var length = readUint16();
                var array = data.subarray(offset, offset + length - 2);
                offset += array.length;
                return array;
            }

            function prepareComponents(frame) {
                var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / frame.maxH);
                var mcusPerColumn = Math.ceil(frame.scanLines / 8 / frame.maxV);
                for (var i = 0; i < frame.components.length; i++) {
                    component = frame.components[i];
                    var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / frame.maxH);
                    var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines  / 8) * component.v / frame.maxV);
                    var blocksPerLineForMcu = mcusPerLine * component.h;
                    var blocksPerColumnForMcu = mcusPerColumn * component.v;

                    var blocksBufferSize = 64 * blocksPerColumnForMcu
                        * (blocksPerLineForMcu + 1);
                    component.blockData = new Int16Array(blocksBufferSize);
                    component.blocksPerLine = blocksPerLine;
                    component.blocksPerColumn = blocksPerColumn;
                }
                frame.mcusPerLine = mcusPerLine;
                frame.mcusPerColumn = mcusPerColumn;
            }

            var offset = 0, length = data.length;
            var jfif = null;
            var adobe = null;
            var pixels = null;
            var frame, resetInterval;
            var quantizationTables = [];
            var huffmanTablesAC = [], huffmanTablesDC = [];
            var fileMarker = readUint16();
            if (fileMarker != 0xFFD8) { // SOI (Start of Image)
                throw "SOI not found";
            }

            fileMarker = readUint16();
            while (fileMarker != 0xFFD9) { // EOI (End of image)
                var i, j, l;
                switch(fileMarker) {
                    case 0xFFE0: // APP0 (Application Specific)
                    case 0xFFE1: // APP1
                    case 0xFFE2: // APP2
                    case 0xFFE3: // APP3
                    case 0xFFE4: // APP4
                    case 0xFFE5: // APP5
                    case 0xFFE6: // APP6
                    case 0xFFE7: // APP7
                    case 0xFFE8: // APP8
                    case 0xFFE9: // APP9
                    case 0xFFEA: // APP10
                    case 0xFFEB: // APP11
                    case 0xFFEC: // APP12
                    case 0xFFED: // APP13
                    case 0xFFEE: // APP14
                    case 0xFFEF: // APP15
                    case 0xFFFE: // COM (Comment)
                        var appData = readDataBlock();

                        if (fileMarker === 0xFFE0) {
                            if (appData[0] === 0x4A && appData[1] === 0x46 && appData[2] === 0x49 &&
                                appData[3] === 0x46 && appData[4] === 0) { // 'JFIF\x00'
                                jfif = {
                                    version: { major: appData[5], minor: appData[6] },
                                    densityUnits: appData[7],
                                    xDensity: (appData[8] << 8) | appData[9],
                                    yDensity: (appData[10] << 8) | appData[11],
                                    thumbWidth: appData[12],
                                    thumbHeight: appData[13],
                                    thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                                };
                            }
                        }
                        // TODO APP1 - Exif
                        if (fileMarker === 0xFFEE) {
                            if (appData[0] === 0x41 && appData[1] === 0x64 && appData[2] === 0x6F &&
                                appData[3] === 0x62 && appData[4] === 0x65 && appData[5] === 0) { // 'Adobe\x00'
                                adobe = {
                                    version: appData[6],
                                    flags0: (appData[7] << 8) | appData[8],
                                    flags1: (appData[9] << 8) | appData[10],
                                    transformCode: appData[11]
                                };
                            }
                        }
                        break;

                    case 0xFFDB: // DQT (Define Quantization Tables)
                        var quantizationTablesLength = readUint16();
                        var quantizationTablesEnd = quantizationTablesLength + offset - 2;
                        while (offset < quantizationTablesEnd) {
                            var quantizationTableSpec = data[offset++];
                            var tableData = new Int32Array(64);
                            if ((quantizationTableSpec >> 4) === 0) { // 8 bit values
                                for (j = 0; j < 64; j++) {
                                    var z = dctZigZag[j];
                                    tableData[z] = data[offset++];
                                }
                            } else if ((quantizationTableSpec >> 4) === 1) { //16 bit
                                for (j = 0; j < 64; j++) {
                                    var z = dctZigZag[j];
                                    tableData[z] = readUint16();
                                }
                            } else
                                throw "DQT: invalid table spec";
                            quantizationTables[quantizationTableSpec & 15] = tableData;
                        }
                        break;

                    case 0xFFC0: // SOF0 (Start of Frame, Baseline DCT)
                    case 0xFFC1: // SOF1 (Start of Frame, Extended DCT)
                    case 0xFFC2: // SOF2 (Start of Frame, Progressive DCT)
                        if (frame) {
                            throw "Only single frame JPEGs supported";
                        }
                        readUint16(); // skip data length
                        frame = {};
                        frame.extended = (fileMarker === 0xFFC1);
                        frame.progressive = (fileMarker === 0xFFC2);
                        frame.precision = data[offset++];
                        frame.scanLines = readUint16();
                        frame.samplesPerLine = readUint16();
                        frame.components = [];
                        frame.componentIds = {};
                        var componentsCount = data[offset++], componentId;
                        var maxH = 0, maxV = 0;
                        for (i = 0; i < componentsCount; i++) {
                            componentId = data[offset];
                            var h = data[offset + 1] >> 4;
                            var v = data[offset + 1] & 15;
                            if (maxH < h) maxH = h;
                            if (maxV < v) maxV = v;
                            var qId = data[offset + 2];
                            var l = frame.components.push({
                                h: h,
                                v: v,
                                quantizationTable: quantizationTables[qId]
                            });
                            frame.componentIds[componentId] = l - 1;
                            offset += 3;
                        }
                        frame.maxH = maxH;
                        frame.maxV = maxV;
                        prepareComponents(frame);
                        break;

                    case 0xFFC4: // DHT (Define Huffman Tables)
                        var huffmanLength = readUint16();
                        for (i = 2; i < huffmanLength;) {
                            var huffmanTableSpec = data[offset++];
                            var codeLengths = new Uint8Array(16);
                            var codeLengthSum = 0;
                            for (j = 0; j < 16; j++, offset++)
                                codeLengthSum += (codeLengths[j] = data[offset]);
                            var huffmanValues = new Uint8Array(codeLengthSum);
                            for (j = 0; j < codeLengthSum; j++, offset++)
                                huffmanValues[j] = data[offset];
                            i += 17 + codeLengthSum;

                            ((huffmanTableSpec >> 4) === 0 ?
                                huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] =
                                buildHuffmanTable(codeLengths, huffmanValues);
                        }
                        break;

                    case 0xFFDD: // DRI (Define Restart Interval)
                        readUint16(); // skip data length
                        resetInterval = readUint16();
                        break;

                    case 0xFFDA: // SOS (Start of Scan)
                        var scanLength = readUint16();
                        var selectorsCount = data[offset++];
                        var components = [], component;
                        for (i = 0; i < selectorsCount; i++) {
                            var componentIndex = frame.componentIds[data[offset++]];
                            component = frame.components[componentIndex];
                            var tableSpec = data[offset++];
                            component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
                            component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
                            components.push(component);
                        }
                        var spectralStart = data[offset++];
                        var spectralEnd = data[offset++];
                        var successiveApproximation = data[offset++];
                        var processed = decodeScan(data, offset,
                            frame, components, resetInterval,
                            spectralStart, spectralEnd,
                            successiveApproximation >> 4, successiveApproximation & 15);
                        offset += processed;
                        break;
                    default:
                        if (data[offset - 3] == 0xFF &&
                            data[offset - 2] >= 0xC0 && data[offset - 2] <= 0xFE) {
                            // could be incorrect encoding -- last 0xFF byte of the previous
                            // block was eaten by the encoder
                            offset -= 3;
                            break;
                        }
                        throw "unknown JPEG marker " + fileMarker.toString(16);
                }
                fileMarker = readUint16();
            }

            this.width = frame.samplesPerLine;
            this.height = frame.scanLines;
            this.jfif = jfif;
            this.adobe = adobe;
            this.components = [];
            for (var i = 0; i < frame.components.length; i++) {
                var component = frame.components[i];
                this.components.push({
                    output: buildComponentData(frame, component),
                    scaleX: component.h / frame.maxH,
                    scaleY: component.v / frame.maxV,
                    blocksPerLine: component.blocksPerLine,
                    blocksPerColumn: component.blocksPerColumn
                });
            }
        },

        getData: function getData(imageData, width, height) {
            var scaleX = this.width / width, scaleY = this.height / height;

            var component, componentScaleX, componentScaleY;
            var x, y, i;
            var offset = 0;
            var Y, Cb, Cr, K, C, M, Ye, R, G, B;
            var colorTransform;
            var numComponents = this.components.length;
            var dataLength = width * height * numComponents;
            //var data = new Uint8Array(dataLength);
            var data = imageData.data;
            var componentLine;

            // lineData is reused for all components. Assume first component is
            // the biggest
            var lineData = new Uint8Array((this.components[0].blocksPerLine << 3) *
                this.components[0].blocksPerColumn * 8);

            // First construct image data ...
            for (i = 0; i < numComponents; i++) {
                component = this.components[i < 3 ? 2 - i : i];
                var blocksPerLine = component.blocksPerLine;
                var blocksPerColumn = component.blocksPerColumn;
                var samplesPerLine = blocksPerLine << 3;

                var j, k, ll = 0;
                var lineOffset = 0;
                for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
                    var scanLine = blockRow << 3;
                    for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
                        var bufferOffset = getBlockBufferOffset(component, blockRow, blockCol);
                        var offset = 0, sample = blockCol << 3;
                        for (j = 0; j < 8; j++) {
                            var lineOffset = (scanLine + j) * samplesPerLine;
                            for (k = 0; k < 8; k++) {
                                lineData[lineOffset + sample + k] =
                                    component.output[bufferOffset + offset++];
                            }
                        }
                    }
                }

                componentScaleX = component.scaleX * scaleX;
                componentScaleY = component.scaleY * scaleY;
                offset = i;

                var cx, cy;
                var index;
                for (y = 0; y < height; y++) {
                    for (x = 0; x < width; x++) {
                        cy = 0 | (y * componentScaleY);
                        cx = 0 | (x * componentScaleX);
                        index = cy * samplesPerLine + cx;
                        data[offset] = lineData[index];
                        offset += numComponents;
                    }
                }
            }

          /*
           // ... then transform colors, if necessary
           switch (numComponents) {
           case 1: case 2: break;
           // no color conversion for one or two compoenents

           case 3:
           // The default transform for three components is true
           colorTransform = true;
           // The adobe transform marker overrides any previous setting
           if (this.adobe && this.adobe.transformCode)
           colorTransform = true;
           else if (typeof this.colorTransform !== 'undefined')
           colorTransform = !!this.colorTransform;

           if (colorTransform) {
           for (i = 0; i < dataLength; i += numComponents) {
           Y  = data[i    ];
           Cb = data[i + 1];
           Cr = data[i + 2];

           R = clampToUint8(Y - 179.456 + 1.402 * Cr);
           G = clampToUint8(Y + 135.459 - 0.344 * Cb - 0.714 * Cr);
           B = clampToUint8(Y - 226.816 + 1.772 * Cb);

           data[i    ] = R;
           data[i + 1] = G;
           data[i + 2] = B;
           }
           }
           break;
           case 4:
           console.log(this.colorTransform);
           if (!this.adobe)
           throw 'Unsupported color mode (4 components)';
           // The default transform for four components is false
           colorTransform = false;
           // The adobe transform marker overrides any previous setting
           if (this.adobe && this.adobe.transformCode)
           colorTransform = true;
           else if (typeof this.colorTransform !== 'undefined')
           colorTransform = !!this.colorTransform;

           if (colorTransform) {
           for (i = 0; i < dataLength; i += numComponents) {
           Y  = data[i];
           Cb = data[i + 1];
           Cr = data[i + 2];

           C = clampToUint8(434.456 - Y - 1.402 * Cr);
           M = clampToUint8(119.541 - Y + 0.344 * Cb + 0.714 * Cr);
           Y = clampToUint8(481.816 - Y - 1.772 * Cb);

           data[i    ] = C;
           data[i + 1] = M;
           data[i + 2] = Y;
           // K is unchanged
           }
           }
           break;
           default:
           throw 'Unsupported color mode';
           }
           */
            return data;
        },
        copyToImageData: function copyToImageData(imageData) {
            var width = imageData.width, height = imageData.height;
            var imageDataBytes = width * height * 4;
            var imageDataArray = imageData.data;
            var data = this.getData(width, height);
            var i = 0, j = 0, k0, k1;
            var Y, K, C, M, R, G, B;
            switch (this.components.length) {
                case 1:
                    while (j < imageDataBytes) {
                        Y = data[i++];

                        imageDataArray[j++] = Y;
                        imageDataArray[j++] = Y;
                        imageDataArray[j++] = Y;
                        imageDataArray[j++] = 255;
                    }
                    break;
                case 3:
                    while (j < imageDataBytes) {
                        R = data[i++];
                        G = data[i++];
                        B = data[i++];

                        imageDataArray[j++] = R;
                        imageDataArray[j++] = G;
                        imageDataArray[j++] = B;
                        imageDataArray[j++] = 255;
                    }
                    break;
                case 4:
                    while (j < imageDataBytes) {
                        C = data[i++];
                        M = data[i++];
                        Y = data[i++];
                        K = data[i++];

                        k0 = 255 - K;
                        k1 = k0 / 255;


                        R = clampToUint8(k0 - C * k1);
                        G = clampToUint8(k0 - M * k1);
                        B = clampToUint8(k0 - Y * k1);

                        imageDataArray[j++] = R;
                        imageDataArray[j++] = G;
                        imageDataArray[j++] = B;
                        imageDataArray[j++] = 255;
                    }
                    break;
                default:
                    throw 'Unsupported color mode';
            }
        }
    };

    return constructor;
})();

module.exports = function decode (data) {
    const jpegImage = new JpegImage();

    jpegImage.loadFromBuffer(data);

    var imageData;
    if (typeof ImageData !== 'undefined') {
        imageData = new ImageData(jpegImage.width, jpegImage.height);
    } else {
        imageData = {
            width: jpegImage.width,
            height: jpegImage.height,
            data: new Uint8ClampedArray(jpegImage.width * jpegImage.height * 4)
        };
    }
    jpegImage.getData(imageData, jpegImage.width, jpegImage.height);

    return imageData;
};

},{}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsImJscC9ibHBpbWFnZS5qcyIsImJscC9kZWNvZGUuanMiLCJkb2NzL2RlY29kZWJscC9kZWNvZGVibHAuanMiLCJ0aGlyZF9wYXJ0eS9kZWNvZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBCTFBUeXBlO1xuKGZ1bmN0aW9uIChCTFBUeXBlKSB7XG4gICAgQkxQVHlwZVtCTFBUeXBlW1wiQkxQMFwiXSA9IDBdID0gXCJCTFAwXCI7XG4gICAgQkxQVHlwZVtCTFBUeXBlW1wiQkxQMVwiXSA9IDFdID0gXCJCTFAxXCI7XG4gICAgQkxQVHlwZVtCTFBUeXBlW1wiQkxQMlwiXSA9IDJdID0gXCJCTFAyXCI7XG59KShCTFBUeXBlID0gZXhwb3J0cy5CTFBUeXBlIHx8IChleHBvcnRzLkJMUFR5cGUgPSB7fSkpO1xudmFyIEJMUENvbnRlbnQ7XG4oZnVuY3Rpb24gKEJMUENvbnRlbnQpIHtcbiAgICBCTFBDb250ZW50W0JMUENvbnRlbnRbXCJKUEVHXCJdID0gMF0gPSBcIkpQRUdcIjtcbiAgICBCTFBDb250ZW50W0JMUENvbnRlbnRbXCJEaXJlY3RcIl0gPSAxXSA9IFwiRGlyZWN0XCI7XG59KShCTFBDb250ZW50ID0gZXhwb3J0cy5CTFBDb250ZW50IHx8IChleHBvcnRzLkJMUENvbnRlbnQgPSB7fSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YmxwaW1hZ2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZGVjb2RlSlBFRyA9IHJlcXVpcmUoXCIuLi90aGlyZF9wYXJ0eS9kZWNvZGVyXCIpO1xudmFyIGJscGltYWdlXzEgPSByZXF1aXJlKFwiLi9ibHBpbWFnZVwiKTtcbmZ1bmN0aW9uIGtleXdvcmQodmlldywgb2Zmc2V0KSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUodmlldy5nZXRVaW50OChvZmZzZXQpLCB2aWV3LmdldFVpbnQ4KG9mZnNldCArIDEpLCB2aWV3LmdldFVpbnQ4KG9mZnNldCArIDIpLCB2aWV3LmdldFVpbnQ4KG9mZnNldCArIDMpKTtcbn1cbmZ1bmN0aW9uIHVpbnQzMih2aWV3LCBvZmZzZXQpIHtcbiAgICByZXR1cm4gdmlldy5nZXRVaW50MzIob2Zmc2V0ICogNCwgdHJ1ZSk7XG59XG5mdW5jdGlvbiBiaXRWYWwoZGF0YSwgYml0Q291bnQsIGluZGV4KSB7XG4gICAgLy8gb25seSAxLCA0IG9yIDggYml0c1xuICAgIHZhciBieXRlID0gZGF0YVtNYXRoLmZsb29yKGluZGV4ICogYml0Q291bnQgLyA4KV0sIHZhbHNQZXJCeXRlID0gOCAvIGJpdENvdW50O1xuICAgIHJldHVybiAoYnl0ZSA+PiAodmFsc1BlckJ5dGUgLSBpbmRleCAlIHZhbHNQZXJCeXRlIC0gMSkpICYgKCgxIDw8IGJpdENvdW50KSAtIDEpO1xufVxuLy8gbm9kZS5qcyBoYXZlIG5vIG5hdGl2ZSBJbWFnZURhdGFcbmZ1bmN0aW9uIGNyZWF0ZUltYWdlRGF0YSh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgaWYgKHR5cGVvZiBJbWFnZURhdGEgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBuZXcgSW1hZ2VEYXRhKHdpZHRoLCBoZWlnaHQpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAgICAgZGF0YTogbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHdpZHRoICogaGVpZ2h0ICogNClcbiAgICAgICAgfTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZWNvZGUoYXJyYXlCdWZmZXIpIHtcbiAgICB2YXIgdmlldyA9IG5ldyBEYXRhVmlldyhhcnJheUJ1ZmZlcik7XG4gICAgdmFyIGltYWdlID0ge1xuICAgICAgICB0eXBlOiBibHBpbWFnZV8xLkJMUFR5cGUuQkxQMSxcbiAgICAgICAgd2lkdGg6IDAsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgY29udGVudDogYmxwaW1hZ2VfMS5CTFBDb250ZW50LkpQRUcsXG4gICAgICAgIGFscGhhQml0czogMCxcbiAgICAgICAgbWlwbWFwczogW10sXG4gICAgICAgIGRhdGE6IGFycmF5QnVmZmVyLFxuICAgIH07XG4gICAgdmFyIHR5cGUgPSBrZXl3b3JkKHZpZXcsIDApO1xuICAgIGlmICh0eXBlID09PSAnQkxQMCcgfHwgdHlwZSA9PT0gJ0JMUDInKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQkxQMC9CTFAyIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgIT09ICdCTFAxJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhIGJscCBpbWFnZScpO1xuICAgIH1cbiAgICBpbWFnZS5jb250ZW50ID0gdWludDMyKHZpZXcsIDEpO1xuICAgIGlmIChpbWFnZS5jb250ZW50ICE9PSBibHBpbWFnZV8xLkJMUENvbnRlbnQuSlBFRyAmJiBpbWFnZS5jb250ZW50ICE9PSBibHBpbWFnZV8xLkJMUENvbnRlbnQuRGlyZWN0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBCTFAgY29udGVudCcpO1xuICAgIH1cbiAgICBpbWFnZS5hbHBoYUJpdHMgPSB1aW50MzIodmlldywgMik7XG4gICAgaW1hZ2Uud2lkdGggPSB1aW50MzIodmlldywgMyk7XG4gICAgaW1hZ2UuaGVpZ2h0ID0gdWludDMyKHZpZXcsIDQpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7ICsraSkge1xuICAgICAgICB2YXIgbWlwbWFwID0ge1xuICAgICAgICAgICAgb2Zmc2V0OiB1aW50MzIodmlldywgNyArIGkpLFxuICAgICAgICAgICAgc2l6ZTogdWludDMyKHZpZXcsIDcgKyAxNiArIGkpXG4gICAgICAgIH07XG4gICAgICAgIGlmIChtaXBtYXAuc2l6ZSA+IDApIHtcbiAgICAgICAgICAgIGltYWdlLm1pcG1hcHMucHVzaChtaXBtYXApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGltYWdlO1xufVxuZXhwb3J0cy5kZWNvZGUgPSBkZWNvZGU7XG5mdW5jdGlvbiBnZXRJbWFnZURhdGEoYmxwLCBtaXBtYXBMZXZlbCkge1xuICAgIHZhciB2aWV3ID0gbmV3IERhdGFWaWV3KGJscC5kYXRhKSwgdWludDhEYXRhID0gbmV3IFVpbnQ4QXJyYXkoYmxwLmRhdGEpLCBtaXBtYXAgPSBibHAubWlwbWFwc1ttaXBtYXBMZXZlbF07XG4gICAgaWYgKGJscC5jb250ZW50ID09PSBibHBpbWFnZV8xLkJMUENvbnRlbnQuSlBFRykge1xuICAgICAgICB2YXIgaGVhZGVyU2l6ZSA9IHVpbnQzMih2aWV3LCAzOSksIGRhdGEgPSBuZXcgVWludDhBcnJheShoZWFkZXJTaXplICsgbWlwbWFwLnNpemUpO1xuICAgICAgICBkYXRhLnNldCh1aW50OERhdGEuc3ViYXJyYXkoNDAgKiA0LCA0MCAqIDQgKyBoZWFkZXJTaXplKSk7XG4gICAgICAgIGRhdGEuc2V0KHVpbnQ4RGF0YS5zdWJhcnJheShtaXBtYXAub2Zmc2V0LCBtaXBtYXAub2Zmc2V0ICsgbWlwbWFwLnNpemUpLCBoZWFkZXJTaXplKTtcbiAgICAgICAgcmV0dXJuIGRlY29kZUpQRUcoZGF0YSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgcGFsZXR0ZSA9IG5ldyBVaW50OEFycmF5KGJscC5kYXRhLCAzOSAqIDQsIDI1NiAqIDQpLCB3aWR0aCA9IGJscC53aWR0aCAvICgxIDw8IG1pcG1hcExldmVsKSwgaGVpZ2h0ID0gYmxwLmhlaWdodCAvICgxIDw8IG1pcG1hcExldmVsKSwgc2l6ZSA9IHdpZHRoICogaGVpZ2h0LCBhbHBoYURhdGEgPSBuZXcgVWludDhBcnJheShibHAuZGF0YSwgbWlwbWFwLm9mZnNldCArIHNpemUsIE1hdGguY2VpbChzaXplICogYmxwLmFscGhhQml0cyAvIDgpKSwgaW1hZ2VEYXRhID0gY3JlYXRlSW1hZ2VEYXRhKHdpZHRoLCBoZWlnaHQpLCB2YWxQZXJBbHBoYUJpdCA9IDI1NSAvICgoMSA8PCBibHAuYWxwaGFCaXRzKSAtIDEpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7ICsraSkge1xuICAgICAgICAgICAgdmFyIHBhbGV0dGVJbmRleCA9IHZpZXcuZ2V0VWludDgobWlwbWFwLm9mZnNldCArIGkpICogNDtcbiAgICAgICAgICAgIC8vIEJHUkEgb3JkZXJcbiAgICAgICAgICAgIGltYWdlRGF0YS5kYXRhW2kgKiA0XSA9IHBhbGV0dGVbcGFsZXR0ZUluZGV4ICsgMl07XG4gICAgICAgICAgICBpbWFnZURhdGEuZGF0YVtpICogNCArIDFdID0gcGFsZXR0ZVtwYWxldHRlSW5kZXggKyAxXTtcbiAgICAgICAgICAgIGltYWdlRGF0YS5kYXRhW2kgKiA0ICsgMl0gPSBwYWxldHRlW3BhbGV0dGVJbmRleF07XG4gICAgICAgICAgICBpZiAoYmxwLmFscGhhQml0cyA+IDApIHtcbiAgICAgICAgICAgICAgICBpbWFnZURhdGEuZGF0YVtpICogNCArIDNdID0gYml0VmFsKGFscGhhRGF0YSwgYmxwLmFscGhhQml0cywgaSkgKiB2YWxQZXJBbHBoYUJpdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGltYWdlRGF0YS5kYXRhW2kgKiA0ICsgM10gPSAyNTU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGltYWdlRGF0YTtcbiAgICB9XG59XG5leHBvcnRzLmdldEltYWdlRGF0YSA9IGdldEltYWdlRGF0YTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlY29kZS5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZGVjb2RlXzEgPSByZXF1aXJlKFwiLi4vLi4vYmxwL2RlY29kZVwiKTtcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiBpbml0KCkge1xuICAgIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuY29udGFpbmVyJyk7XG4gICAgdmFyIHByZXZpZXcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucHJldmlldycpO1xuICAgIHZhciBzYXZlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNhdmUnKTtcbiAgICB2YXIgbGFiZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubGFiZWwnKTtcbiAgICB2YXIgZHJvcFRhcmdldDtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcignZHJhZ2VudGVyJywgZnVuY3Rpb24gb25EcmFnRW50ZXIoZXZlbnQpIHtcbiAgICAgICAgZHJvcFRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoJ2NvbnRhaW5lcl9kcmFnJyk7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSk7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdsZWF2ZScsIGZ1bmN0aW9uIG9uRHJhZ0xlYXZlKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC50YXJnZXQgPT09IGRyb3BUYXJnZXQpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCdjb250YWluZXJfZHJhZycpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2RyYWdvdmVyJywgZnVuY3Rpb24gb25EcmFnTGVhdmUoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weSc7XG4gICAgfSk7XG4gICAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ2Ryb3AnLCBmdW5jdGlvbiBvbkRyb3AoZXZlbnQpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoJ2NvbnRhaW5lcl9kcmFnJyk7XG4gICAgICAgIHZhciBmaWxlID0gZXZlbnQuZGF0YVRyYW5zZmVyLmZpbGVzICYmIGV2ZW50LmRhdGFUcmFuc2Zlci5maWxlc1swXTtcbiAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHZhciBibHAgPSBkZWNvZGVfMS5kZWNvZGUocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYmxwKTtcbiAgICAgICAgICAgICAgICBjbGVhclByZXZpZXcoKTtcbiAgICAgICAgICAgICAgICBjb250YWluZXIuY2xhc3NMaXN0LmFkZCgnY29udGFpbmVyX2hpZGRlbicpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYmxwLm1pcG1hcHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGltYWdlRGF0YSA9IGRlY29kZV8xLmdldEltYWdlRGF0YShibHAsIGkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGltYWdlRGF0YS53aWR0aDtcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGltYWdlRGF0YS5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShpbWFnZURhdGEsIDAsIDApO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJldmlld0l0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlld0l0ZW0uY2xhc3NOYW1lID0gJ3ByZXZpZXctaXRlbSc7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmV2aWV3TGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgICAgICAgICAgcHJldmlld0xhYmVsLmNsYXNzTmFtZSA9ICdwcmV2aWV3LWl0ZW1fX2xhYmVsJztcbiAgICAgICAgICAgICAgICAgICAgcHJldmlld0xhYmVsLnRleHRDb250ZW50ID0gaW1hZ2VEYXRhLndpZHRoICsgXCJ4XCIgKyBpbWFnZURhdGEuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBwcmV2aWV3SXRlbS5hcHBlbmRDaGlsZChjYW52YXMpO1xuICAgICAgICAgICAgICAgICAgICBwcmV2aWV3SXRlbS5hcHBlbmRDaGlsZChwcmV2aWV3TGFiZWwpO1xuICAgICAgICAgICAgICAgICAgICBwcmV2aWV3LmFwcGVuZENoaWxkKHByZXZpZXdJdGVtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgc2hvd0Vycm9yKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcbiAgICB9KTtcbiAgICBmdW5jdGlvbiBjbGVhclByZXZpZXcoKSB7XG4gICAgICAgIHByZXZpZXcuaW5uZXJIVE1MID0gJyc7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNob3dFcnJvcihlcnIpIHtcbiAgICAgICAgY2xlYXJQcmV2aWV3KCk7XG4gICAgICAgIGNvbnRhaW5lci5jbGFzc0xpc3QucmVtb3ZlKCdjb250YWluZXJfaGlkZGVuJyk7XG4gICAgICAgIGxhYmVsLnRleHRDb250ZW50ID0gZXJyO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxufSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kZWNvZGVibHAuanMubWFwIiwiLypcbiBDb3B5cmlnaHQgMjAxMSBub3RtYXN0ZXJ5ZXRcblxuIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuXG4gaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG5cbiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyAtIFRoZSBKUEVHIHNwZWNpZmljYXRpb24gY2FuIGJlIGZvdW5kIGluIHRoZSBJVFUgQ0NJVFQgUmVjb21tZW5kYXRpb24gVC44MVxuLy8gICAod3d3LnczLm9yZy9HcmFwaGljcy9KUEVHL2l0dS10ODEucGRmKVxuLy8gLSBUaGUgSkZJRiBzcGVjaWZpY2F0aW9uIGNhbiBiZSBmb3VuZCBpbiB0aGUgSlBFRyBGaWxlIEludGVyY2hhbmdlIEZvcm1hdFxuLy8gICAod3d3LnczLm9yZy9HcmFwaGljcy9KUEVHL2pmaWYzLnBkZilcbi8vIC0gVGhlIEFkb2JlIEFwcGxpY2F0aW9uLVNwZWNpZmljIEpQRUcgbWFya2VycyBpbiB0aGUgU3VwcG9ydGluZyB0aGUgRENUIEZpbHRlcnNcbi8vICAgaW4gUG9zdFNjcmlwdCBMZXZlbCAyLCBUZWNobmljYWwgTm90ZSAjNTExNlxuLy8gICAocGFydG5lcnMuYWRvYmUuY29tL3B1YmxpYy9kZXZlbG9wZXIvZW4vcHMvc2RrLzUxMTYuRENUX0ZpbHRlci5wZGYpXG5cbi8vIE5PVEU6IFRoaXMgZmlsZSB3YXMgZWRpdGVkIHRvIG1hdGNoIHRoZSBjcnVkZSB1c2FnZSBvZiB0aGUgSlBHIGZvcm1hdCBieSBCbGl6emFyZCBmb3IgdGhlaXIgQkxQMSBmb3JtYXQuXG5cbnZhciBKcGVnSW1hZ2UgPSAoZnVuY3Rpb24ganBlZ0ltYWdlKCkge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBkY3RaaWdaYWcgPSBuZXcgSW50MzJBcnJheShbXG4gICAgICAgIDAsXG4gICAgICAgIDEsICA4LFxuICAgICAgICAxNiwgIDksICAyLFxuICAgICAgICAzLCAxMCwgMTcsIDI0LFxuICAgICAgICAzMiwgMjUsIDE4LCAxMSwgNCxcbiAgICAgICAgNSwgMTIsIDE5LCAyNiwgMzMsIDQwLFxuICAgICAgICA0OCwgNDEsIDM0LCAyNywgMjAsIDEzLCAgNixcbiAgICAgICAgNywgMTQsIDIxLCAyOCwgMzUsIDQyLCA0OSwgNTYsXG4gICAgICAgIDU3LCA1MCwgNDMsIDM2LCAyOSwgMjIsIDE1LFxuICAgICAgICAyMywgMzAsIDM3LCA0NCwgNTEsIDU4LFxuICAgICAgICA1OSwgNTIsIDQ1LCAzOCwgMzEsXG4gICAgICAgIDM5LCA0NiwgNTMsIDYwLFxuICAgICAgICA2MSwgNTQsIDQ3LFxuICAgICAgICA1NSwgNjIsXG4gICAgICAgIDYzXG4gICAgXSk7XG5cbiAgICB2YXIgZGN0Q29zMSAgPSAgNDAxNyAgIC8vIGNvcyhwaS8xNilcbiAgICB2YXIgZGN0U2luMSAgPSAgIDc5OSAgIC8vIHNpbihwaS8xNilcbiAgICB2YXIgZGN0Q29zMyAgPSAgMzQwNiAgIC8vIGNvcygzKnBpLzE2KVxuICAgIHZhciBkY3RTaW4zICA9ICAyMjc2ICAgLy8gc2luKDMqcGkvMTYpXG4gICAgdmFyIGRjdENvczYgID0gIDE1NjcgICAvLyBjb3MoNipwaS8xNilcbiAgICB2YXIgZGN0U2luNiAgPSAgMzc4NCAgIC8vIHNpbig2KnBpLzE2KVxuICAgIHZhciBkY3RTcXJ0MiA9ICA1NzkzICAgLy8gc3FydCgyKVxuICAgIHZhciBkY3RTcXJ0MWQyID0gMjg5NiAgLy8gc3FydCgyKSAvIDJcblxuICAgIGZ1bmN0aW9uIGNvbnN0cnVjdG9yKCkge1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1aWxkSHVmZm1hblRhYmxlKGNvZGVMZW5ndGhzLCB2YWx1ZXMpIHtcbiAgICAgICAgdmFyIGsgPSAwLCBjb2RlID0gW10sIGksIGosIGxlbmd0aCA9IDE2O1xuICAgICAgICB3aGlsZSAobGVuZ3RoID4gMCAmJiAhY29kZUxlbmd0aHNbbGVuZ3RoIC0gMV0pXG4gICAgICAgICAgICBsZW5ndGgtLTtcbiAgICAgICAgY29kZS5wdXNoKHtjaGlsZHJlbjogW10sIGluZGV4OiAwfSk7XG4gICAgICAgIHZhciBwID0gY29kZVswXSwgcTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgY29kZUxlbmd0aHNbaV07IGorKykge1xuICAgICAgICAgICAgICAgIHAgPSBjb2RlLnBvcCgpO1xuICAgICAgICAgICAgICAgIHAuY2hpbGRyZW5bcC5pbmRleF0gPSB2YWx1ZXNba107XG4gICAgICAgICAgICAgICAgd2hpbGUgKHAuaW5kZXggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHAgPSBjb2RlLnBvcCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBwLmluZGV4Kys7XG4gICAgICAgICAgICAgICAgY29kZS5wdXNoKHApO1xuICAgICAgICAgICAgICAgIHdoaWxlIChjb2RlLmxlbmd0aCA8PSBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvZGUucHVzaChxID0ge2NoaWxkcmVuOiBbXSwgaW5kZXg6IDB9KTtcbiAgICAgICAgICAgICAgICAgICAgcC5jaGlsZHJlbltwLmluZGV4XSA9IHEuY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgIHAgPSBxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBrKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSArIDEgPCBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAvLyBwIGhlcmUgcG9pbnRzIHRvIGxhc3QgY29kZVxuICAgICAgICAgICAgICAgIGNvZGUucHVzaChxID0ge2NoaWxkcmVuOiBbXSwgaW5kZXg6IDB9KTtcbiAgICAgICAgICAgICAgICBwLmNoaWxkcmVuW3AuaW5kZXhdID0gcS5jaGlsZHJlbjtcbiAgICAgICAgICAgICAgICBwID0gcTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29kZVswXS5jaGlsZHJlbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRCbG9ja0J1ZmZlck9mZnNldChjb21wb25lbnQsIHJvdywgY29sKSB7XG4gICAgICAgIHJldHVybiA2NCAqICgoY29tcG9uZW50LmJsb2Nrc1BlckxpbmUgKyAxKSAqIHJvdyArIGNvbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGVjb2RlU2NhbihkYXRhLCBvZmZzZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZSwgY29tcG9uZW50cywgcmVzZXRJbnRlcnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwZWN0cmFsU3RhcnQsIHNwZWN0cmFsRW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc2l2ZVByZXYsIHN1Y2Nlc3NpdmUpIHtcbiAgICAgICAgdmFyIHByZWNpc2lvbiA9IGZyYW1lLnByZWNpc2lvbjtcbiAgICAgICAgdmFyIHNhbXBsZXNQZXJMaW5lID0gZnJhbWUuc2FtcGxlc1BlckxpbmU7XG4gICAgICAgIHZhciBzY2FuTGluZXMgPSBmcmFtZS5zY2FuTGluZXM7XG4gICAgICAgIHZhciBtY3VzUGVyTGluZSA9IGZyYW1lLm1jdXNQZXJMaW5lO1xuICAgICAgICB2YXIgcHJvZ3Jlc3NpdmUgPSBmcmFtZS5wcm9ncmVzc2l2ZTtcbiAgICAgICAgdmFyIG1heEggPSBmcmFtZS5tYXhILCBtYXhWID0gZnJhbWUubWF4VjtcblxuICAgICAgICB2YXIgc3RhcnRPZmZzZXQgPSBvZmZzZXQsIGJpdHNEYXRhID0gMCwgYml0c0NvdW50ID0gMDtcblxuICAgICAgICBmdW5jdGlvbiByZWFkQml0KCkge1xuICAgICAgICAgICAgaWYgKGJpdHNDb3VudCA+IDApIHtcbiAgICAgICAgICAgICAgICBiaXRzQ291bnQtLTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKGJpdHNEYXRhID4+IGJpdHNDb3VudCkgJiAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYml0c0RhdGEgPSBkYXRhW29mZnNldCsrXTtcbiAgICAgICAgICAgIGlmIChiaXRzRGF0YSA9PSAweEZGKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRCeXRlID0gZGF0YVtvZmZzZXQrK107XG4gICAgICAgICAgICAgICAgaWYgKG5leHRCeXRlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IFwidW5leHBlY3RlZCBtYXJrZXI6IFwiICsgKChiaXRzRGF0YSA8PCA4KSB8IG5leHRCeXRlKS50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHVuc3R1ZmYgMFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYml0c0NvdW50ID0gNztcbiAgICAgICAgICAgIHJldHVybiBiaXRzRGF0YSA+Pj4gNztcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRlY29kZUh1ZmZtYW4odHJlZSkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0cmVlO1xuICAgICAgICAgICAgdmFyIGJpdDtcbiAgICAgICAgICAgIHdoaWxlICgoYml0ID0gcmVhZEJpdCgpKSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5vZGUgPSBub2RlW2JpdF07XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBub2RlID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBub2RlICE9PSAnb2JqZWN0JylcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJpbnZhbGlkIGh1ZmZtYW4gc2VxdWVuY2VcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcmVjZWl2ZShsZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciBuID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChsZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJpdCA9IHJlYWRCaXQoKTtcbiAgICAgICAgICAgICAgICBpZiAoYml0ID09PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgICAgICAgbiA9IChuIDw8IDEpIHwgYml0O1xuICAgICAgICAgICAgICAgIGxlbmd0aC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiByZWNlaXZlQW5kRXh0ZW5kKGxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIG4gPSByZWNlaXZlKGxlbmd0aCk7XG4gICAgICAgICAgICBpZiAobiA+PSAxIDw8IChsZW5ndGggLSAxKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gbjtcbiAgICAgICAgICAgIHJldHVybiBuICsgKC0xIDw8IGxlbmd0aCkgKyAxO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZGVjb2RlQmFzZWxpbmUoY29tcG9uZW50LCBvZmZzZXQpIHtcbiAgICAgICAgICAgIHZhciB0ID0gZGVjb2RlSHVmZm1hbihjb21wb25lbnQuaHVmZm1hblRhYmxlREMpO1xuICAgICAgICAgICAgdmFyIGRpZmYgPSB0ID09PSAwID8gMCA6IHJlY2VpdmVBbmRFeHRlbmQodCk7XG4gICAgICAgICAgICBjb21wb25lbnQuYmxvY2tEYXRhW29mZnNldF0gPSAoY29tcG9uZW50LnByZWQgKz0gZGlmZik7XG4gICAgICAgICAgICB2YXIgayA9IDE7XG4gICAgICAgICAgICB3aGlsZSAoayA8IDY0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHJzID0gZGVjb2RlSHVmZm1hbihjb21wb25lbnQuaHVmZm1hblRhYmxlQUMpO1xuICAgICAgICAgICAgICAgIHZhciBzID0gcnMgJiAxNSwgciA9IHJzID4+IDQ7XG4gICAgICAgICAgICAgICAgaWYgKHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHIgPCAxNSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBrICs9IDE2O1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgayArPSByO1xuICAgICAgICAgICAgICAgIHZhciB6ID0gZGN0WmlnWmFnW2tdO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5ibG9ja0RhdGFbb2Zmc2V0ICsgel0gPSByZWNlaXZlQW5kRXh0ZW5kKHMpO1xuICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGRlY29kZURDRmlyc3QoY29tcG9uZW50LCBvZmZzZXQpIHtcbiAgICAgICAgICAgIHZhciB0ID0gZGVjb2RlSHVmZm1hbihjb21wb25lbnQuaHVmZm1hblRhYmxlREMpO1xuICAgICAgICAgICAgdmFyIGRpZmYgPSB0ID09PSAwID8gMCA6IChyZWNlaXZlQW5kRXh0ZW5kKHQpIDw8IHN1Y2Nlc3NpdmUpO1xuICAgICAgICAgICAgY29tcG9uZW50LmJsb2NrRGF0YVtvZmZzZXRdID0gKGNvbXBvbmVudC5wcmVkICs9IGRpZmYpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZGVjb2RlRENTdWNjZXNzaXZlKGNvbXBvbmVudCwgb2Zmc2V0KSB7XG4gICAgICAgICAgICBjb21wb25lbnQuYmxvY2tEYXRhW29mZnNldF0gfD0gcmVhZEJpdCgpIDw8IHN1Y2Nlc3NpdmU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZW9icnVuID0gMDtcbiAgICAgICAgZnVuY3Rpb24gZGVjb2RlQUNGaXJzdChjb21wb25lbnQsIG9mZnNldCkge1xuICAgICAgICAgICAgaWYgKGVvYnJ1biA+IDApIHtcbiAgICAgICAgICAgICAgICBlb2JydW4tLTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgayA9IHNwZWN0cmFsU3RhcnQsIGUgPSBzcGVjdHJhbEVuZDtcbiAgICAgICAgICAgIHdoaWxlIChrIDw9IGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcnMgPSBkZWNvZGVIdWZmbWFuKGNvbXBvbmVudC5odWZmbWFuVGFibGVBQyk7XG4gICAgICAgICAgICAgICAgdmFyIHMgPSBycyAmIDE1LCByID0gcnMgPj4gNDtcbiAgICAgICAgICAgICAgICBpZiAocyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAociA8IDE1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlb2JydW4gPSByZWNlaXZlKHIpICsgKDEgPDwgcikgLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgayArPSAxNjtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGsgKz0gcjtcbiAgICAgICAgICAgICAgICB2YXIgeiA9IGRjdFppZ1phZ1trXTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQuYmxvY2tEYXRhW29mZnNldCArIHpdID0gcmVjZWl2ZUFuZEV4dGVuZChzKSAqICgxIDw8IHN1Y2Nlc3NpdmUpO1xuICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdWNjZXNzaXZlQUNTdGF0ZSA9IDAsIHN1Y2Nlc3NpdmVBQ05leHRWYWx1ZTtcbiAgICAgICAgZnVuY3Rpb24gZGVjb2RlQUNTdWNjZXNzaXZlKGNvbXBvbmVudCwgb2Zmc2V0KSB7XG4gICAgICAgICAgICB2YXIgayA9IHNwZWN0cmFsU3RhcnQsIGUgPSBzcGVjdHJhbEVuZCwgciA9IDA7XG4gICAgICAgICAgICB3aGlsZSAoayA8PSBlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHogPSBkY3RaaWdaYWdba107XG4gICAgICAgICAgICAgICAgc3dpdGNoIChzdWNjZXNzaXZlQUNTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDA6IC8vIGluaXRpYWwgc3RhdGVcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBycyA9IGRlY29kZUh1ZmZtYW4oY29tcG9uZW50Lmh1ZmZtYW5UYWJsZUFDKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzID0gcnMgJiAxNSwgciA9IHJzID4+IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyIDwgMTUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW9icnVuID0gcmVjZWl2ZShyKSArICgxIDw8IHIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzaXZlQUNTdGF0ZSA9IDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgciA9IDE2O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzaXZlQUNTdGF0ZSA9IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocyAhPT0gMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJpbnZhbGlkIEFDbiBlbmNvZGluZ1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NpdmVBQ05leHRWYWx1ZSA9IHJlY2VpdmVBbmRFeHRlbmQocyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc2l2ZUFDU3RhdGUgPSByID8gMiA6IDM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAxOiAvLyBza2lwcGluZyByIHplcm8gaXRlbXNcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5ibG9ja0RhdGFbb2Zmc2V0ICsgel0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuYmxvY2tEYXRhW29mZnNldCArIHpdICs9IChyZWFkQml0KCkgPDwgc3VjY2Vzc2l2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHItLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAociA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc2l2ZUFDU3RhdGUgPSBzdWNjZXNzaXZlQUNTdGF0ZSA9PSAyID8gMyA6IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzOiAvLyBzZXQgdmFsdWUgZm9yIGEgemVybyBpdGVtXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcG9uZW50LmJsb2NrRGF0YVtvZmZzZXQgKyB6XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5ibG9ja0RhdGFbb2Zmc2V0ICsgel0gKz0gKHJlYWRCaXQoKSA8PCBzdWNjZXNzaXZlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50LmJsb2NrRGF0YVtvZmZzZXQgKyB6XSA9IHN1Y2Nlc3NpdmVBQ05leHRWYWx1ZSA8PCBzdWNjZXNzaXZlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NpdmVBQ1N0YXRlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDQ6IC8vIGVvYlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBvbmVudC5ibG9ja0RhdGFbb2Zmc2V0ICsgel0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuYmxvY2tEYXRhW29mZnNldCArIHpdICs9IChyZWFkQml0KCkgPDwgc3VjY2Vzc2l2ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHN1Y2Nlc3NpdmVBQ1N0YXRlID09PSA0KSB7XG4gICAgICAgICAgICAgICAgZW9icnVuLS07XG4gICAgICAgICAgICAgICAgaWYgKGVvYnJ1biA9PT0gMClcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc2l2ZUFDU3RhdGUgPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZGVjb2RlTWN1KGNvbXBvbmVudCwgZGVjb2RlLCBtY3UsIHJvdywgY29sKSB7XG4gICAgICAgICAgICB2YXIgbWN1Um93ID0gKG1jdSAvIG1jdXNQZXJMaW5lKSB8IDA7XG4gICAgICAgICAgICB2YXIgbWN1Q29sID0gbWN1ICUgbWN1c1BlckxpbmU7XG4gICAgICAgICAgICB2YXIgYmxvY2tSb3cgPSBtY3VSb3cgKiBjb21wb25lbnQudiArIHJvdztcbiAgICAgICAgICAgIHZhciBibG9ja0NvbCA9IG1jdUNvbCAqIGNvbXBvbmVudC5oICsgY29sO1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IGdldEJsb2NrQnVmZmVyT2Zmc2V0KGNvbXBvbmVudCwgYmxvY2tSb3csIGJsb2NrQ29sKTtcbiAgICAgICAgICAgIGRlY29kZShjb21wb25lbnQsIG9mZnNldCk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBkZWNvZGVCbG9jayhjb21wb25lbnQsIGRlY29kZSwgbWN1KSB7XG4gICAgICAgICAgICB2YXIgYmxvY2tSb3cgPSAobWN1IC8gY29tcG9uZW50LmJsb2Nrc1BlckxpbmUpIHwgMDtcbiAgICAgICAgICAgIHZhciBibG9ja0NvbCA9IG1jdSAlIGNvbXBvbmVudC5ibG9ja3NQZXJMaW5lO1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IGdldEJsb2NrQnVmZmVyT2Zmc2V0KGNvbXBvbmVudCwgYmxvY2tSb3csIGJsb2NrQ29sKTtcbiAgICAgICAgICAgIGRlY29kZShjb21wb25lbnQsIG9mZnNldCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY29tcG9uZW50c0xlbmd0aCA9IGNvbXBvbmVudHMubGVuZ3RoO1xuICAgICAgICB2YXIgY29tcG9uZW50LCBpLCBqLCBrLCBuO1xuICAgICAgICB2YXIgZGVjb2RlRm47XG4gICAgICAgIGlmIChwcm9ncmVzc2l2ZSkge1xuICAgICAgICAgICAgaWYgKHNwZWN0cmFsU3RhcnQgPT09IDApXG4gICAgICAgICAgICAgICAgZGVjb2RlRm4gPSBzdWNjZXNzaXZlUHJldiA9PT0gMCA/IGRlY29kZURDRmlyc3QgOiBkZWNvZGVEQ1N1Y2Nlc3NpdmU7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgZGVjb2RlRm4gPSBzdWNjZXNzaXZlUHJldiA9PT0gMCA/IGRlY29kZUFDRmlyc3QgOiBkZWNvZGVBQ1N1Y2Nlc3NpdmU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWNvZGVGbiA9IGRlY29kZUJhc2VsaW5lO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1jdSA9IDAsIG1hcmtlcjtcbiAgICAgICAgdmFyIG1jdUV4cGVjdGVkO1xuICAgICAgICBpZiAoY29tcG9uZW50c0xlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICBtY3VFeHBlY3RlZCA9IGNvbXBvbmVudHNbMF0uYmxvY2tzUGVyTGluZSAqIGNvbXBvbmVudHNbMF0uYmxvY2tzUGVyQ29sdW1uO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbWN1RXhwZWN0ZWQgPSBtY3VzUGVyTGluZSAqIGZyYW1lLm1jdXNQZXJDb2x1bW47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFyZXNldEludGVydmFsKSB7XG4gICAgICAgICAgICByZXNldEludGVydmFsID0gbWN1RXhwZWN0ZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaCwgdjtcbiAgICAgICAgd2hpbGUgKG1jdSA8IG1jdUV4cGVjdGVkKSB7XG4gICAgICAgICAgICAvLyByZXNldCBpbnRlcnZhbCBzdHVmZlxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNvbXBvbmVudHNMZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudHNbaV0ucHJlZCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlb2JydW4gPSAwO1xuXG4gICAgICAgICAgICBpZiAoY29tcG9uZW50c0xlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50ID0gY29tcG9uZW50c1swXTtcbiAgICAgICAgICAgICAgICBmb3IgKG4gPSAwOyBuIDwgcmVzZXRJbnRlcnZhbDsgbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlY29kZUJsb2NrKGNvbXBvbmVudCwgZGVjb2RlRm4sIG1jdSk7XG4gICAgICAgICAgICAgICAgICAgIG1jdSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yIChuID0gMDsgbiA8IHJlc2V0SW50ZXJ2YWw7IG4rKykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY29tcG9uZW50c0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgaCA9IGNvbXBvbmVudC5oO1xuICAgICAgICAgICAgICAgICAgICAgICAgdiA9IGNvbXBvbmVudC52O1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHY7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCBoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjb2RlTWN1KGNvbXBvbmVudCwgZGVjb2RlRm4sIG1jdSwgaiwgayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG1jdSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZmluZCBtYXJrZXJcbiAgICAgICAgICAgIGJpdHNDb3VudCA9IDA7XG4gICAgICAgICAgICBtYXJrZXIgPSAoZGF0YVtvZmZzZXRdIDw8IDgpIHwgZGF0YVtvZmZzZXQgKyAxXTtcbiAgICAgICAgICAgIGlmIChtYXJrZXIgPD0gMHhGRjAwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgXCJtYXJrZXIgd2FzIG5vdCBmb3VuZFwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWFya2VyID49IDB4RkZEMCAmJiBtYXJrZXIgPD0gMHhGRkQ3KSB7IC8vIFJTVHhcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gMjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2Zmc2V0IC0gc3RhcnRPZmZzZXQ7XG4gICAgfVxuXG4gICAgLy8gQSBwb3J0IG9mIHBvcHBsZXIncyBJRENUIG1ldGhvZCB3aGljaCBpbiB0dXJuIGlzIHRha2VuIGZyb206XG4gICAgLy8gICBDaHJpc3RvcGggTG9lZmZsZXIsIEFkcmlhYW4gTGlndGVuYmVyZywgR2VvcmdlIFMuIE1vc2NoeXR6LFxuICAgIC8vICAgXCJQcmFjdGljYWwgRmFzdCAxLUQgRENUIEFsZ29yaXRobXMgd2l0aCAxMSBNdWx0aXBsaWNhdGlvbnNcIixcbiAgICAvLyAgIElFRUUgSW50bC4gQ29uZi4gb24gQWNvdXN0aWNzLCBTcGVlY2ggJiBTaWduYWwgUHJvY2Vzc2luZywgMTk4OSxcbiAgICAvLyAgIDk4OC05OTEuXG4gICAgZnVuY3Rpb24gcXVhbnRpemVBbmRJbnZlcnNlKGNvbXBvbmVudCwgYmxvY2tCdWZmZXJPZmZzZXQsIHApIHtcbiAgICAgICAgdmFyIHF0ID0gY29tcG9uZW50LnF1YW50aXphdGlvblRhYmxlO1xuICAgICAgICB2YXIgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB0O1xuICAgICAgICB2YXIgaTtcblxuICAgICAgICAvLyBkZXF1YW50XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA2NDsgaSsrKSB7XG4gICAgICAgICAgICBwW2ldID0gY29tcG9uZW50LmJsb2NrRGF0YVtibG9ja0J1ZmZlck9mZnNldCArIGldICogcXRbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbnZlcnNlIERDVCBvbiByb3dzXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA4OyArK2kpIHtcbiAgICAgICAgICAgIHZhciByb3cgPSA4ICogaTtcblxuICAgICAgICAgICAgLy8gY2hlY2sgZm9yIGFsbC16ZXJvIEFDIGNvZWZmaWNpZW50c1xuICAgICAgICAgICAgaWYgKHBbMSArIHJvd10gPT0gMCAmJiBwWzIgKyByb3ddID09IDAgJiYgcFszICsgcm93XSA9PSAwICYmXG4gICAgICAgICAgICAgICAgcFs0ICsgcm93XSA9PSAwICYmIHBbNSArIHJvd10gPT0gMCAmJiBwWzYgKyByb3ddID09IDAgJiZcbiAgICAgICAgICAgICAgICBwWzcgKyByb3ddID09IDApIHtcbiAgICAgICAgICAgICAgICB0ID0gKGRjdFNxcnQyICogcFswICsgcm93XSArIDUxMikgPj4gMTA7XG4gICAgICAgICAgICAgICAgcFswICsgcm93XSA9IHQ7XG4gICAgICAgICAgICAgICAgcFsxICsgcm93XSA9IHQ7XG4gICAgICAgICAgICAgICAgcFsyICsgcm93XSA9IHQ7XG4gICAgICAgICAgICAgICAgcFszICsgcm93XSA9IHQ7XG4gICAgICAgICAgICAgICAgcFs0ICsgcm93XSA9IHQ7XG4gICAgICAgICAgICAgICAgcFs1ICsgcm93XSA9IHQ7XG4gICAgICAgICAgICAgICAgcFs2ICsgcm93XSA9IHQ7XG4gICAgICAgICAgICAgICAgcFs3ICsgcm93XSA9IHQ7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHN0YWdlIDRcbiAgICAgICAgICAgIHYwID0gKGRjdFNxcnQyICogcFswICsgcm93XSArIDEyOCkgPj4gODtcbiAgICAgICAgICAgIHYxID0gKGRjdFNxcnQyICogcFs0ICsgcm93XSArIDEyOCkgPj4gODtcbiAgICAgICAgICAgIHYyID0gcFsyICsgcm93XTtcbiAgICAgICAgICAgIHYzID0gcFs2ICsgcm93XTtcbiAgICAgICAgICAgIHY0ID0gKGRjdFNxcnQxZDIgKiAocFsxICsgcm93XSAtIHBbNyArIHJvd10pICsgMTI4KSA+PiA4O1xuICAgICAgICAgICAgdjcgPSAoZGN0U3FydDFkMiAqIChwWzEgKyByb3ddICsgcFs3ICsgcm93XSkgKyAxMjgpID4+IDg7XG4gICAgICAgICAgICB2NSA9IHBbMyArIHJvd10gPDwgNDtcbiAgICAgICAgICAgIHY2ID0gcFs1ICsgcm93XSA8PCA0O1xuXG4gICAgICAgICAgICAvLyBzdGFnZSAzXG4gICAgICAgICAgICB0ID0gKHYwIC0gdjErIDEpID4+IDE7XG4gICAgICAgICAgICB2MCA9ICh2MCArIHYxICsgMSkgPj4gMTtcbiAgICAgICAgICAgIHYxID0gdDtcbiAgICAgICAgICAgIHQgPSAodjIgKiBkY3RTaW42ICsgdjMgKiBkY3RDb3M2ICsgMTI4KSA+PiA4O1xuICAgICAgICAgICAgdjIgPSAodjIgKiBkY3RDb3M2IC0gdjMgKiBkY3RTaW42ICsgMTI4KSA+PiA4O1xuICAgICAgICAgICAgdjMgPSB0O1xuICAgICAgICAgICAgdCA9ICh2NCAtIHY2ICsgMSkgPj4gMTtcbiAgICAgICAgICAgIHY0ID0gKHY0ICsgdjYgKyAxKSA+PiAxO1xuICAgICAgICAgICAgdjYgPSB0O1xuICAgICAgICAgICAgdCA9ICh2NyArIHY1ICsgMSkgPj4gMTtcbiAgICAgICAgICAgIHY1ID0gKHY3IC0gdjUgKyAxKSA+PiAxO1xuICAgICAgICAgICAgdjcgPSB0O1xuXG4gICAgICAgICAgICAvLyBzdGFnZSAyXG4gICAgICAgICAgICB0ID0gKHYwIC0gdjMgKyAxKSA+PiAxO1xuICAgICAgICAgICAgdjAgPSAodjAgKyB2MyArIDEpID4+IDE7XG4gICAgICAgICAgICB2MyA9IHQ7XG4gICAgICAgICAgICB0ID0gKHYxIC0gdjIgKyAxKSA+PiAxO1xuICAgICAgICAgICAgdjEgPSAodjEgKyB2MiArIDEpID4+IDE7XG4gICAgICAgICAgICB2MiA9IHQ7XG4gICAgICAgICAgICB0ID0gKHY0ICogZGN0U2luMyArIHY3ICogZGN0Q29zMyArIDIwNDgpID4+IDEyO1xuICAgICAgICAgICAgdjQgPSAodjQgKiBkY3RDb3MzIC0gdjcgKiBkY3RTaW4zICsgMjA0OCkgPj4gMTI7XG4gICAgICAgICAgICB2NyA9IHQ7XG4gICAgICAgICAgICB0ID0gKHY1ICogZGN0U2luMSArIHY2ICogZGN0Q29zMSArIDIwNDgpID4+IDEyO1xuICAgICAgICAgICAgdjUgPSAodjUgKiBkY3RDb3MxIC0gdjYgKiBkY3RTaW4xICsgMjA0OCkgPj4gMTI7XG4gICAgICAgICAgICB2NiA9IHQ7XG5cbiAgICAgICAgICAgIC8vIHN0YWdlIDFcbiAgICAgICAgICAgIHBbMCArIHJvd10gPSB2MCArIHY3O1xuICAgICAgICAgICAgcFs3ICsgcm93XSA9IHYwIC0gdjc7XG4gICAgICAgICAgICBwWzEgKyByb3ddID0gdjEgKyB2NjtcbiAgICAgICAgICAgIHBbNiArIHJvd10gPSB2MSAtIHY2O1xuICAgICAgICAgICAgcFsyICsgcm93XSA9IHYyICsgdjU7XG4gICAgICAgICAgICBwWzUgKyByb3ddID0gdjIgLSB2NTtcbiAgICAgICAgICAgIHBbMyArIHJvd10gPSB2MyArIHY0O1xuICAgICAgICAgICAgcFs0ICsgcm93XSA9IHYzIC0gdjQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpbnZlcnNlIERDVCBvbiBjb2x1bW5zXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA4OyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjb2wgPSBpO1xuXG4gICAgICAgICAgICAvLyBjaGVjayBmb3IgYWxsLXplcm8gQUMgY29lZmZpY2llbnRzXG4gICAgICAgICAgICBpZiAocFsxKjggKyBjb2xdID09IDAgJiYgcFsyKjggKyBjb2xdID09IDAgJiYgcFszKjggKyBjb2xdID09IDAgJiZcbiAgICAgICAgICAgICAgICBwWzQqOCArIGNvbF0gPT0gMCAmJiBwWzUqOCArIGNvbF0gPT0gMCAmJiBwWzYqOCArIGNvbF0gPT0gMCAmJlxuICAgICAgICAgICAgICAgIHBbNyo4ICsgY29sXSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgdCA9IChkY3RTcXJ0MiAqIHBbaSswXSArIDgxOTIpID4+IDE0O1xuICAgICAgICAgICAgICAgIHBbMCo4ICsgY29sXSA9IHQ7XG4gICAgICAgICAgICAgICAgcFsxKjggKyBjb2xdID0gdDtcbiAgICAgICAgICAgICAgICBwWzIqOCArIGNvbF0gPSB0O1xuICAgICAgICAgICAgICAgIHBbMyo4ICsgY29sXSA9IHQ7XG4gICAgICAgICAgICAgICAgcFs0KjggKyBjb2xdID0gdDtcbiAgICAgICAgICAgICAgICBwWzUqOCArIGNvbF0gPSB0O1xuICAgICAgICAgICAgICAgIHBbNio4ICsgY29sXSA9IHQ7XG4gICAgICAgICAgICAgICAgcFs3KjggKyBjb2xdID0gdDtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc3RhZ2UgNFxuICAgICAgICAgICAgdjAgPSAoZGN0U3FydDIgKiBwWzAqOCArIGNvbF0gKyAyMDQ4KSA+PiAxMjtcbiAgICAgICAgICAgIHYxID0gKGRjdFNxcnQyICogcFs0KjggKyBjb2xdICsgMjA0OCkgPj4gMTI7XG4gICAgICAgICAgICB2MiA9IHBbMio4ICsgY29sXTtcbiAgICAgICAgICAgIHYzID0gcFs2KjggKyBjb2xdO1xuICAgICAgICAgICAgdjQgPSAoZGN0U3FydDFkMiAqIChwWzEqOCArIGNvbF0gLSBwWzcqOCArIGNvbF0pICsgMjA0OCkgPj4gMTI7XG4gICAgICAgICAgICB2NyA9IChkY3RTcXJ0MWQyICogKHBbMSo4ICsgY29sXSArIHBbNyo4ICsgY29sXSkgKyAyMDQ4KSA+PiAxMjtcbiAgICAgICAgICAgIHY1ID0gcFszKjggKyBjb2xdO1xuICAgICAgICAgICAgdjYgPSBwWzUqOCArIGNvbF07XG5cbiAgICAgICAgICAgIC8vIHN0YWdlIDNcbiAgICAgICAgICAgIHQgPSAodjAgLSB2MSArIDEpID4+IDE7XG4gICAgICAgICAgICB2MCA9ICh2MCArIHYxICsgMSkgPj4gMTtcbiAgICAgICAgICAgIHYxID0gdDtcbiAgICAgICAgICAgIHQgPSAodjIgKiBkY3RTaW42ICsgdjMgKiBkY3RDb3M2ICsgMjA0OCkgPj4gMTI7XG4gICAgICAgICAgICB2MiA9ICh2MiAqIGRjdENvczYgLSB2MyAqIGRjdFNpbjYgKyAyMDQ4KSA+PiAxMjtcbiAgICAgICAgICAgIHYzID0gdDtcbiAgICAgICAgICAgIHQgPSAodjQgLSB2NiArIDEpID4+IDE7XG4gICAgICAgICAgICB2NCA9ICh2NCArIHY2ICsgMSkgPj4gMTtcbiAgICAgICAgICAgIHY2ID0gdDtcbiAgICAgICAgICAgIHQgPSAodjcgKyB2NSArIDEpID4+IDE7XG4gICAgICAgICAgICB2NSA9ICh2NyAtIHY1ICsgMSkgPj4gMTtcbiAgICAgICAgICAgIHY3ID0gdDtcblxuICAgICAgICAgICAgLy8gc3RhZ2UgMlxuICAgICAgICAgICAgdCA9ICh2MCAtIHYzICsgMSkgPj4gMTtcbiAgICAgICAgICAgIHYwID0gKHYwICsgdjMgKyAxKSA+PiAxO1xuICAgICAgICAgICAgdjMgPSB0O1xuICAgICAgICAgICAgdCA9ICh2MSAtIHYyICsgMSkgPj4gMTtcbiAgICAgICAgICAgIHYxID0gKHYxICsgdjIgKyAxKSA+PiAxO1xuICAgICAgICAgICAgdjIgPSB0O1xuICAgICAgICAgICAgdCA9ICh2NCAqIGRjdFNpbjMgKyB2NyAqIGRjdENvczMgKyAyMDQ4KSA+PiAxMjtcbiAgICAgICAgICAgIHY0ID0gKHY0ICogZGN0Q29zMyAtIHY3ICogZGN0U2luMyArIDIwNDgpID4+IDEyO1xuICAgICAgICAgICAgdjcgPSB0O1xuICAgICAgICAgICAgdCA9ICh2NSAqIGRjdFNpbjEgKyB2NiAqIGRjdENvczEgKyAyMDQ4KSA+PiAxMjtcbiAgICAgICAgICAgIHY1ID0gKHY1ICogZGN0Q29zMSAtIHY2ICogZGN0U2luMSArIDIwNDgpID4+IDEyO1xuICAgICAgICAgICAgdjYgPSB0O1xuXG4gICAgICAgICAgICAvLyBzdGFnZSAxXG4gICAgICAgICAgICBwWzAqOCArIGNvbF0gPSB2MCArIHY3O1xuICAgICAgICAgICAgcFs3KjggKyBjb2xdID0gdjAgLSB2NztcbiAgICAgICAgICAgIHBbMSo4ICsgY29sXSA9IHYxICsgdjY7XG4gICAgICAgICAgICBwWzYqOCArIGNvbF0gPSB2MSAtIHY2O1xuICAgICAgICAgICAgcFsyKjggKyBjb2xdID0gdjIgKyB2NTtcbiAgICAgICAgICAgIHBbNSo4ICsgY29sXSA9IHYyIC0gdjU7XG4gICAgICAgICAgICBwWzMqOCArIGNvbF0gPSB2MyArIHY0O1xuICAgICAgICAgICAgcFs0KjggKyBjb2xdID0gdjMgLSB2NDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbnZlcnQgdG8gOC1iaXQgaW50ZWdlcnNcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDY0OyArK2kpIHtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IGJsb2NrQnVmZmVyT2Zmc2V0ICsgaTtcbiAgICAgICAgICAgIHZhciBxID0gcFtpXTtcbiAgICAgICAgICAgIHEgPSAocSA8PSAtMjA1NikgPyAwIDogKHEgPj0gMjAyNCkgPyAyNTUgOiAocSArIDIwNTYpID4+IDQ7XG4gICAgICAgICAgICBjb21wb25lbnQuYmxvY2tEYXRhW2luZGV4XSA9IHE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBidWlsZENvbXBvbmVudERhdGEoZnJhbWUsIGNvbXBvbmVudCkge1xuICAgICAgICB2YXIgbGluZXMgPSBbXTtcbiAgICAgICAgdmFyIGJsb2Nrc1BlckxpbmUgPSBjb21wb25lbnQuYmxvY2tzUGVyTGluZTtcbiAgICAgICAgdmFyIGJsb2Nrc1BlckNvbHVtbiA9IGNvbXBvbmVudC5ibG9ja3NQZXJDb2x1bW47XG4gICAgICAgIHZhciBzYW1wbGVzUGVyTGluZSA9IGJsb2Nrc1BlckxpbmUgPDwgMztcbiAgICAgICAgdmFyIGNvbXB1dGF0aW9uQnVmZmVyID0gbmV3IEludDMyQXJyYXkoNjQpO1xuXG4gICAgICAgIHZhciBpLCBqLCBsbCA9IDA7XG4gICAgICAgIGZvciAodmFyIGJsb2NrUm93ID0gMDsgYmxvY2tSb3cgPCBibG9ja3NQZXJDb2x1bW47IGJsb2NrUm93KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGJsb2NrQ29sID0gMDsgYmxvY2tDb2wgPCBibG9ja3NQZXJMaW5lOyBibG9ja0NvbCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IGdldEJsb2NrQnVmZmVyT2Zmc2V0KGNvbXBvbmVudCwgYmxvY2tSb3csIGJsb2NrQ29sKVxuICAgICAgICAgICAgICAgIHF1YW50aXplQW5kSW52ZXJzZShjb21wb25lbnQsIG9mZnNldCwgY29tcHV0YXRpb25CdWZmZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjb21wb25lbnQuYmxvY2tEYXRhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsYW1wVG9VaW50OChhKSB7XG4gICAgICAgIHJldHVybiBhIDw9IDAgPyAwIDogYSA+PSAyNTUgPyAyNTUgOiBhIHwgMDtcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSB7XG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIGxvYWQocGF0aCkge1xuICAgICAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgeGhyLm9wZW4oXCJHRVRcIiwgcGF0aCwgdHJ1ZSk7XG4gICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiO1xuICAgICAgICAgICAgeGhyLm9ubG9hZCA9IChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPIGNhdGNoIHBhcnNlIGVycm9yXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBuZXcgVWludDhBcnJheSh4aHIucmVzcG9uc2UgfHwgeGhyLm1velJlc3BvbnNlQXJyYXlCdWZmZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub25sb2FkKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9ubG9hZCgpO1xuICAgICAgICAgICAgfSkuYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHhoci5zZW5kKG51bGwpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGxvYWRGcm9tQnVmZmVyOiBmdW5jdGlvbiBsb2FkRnJvbUJ1ZmZlcihhcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5wYXJzZShhcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICBpZiAodGhpcy5vbmxvYWQpXG4gICAgICAgICAgICAgICAgdGhpcy5vbmxvYWQoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBwYXJzZTogZnVuY3Rpb24gcGFyc2UoZGF0YSkge1xuXG4gICAgICAgICAgICBmdW5jdGlvbiByZWFkVWludDE2KCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IChkYXRhW29mZnNldF0gPDwgOCkgfCBkYXRhW29mZnNldCArIDFdO1xuICAgICAgICAgICAgICAgIG9mZnNldCArPSAyO1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcmVhZERhdGFCbG9jaygpIHtcbiAgICAgICAgICAgICAgICB2YXIgbGVuZ3RoID0gcmVhZFVpbnQxNigpO1xuICAgICAgICAgICAgICAgIHZhciBhcnJheSA9IGRhdGEuc3ViYXJyYXkob2Zmc2V0LCBvZmZzZXQgKyBsZW5ndGggLSAyKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gYXJyYXkubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnJheTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gcHJlcGFyZUNvbXBvbmVudHMoZnJhbWUpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWN1c1BlckxpbmUgPSBNYXRoLmNlaWwoZnJhbWUuc2FtcGxlc1BlckxpbmUgLyA4IC8gZnJhbWUubWF4SCk7XG4gICAgICAgICAgICAgICAgdmFyIG1jdXNQZXJDb2x1bW4gPSBNYXRoLmNlaWwoZnJhbWUuc2NhbkxpbmVzIC8gOCAvIGZyYW1lLm1heFYpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZnJhbWUuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQgPSBmcmFtZS5jb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmxvY2tzUGVyTGluZSA9IE1hdGguY2VpbChNYXRoLmNlaWwoZnJhbWUuc2FtcGxlc1BlckxpbmUgLyA4KSAqIGNvbXBvbmVudC5oIC8gZnJhbWUubWF4SCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBibG9ja3NQZXJDb2x1bW4gPSBNYXRoLmNlaWwoTWF0aC5jZWlsKGZyYW1lLnNjYW5MaW5lcyAgLyA4KSAqIGNvbXBvbmVudC52IC8gZnJhbWUubWF4Vik7XG4gICAgICAgICAgICAgICAgICAgIHZhciBibG9ja3NQZXJMaW5lRm9yTWN1ID0gbWN1c1BlckxpbmUgKiBjb21wb25lbnQuaDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2Nrc1BlckNvbHVtbkZvck1jdSA9IG1jdXNQZXJDb2x1bW4gKiBjb21wb25lbnQudjtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgYmxvY2tzQnVmZmVyU2l6ZSA9IDY0ICogYmxvY2tzUGVyQ29sdW1uRm9yTWN1XG4gICAgICAgICAgICAgICAgICAgICAgICAqIChibG9ja3NQZXJMaW5lRm9yTWN1ICsgMSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5ibG9ja0RhdGEgPSBuZXcgSW50MTZBcnJheShibG9ja3NCdWZmZXJTaXplKTtcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50LmJsb2Nrc1BlckxpbmUgPSBibG9ja3NQZXJMaW5lO1xuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQuYmxvY2tzUGVyQ29sdW1uID0gYmxvY2tzUGVyQ29sdW1uO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmcmFtZS5tY3VzUGVyTGluZSA9IG1jdXNQZXJMaW5lO1xuICAgICAgICAgICAgICAgIGZyYW1lLm1jdXNQZXJDb2x1bW4gPSBtY3VzUGVyQ29sdW1uO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgbGVuZ3RoID0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgamZpZiA9IG51bGw7XG4gICAgICAgICAgICB2YXIgYWRvYmUgPSBudWxsO1xuICAgICAgICAgICAgdmFyIHBpeGVscyA9IG51bGw7XG4gICAgICAgICAgICB2YXIgZnJhbWUsIHJlc2V0SW50ZXJ2YWw7XG4gICAgICAgICAgICB2YXIgcXVhbnRpemF0aW9uVGFibGVzID0gW107XG4gICAgICAgICAgICB2YXIgaHVmZm1hblRhYmxlc0FDID0gW10sIGh1ZmZtYW5UYWJsZXNEQyA9IFtdO1xuICAgICAgICAgICAgdmFyIGZpbGVNYXJrZXIgPSByZWFkVWludDE2KCk7XG4gICAgICAgICAgICBpZiAoZmlsZU1hcmtlciAhPSAweEZGRDgpIHsgLy8gU09JIChTdGFydCBvZiBJbWFnZSlcbiAgICAgICAgICAgICAgICB0aHJvdyBcIlNPSSBub3QgZm91bmRcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZmlsZU1hcmtlciA9IHJlYWRVaW50MTYoKTtcbiAgICAgICAgICAgIHdoaWxlIChmaWxlTWFya2VyICE9IDB4RkZEOSkgeyAvLyBFT0kgKEVuZCBvZiBpbWFnZSlcbiAgICAgICAgICAgICAgICB2YXIgaSwgaiwgbDtcbiAgICAgICAgICAgICAgICBzd2l0Y2goZmlsZU1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDB4RkZFMDogLy8gQVBQMCAoQXBwbGljYXRpb24gU3BlY2lmaWMpXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkUxOiAvLyBBUFAxXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkUyOiAvLyBBUFAyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkUzOiAvLyBBUFAzXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkU0OiAvLyBBUFA0XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkU1OiAvLyBBUFA1XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkU2OiAvLyBBUFA2XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkU3OiAvLyBBUFA3XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkU4OiAvLyBBUFA4XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkU5OiAvLyBBUFA5XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkVBOiAvLyBBUFAxMFxuICAgICAgICAgICAgICAgICAgICBjYXNlIDB4RkZFQjogLy8gQVBQMTFcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAweEZGRUM6IC8vIEFQUDEyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkVEOiAvLyBBUFAxM1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDB4RkZFRTogLy8gQVBQMTRcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAweEZGRUY6IC8vIEFQUDE1XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkZFOiAvLyBDT00gKENvbW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYXBwRGF0YSA9IHJlYWREYXRhQmxvY2soKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVNYXJrZXIgPT09IDB4RkZFMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcHBEYXRhWzBdID09PSAweDRBICYmIGFwcERhdGFbMV0gPT09IDB4NDYgJiYgYXBwRGF0YVsyXSA9PT0gMHg0OSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBEYXRhWzNdID09PSAweDQ2ICYmIGFwcERhdGFbNF0gPT09IDApIHsgLy8gJ0pGSUZcXHgwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgamZpZiA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IHsgbWFqb3I6IGFwcERhdGFbNV0sIG1pbm9yOiBhcHBEYXRhWzZdIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZW5zaXR5VW5pdHM6IGFwcERhdGFbN10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4RGVuc2l0eTogKGFwcERhdGFbOF0gPDwgOCkgfCBhcHBEYXRhWzldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeURlbnNpdHk6IChhcHBEYXRhWzEwXSA8PCA4KSB8IGFwcERhdGFbMTFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGh1bWJXaWR0aDogYXBwRGF0YVsxMl0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHVtYkhlaWdodDogYXBwRGF0YVsxM10sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHVtYkRhdGE6IGFwcERhdGEuc3ViYXJyYXkoMTQsIDE0ICsgMyAqIGFwcERhdGFbMTJdICogYXBwRGF0YVsxM10pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyBBUFAxIC0gRXhpZlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVNYXJrZXIgPT09IDB4RkZFRSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcHBEYXRhWzBdID09PSAweDQxICYmIGFwcERhdGFbMV0gPT09IDB4NjQgJiYgYXBwRGF0YVsyXSA9PT0gMHg2RiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBEYXRhWzNdID09PSAweDYyICYmIGFwcERhdGFbNF0gPT09IDB4NjUgJiYgYXBwRGF0YVs1XSA9PT0gMCkgeyAvLyAnQWRvYmVcXHgwMCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRvYmUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBhcHBEYXRhWzZdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MwOiAoYXBwRGF0YVs3XSA8PCA4KSB8IGFwcERhdGFbOF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGFnczE6IChhcHBEYXRhWzldIDw8IDgpIHwgYXBwRGF0YVsxMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1Db2RlOiBhcHBEYXRhWzExXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkRCOiAvLyBEUVQgKERlZmluZSBRdWFudGl6YXRpb24gVGFibGVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHF1YW50aXphdGlvblRhYmxlc0xlbmd0aCA9IHJlYWRVaW50MTYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxdWFudGl6YXRpb25UYWJsZXNFbmQgPSBxdWFudGl6YXRpb25UYWJsZXNMZW5ndGggKyBvZmZzZXQgLSAyO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG9mZnNldCA8IHF1YW50aXphdGlvblRhYmxlc0VuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBxdWFudGl6YXRpb25UYWJsZVNwZWMgPSBkYXRhW29mZnNldCsrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFibGVEYXRhID0gbmV3IEludDMyQXJyYXkoNjQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgocXVhbnRpemF0aW9uVGFibGVTcGVjID4+IDQpID09PSAwKSB7IC8vIDggYml0IHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgNjQ7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHogPSBkY3RaaWdaYWdbal07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWJsZURhdGFbel0gPSBkYXRhW29mZnNldCsrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoKHF1YW50aXphdGlvblRhYmxlU3BlYyA+PiA0KSA9PT0gMSkgeyAvLzE2IGJpdFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgNjQ7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHogPSBkY3RaaWdaYWdbal07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWJsZURhdGFbel0gPSByZWFkVWludDE2KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJEUVQ6IGludmFsaWQgdGFibGUgc3BlY1wiO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXphdGlvblRhYmxlc1txdWFudGl6YXRpb25UYWJsZVNwZWMgJiAxNV0gPSB0YWJsZURhdGE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICBjYXNlIDB4RkZDMDogLy8gU09GMCAoU3RhcnQgb2YgRnJhbWUsIEJhc2VsaW5lIERDVClcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAweEZGQzE6IC8vIFNPRjEgKFN0YXJ0IG9mIEZyYW1lLCBFeHRlbmRlZCBEQ1QpXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkMyOiAvLyBTT0YyIChTdGFydCBvZiBGcmFtZSwgUHJvZ3Jlc3NpdmUgRENUKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZyYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgXCJPbmx5IHNpbmdsZSBmcmFtZSBKUEVHcyBzdXBwb3J0ZWRcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlYWRVaW50MTYoKTsgLy8gc2tpcCBkYXRhIGxlbmd0aFxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lLmV4dGVuZGVkID0gKGZpbGVNYXJrZXIgPT09IDB4RkZDMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZS5wcm9ncmVzc2l2ZSA9IChmaWxlTWFya2VyID09PSAweEZGQzIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWUucHJlY2lzaW9uID0gZGF0YVtvZmZzZXQrK107XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZS5zY2FuTGluZXMgPSByZWFkVWludDE2KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZS5zYW1wbGVzUGVyTGluZSA9IHJlYWRVaW50MTYoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lLmNvbXBvbmVudElkcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudHNDb3VudCA9IGRhdGFbb2Zmc2V0KytdLCBjb21wb25lbnRJZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXhIID0gMCwgbWF4ViA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY29tcG9uZW50c0NvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRJZCA9IGRhdGFbb2Zmc2V0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaCA9IGRhdGFbb2Zmc2V0ICsgMV0gPj4gNDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdiA9IGRhdGFbb2Zmc2V0ICsgMV0gJiAxNTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWF4SCA8IGgpIG1heEggPSBoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXhWIDwgdikgbWF4ViA9IHY7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHFJZCA9IGRhdGFbb2Zmc2V0ICsgMl07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGwgPSBmcmFtZS5jb21wb25lbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoOiBoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2OiB2LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl6YXRpb25UYWJsZTogcXVhbnRpemF0aW9uVGFibGVzW3FJZF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcmFtZS5jb21wb25lbnRJZHNbY29tcG9uZW50SWRdID0gbCAtIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IDM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBmcmFtZS5tYXhIID0gbWF4SDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lLm1heFYgPSBtYXhWO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlcGFyZUNvbXBvbmVudHMoZnJhbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FzZSAweEZGQzQ6IC8vIERIVCAoRGVmaW5lIEh1ZmZtYW4gVGFibGVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGh1ZmZtYW5MZW5ndGggPSByZWFkVWludDE2KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAyOyBpIDwgaHVmZm1hbkxlbmd0aDspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaHVmZm1hblRhYmxlU3BlYyA9IGRhdGFbb2Zmc2V0KytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb2RlTGVuZ3RocyA9IG5ldyBVaW50OEFycmF5KDE2KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29kZUxlbmd0aFN1bSA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IDE2OyBqKyssIG9mZnNldCsrKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlTGVuZ3RoU3VtICs9IChjb2RlTGVuZ3Roc1tqXSA9IGRhdGFbb2Zmc2V0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGh1ZmZtYW5WYWx1ZXMgPSBuZXcgVWludDhBcnJheShjb2RlTGVuZ3RoU3VtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgY29kZUxlbmd0aFN1bTsgaisrLCBvZmZzZXQrKylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaHVmZm1hblZhbHVlc1tqXSA9IGRhdGFbb2Zmc2V0XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpICs9IDE3ICsgY29kZUxlbmd0aFN1bTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICgoaHVmZm1hblRhYmxlU3BlYyA+PiA0KSA9PT0gMCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh1ZmZtYW5UYWJsZXNEQyA6IGh1ZmZtYW5UYWJsZXNBQylbaHVmZm1hblRhYmxlU3BlYyAmIDE1XSA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1aWxkSHVmZm1hblRhYmxlKGNvZGVMZW5ndGhzLCBodWZmbWFuVmFsdWVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMHhGRkREOiAvLyBEUkkgKERlZmluZSBSZXN0YXJ0IEludGVydmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVhZFVpbnQxNigpOyAvLyBza2lwIGRhdGEgbGVuZ3RoXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNldEludGVydmFsID0gcmVhZFVpbnQxNigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgY2FzZSAweEZGREE6IC8vIFNPUyAoU3RhcnQgb2YgU2NhbilcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY2FuTGVuZ3RoID0gcmVhZFVpbnQxNigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGVjdG9yc0NvdW50ID0gZGF0YVtvZmZzZXQrK107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50cyA9IFtdLCBjb21wb25lbnQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc2VsZWN0b3JzQ291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRJbmRleCA9IGZyYW1lLmNvbXBvbmVudElkc1tkYXRhW29mZnNldCsrXV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50ID0gZnJhbWUuY29tcG9uZW50c1tjb21wb25lbnRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhYmxlU3BlYyA9IGRhdGFbb2Zmc2V0KytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudC5odWZmbWFuVGFibGVEQyA9IGh1ZmZtYW5UYWJsZXNEQ1t0YWJsZVNwZWMgPj4gNF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50Lmh1ZmZtYW5UYWJsZUFDID0gaHVmZm1hblRhYmxlc0FDW3RhYmxlU3BlYyAmIDE1XTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcGVjdHJhbFN0YXJ0ID0gZGF0YVtvZmZzZXQrK107XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3BlY3RyYWxFbmQgPSBkYXRhW29mZnNldCsrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdWNjZXNzaXZlQXBwcm94aW1hdGlvbiA9IGRhdGFbb2Zmc2V0KytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHByb2Nlc3NlZCA9IGRlY29kZVNjYW4oZGF0YSwgb2Zmc2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lLCBjb21wb25lbnRzLCByZXNldEludGVydmFsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWN0cmFsU3RhcnQsIHNwZWN0cmFsRW5kLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NpdmVBcHByb3hpbWF0aW9uID4+IDQsIHN1Y2Nlc3NpdmVBcHByb3hpbWF0aW9uICYgMTUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IHByb2Nlc3NlZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFbb2Zmc2V0IC0gM10gPT0gMHhGRiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFbb2Zmc2V0IC0gMl0gPj0gMHhDMCAmJiBkYXRhW29mZnNldCAtIDJdIDw9IDB4RkUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb3VsZCBiZSBpbmNvcnJlY3QgZW5jb2RpbmcgLS0gbGFzdCAweEZGIGJ5dGUgb2YgdGhlIHByZXZpb3VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmxvY2sgd2FzIGVhdGVuIGJ5IHRoZSBlbmNvZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0IC09IDM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBcInVua25vd24gSlBFRyBtYXJrZXIgXCIgKyBmaWxlTWFya2VyLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmlsZU1hcmtlciA9IHJlYWRVaW50MTYoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy53aWR0aCA9IGZyYW1lLnNhbXBsZXNQZXJMaW5lO1xuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSBmcmFtZS5zY2FuTGluZXM7XG4gICAgICAgICAgICB0aGlzLmpmaWYgPSBqZmlmO1xuICAgICAgICAgICAgdGhpcy5hZG9iZSA9IGFkb2JlO1xuICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZyYW1lLmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50ID0gZnJhbWUuY29tcG9uZW50c1tpXTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIG91dHB1dDogYnVpbGRDb21wb25lbnREYXRhKGZyYW1lLCBjb21wb25lbnQpLFxuICAgICAgICAgICAgICAgICAgICBzY2FsZVg6IGNvbXBvbmVudC5oIC8gZnJhbWUubWF4SCxcbiAgICAgICAgICAgICAgICAgICAgc2NhbGVZOiBjb21wb25lbnQudiAvIGZyYW1lLm1heFYsXG4gICAgICAgICAgICAgICAgICAgIGJsb2Nrc1BlckxpbmU6IGNvbXBvbmVudC5ibG9ja3NQZXJMaW5lLFxuICAgICAgICAgICAgICAgICAgICBibG9ja3NQZXJDb2x1bW46IGNvbXBvbmVudC5ibG9ja3NQZXJDb2x1bW5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBnZXREYXRhOiBmdW5jdGlvbiBnZXREYXRhKGltYWdlRGF0YSwgd2lkdGgsIGhlaWdodCkge1xuICAgICAgICAgICAgdmFyIHNjYWxlWCA9IHRoaXMud2lkdGggLyB3aWR0aCwgc2NhbGVZID0gdGhpcy5oZWlnaHQgLyBoZWlnaHQ7XG5cbiAgICAgICAgICAgIHZhciBjb21wb25lbnQsIGNvbXBvbmVudFNjYWxlWCwgY29tcG9uZW50U2NhbGVZO1xuICAgICAgICAgICAgdmFyIHgsIHksIGk7XG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICAgICAgICAgIHZhciBZLCBDYiwgQ3IsIEssIEMsIE0sIFllLCBSLCBHLCBCO1xuICAgICAgICAgICAgdmFyIGNvbG9yVHJhbnNmb3JtO1xuICAgICAgICAgICAgdmFyIG51bUNvbXBvbmVudHMgPSB0aGlzLmNvbXBvbmVudHMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGRhdGFMZW5ndGggPSB3aWR0aCAqIGhlaWdodCAqIG51bUNvbXBvbmVudHM7XG4gICAgICAgICAgICAvL3ZhciBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoZGF0YUxlbmd0aCk7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGltYWdlRGF0YS5kYXRhO1xuICAgICAgICAgICAgdmFyIGNvbXBvbmVudExpbmU7XG5cbiAgICAgICAgICAgIC8vIGxpbmVEYXRhIGlzIHJldXNlZCBmb3IgYWxsIGNvbXBvbmVudHMuIEFzc3VtZSBmaXJzdCBjb21wb25lbnQgaXNcbiAgICAgICAgICAgIC8vIHRoZSBiaWdnZXN0XG4gICAgICAgICAgICB2YXIgbGluZURhdGEgPSBuZXcgVWludDhBcnJheSgodGhpcy5jb21wb25lbnRzWzBdLmJsb2Nrc1BlckxpbmUgPDwgMykgKlxuICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50c1swXS5ibG9ja3NQZXJDb2x1bW4gKiA4KTtcblxuICAgICAgICAgICAgLy8gRmlyc3QgY29uc3RydWN0IGltYWdlIGRhdGEgLi4uXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbnVtQ29tcG9uZW50czsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50ID0gdGhpcy5jb21wb25lbnRzW2kgPCAzID8gMiAtIGkgOiBpXTtcbiAgICAgICAgICAgICAgICB2YXIgYmxvY2tzUGVyTGluZSA9IGNvbXBvbmVudC5ibG9ja3NQZXJMaW5lO1xuICAgICAgICAgICAgICAgIHZhciBibG9ja3NQZXJDb2x1bW4gPSBjb21wb25lbnQuYmxvY2tzUGVyQ29sdW1uO1xuICAgICAgICAgICAgICAgIHZhciBzYW1wbGVzUGVyTGluZSA9IGJsb2Nrc1BlckxpbmUgPDwgMztcblxuICAgICAgICAgICAgICAgIHZhciBqLCBrLCBsbCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmVPZmZzZXQgPSAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGJsb2NrUm93ID0gMDsgYmxvY2tSb3cgPCBibG9ja3NQZXJDb2x1bW47IGJsb2NrUm93KyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjYW5MaW5lID0gYmxvY2tSb3cgPDwgMztcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYmxvY2tDb2wgPSAwOyBibG9ja0NvbCA8IGJsb2Nrc1BlckxpbmU7IGJsb2NrQ29sKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBidWZmZXJPZmZzZXQgPSBnZXRCbG9ja0J1ZmZlck9mZnNldChjb21wb25lbnQsIGJsb2NrUm93LCBibG9ja0NvbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb2Zmc2V0ID0gMCwgc2FtcGxlID0gYmxvY2tDb2wgPDwgMztcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCA4OyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGluZU9mZnNldCA9IChzY2FuTGluZSArIGopICogc2FtcGxlc1BlckxpbmU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChrID0gMDsgayA8IDg7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5lRGF0YVtsaW5lT2Zmc2V0ICsgc2FtcGxlICsga10gPVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50Lm91dHB1dFtidWZmZXJPZmZzZXQgKyBvZmZzZXQrK107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29tcG9uZW50U2NhbGVYID0gY29tcG9uZW50LnNjYWxlWCAqIHNjYWxlWDtcbiAgICAgICAgICAgICAgICBjb21wb25lbnRTY2FsZVkgPSBjb21wb25lbnQuc2NhbGVZICogc2NhbGVZO1xuICAgICAgICAgICAgICAgIG9mZnNldCA9IGk7XG5cbiAgICAgICAgICAgICAgICB2YXIgY3gsIGN5O1xuICAgICAgICAgICAgICAgIHZhciBpbmRleDtcbiAgICAgICAgICAgICAgICBmb3IgKHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN5ID0gMCB8ICh5ICogY29tcG9uZW50U2NhbGVZKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN4ID0gMCB8ICh4ICogY29tcG9uZW50U2NhbGVYKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gY3kgKiBzYW1wbGVzUGVyTGluZSArIGN4O1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVtvZmZzZXRdID0gbGluZURhdGFbaW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ICs9IG51bUNvbXBvbmVudHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAvKlxuICAgICAgICAgICAvLyAuLi4gdGhlbiB0cmFuc2Zvcm0gY29sb3JzLCBpZiBuZWNlc3NhcnlcbiAgICAgICAgICAgc3dpdGNoIChudW1Db21wb25lbnRzKSB7XG4gICAgICAgICAgIGNhc2UgMTogY2FzZSAyOiBicmVhaztcbiAgICAgICAgICAgLy8gbm8gY29sb3IgY29udmVyc2lvbiBmb3Igb25lIG9yIHR3byBjb21wb2VuZW50c1xuXG4gICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgLy8gVGhlIGRlZmF1bHQgdHJhbnNmb3JtIGZvciB0aHJlZSBjb21wb25lbnRzIGlzIHRydWVcbiAgICAgICAgICAgY29sb3JUcmFuc2Zvcm0gPSB0cnVlO1xuICAgICAgICAgICAvLyBUaGUgYWRvYmUgdHJhbnNmb3JtIG1hcmtlciBvdmVycmlkZXMgYW55IHByZXZpb3VzIHNldHRpbmdcbiAgICAgICAgICAgaWYgKHRoaXMuYWRvYmUgJiYgdGhpcy5hZG9iZS50cmFuc2Zvcm1Db2RlKVxuICAgICAgICAgICBjb2xvclRyYW5zZm9ybSA9IHRydWU7XG4gICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzLmNvbG9yVHJhbnNmb3JtICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgY29sb3JUcmFuc2Zvcm0gPSAhIXRoaXMuY29sb3JUcmFuc2Zvcm07XG5cbiAgICAgICAgICAgaWYgKGNvbG9yVHJhbnNmb3JtKSB7XG4gICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkYXRhTGVuZ3RoOyBpICs9IG51bUNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgWSAgPSBkYXRhW2kgICAgXTtcbiAgICAgICAgICAgQ2IgPSBkYXRhW2kgKyAxXTtcbiAgICAgICAgICAgQ3IgPSBkYXRhW2kgKyAyXTtcblxuICAgICAgICAgICBSID0gY2xhbXBUb1VpbnQ4KFkgLSAxNzkuNDU2ICsgMS40MDIgKiBDcik7XG4gICAgICAgICAgIEcgPSBjbGFtcFRvVWludDgoWSArIDEzNS40NTkgLSAwLjM0NCAqIENiIC0gMC43MTQgKiBDcik7XG4gICAgICAgICAgIEIgPSBjbGFtcFRvVWludDgoWSAtIDIyNi44MTYgKyAxLjc3MiAqIENiKTtcblxuICAgICAgICAgICBkYXRhW2kgICAgXSA9IFI7XG4gICAgICAgICAgIGRhdGFbaSArIDFdID0gRztcbiAgICAgICAgICAgZGF0YVtpICsgMl0gPSBCO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5jb2xvclRyYW5zZm9ybSk7XG4gICAgICAgICAgIGlmICghdGhpcy5hZG9iZSlcbiAgICAgICAgICAgdGhyb3cgJ1Vuc3VwcG9ydGVkIGNvbG9yIG1vZGUgKDQgY29tcG9uZW50cyknO1xuICAgICAgICAgICAvLyBUaGUgZGVmYXVsdCB0cmFuc2Zvcm0gZm9yIGZvdXIgY29tcG9uZW50cyBpcyBmYWxzZVxuICAgICAgICAgICBjb2xvclRyYW5zZm9ybSA9IGZhbHNlO1xuICAgICAgICAgICAvLyBUaGUgYWRvYmUgdHJhbnNmb3JtIG1hcmtlciBvdmVycmlkZXMgYW55IHByZXZpb3VzIHNldHRpbmdcbiAgICAgICAgICAgaWYgKHRoaXMuYWRvYmUgJiYgdGhpcy5hZG9iZS50cmFuc2Zvcm1Db2RlKVxuICAgICAgICAgICBjb2xvclRyYW5zZm9ybSA9IHRydWU7XG4gICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiB0aGlzLmNvbG9yVHJhbnNmb3JtICE9PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgY29sb3JUcmFuc2Zvcm0gPSAhIXRoaXMuY29sb3JUcmFuc2Zvcm07XG5cbiAgICAgICAgICAgaWYgKGNvbG9yVHJhbnNmb3JtKSB7XG4gICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkYXRhTGVuZ3RoOyBpICs9IG51bUNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgWSAgPSBkYXRhW2ldO1xuICAgICAgICAgICBDYiA9IGRhdGFbaSArIDFdO1xuICAgICAgICAgICBDciA9IGRhdGFbaSArIDJdO1xuXG4gICAgICAgICAgIEMgPSBjbGFtcFRvVWludDgoNDM0LjQ1NiAtIFkgLSAxLjQwMiAqIENyKTtcbiAgICAgICAgICAgTSA9IGNsYW1wVG9VaW50OCgxMTkuNTQxIC0gWSArIDAuMzQ0ICogQ2IgKyAwLjcxNCAqIENyKTtcbiAgICAgICAgICAgWSA9IGNsYW1wVG9VaW50OCg0ODEuODE2IC0gWSAtIDEuNzcyICogQ2IpO1xuXG4gICAgICAgICAgIGRhdGFbaSAgICBdID0gQztcbiAgICAgICAgICAgZGF0YVtpICsgMV0gPSBNO1xuICAgICAgICAgICBkYXRhW2kgKyAyXSA9IFk7XG4gICAgICAgICAgIC8vIEsgaXMgdW5jaGFuZ2VkXG4gICAgICAgICAgIH1cbiAgICAgICAgICAgfVxuICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgdGhyb3cgJ1Vuc3VwcG9ydGVkIGNvbG9yIG1vZGUnO1xuICAgICAgICAgICB9XG4gICAgICAgICAgICovXG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfSxcbiAgICAgICAgY29weVRvSW1hZ2VEYXRhOiBmdW5jdGlvbiBjb3B5VG9JbWFnZURhdGEoaW1hZ2VEYXRhKSB7XG4gICAgICAgICAgICB2YXIgd2lkdGggPSBpbWFnZURhdGEud2lkdGgsIGhlaWdodCA9IGltYWdlRGF0YS5oZWlnaHQ7XG4gICAgICAgICAgICB2YXIgaW1hZ2VEYXRhQnl0ZXMgPSB3aWR0aCAqIGhlaWdodCAqIDQ7XG4gICAgICAgICAgICB2YXIgaW1hZ2VEYXRhQXJyYXkgPSBpbWFnZURhdGEuZGF0YTtcbiAgICAgICAgICAgIHZhciBkYXRhID0gdGhpcy5nZXREYXRhKHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICAgICAgdmFyIGkgPSAwLCBqID0gMCwgazAsIGsxO1xuICAgICAgICAgICAgdmFyIFksIEssIEMsIE0sIFIsIEcsIEI7XG4gICAgICAgICAgICBzd2l0Y2ggKHRoaXMuY29tcG9uZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlIChqIDwgaW1hZ2VEYXRhQnl0ZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFkgPSBkYXRhW2krK107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlRGF0YUFycmF5W2orK10gPSBZO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VEYXRhQXJyYXlbaisrXSA9IFk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZURhdGFBcnJheVtqKytdID0gWTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlRGF0YUFycmF5W2orK10gPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaiA8IGltYWdlRGF0YUJ5dGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBSID0gZGF0YVtpKytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgRyA9IGRhdGFbaSsrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEIgPSBkYXRhW2krK107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlRGF0YUFycmF5W2orK10gPSBSO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VEYXRhQXJyYXlbaisrXSA9IEc7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZURhdGFBcnJheVtqKytdID0gQjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlRGF0YUFycmF5W2orK10gPSAyNTU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaiA8IGltYWdlRGF0YUJ5dGVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDID0gZGF0YVtpKytdO1xuICAgICAgICAgICAgICAgICAgICAgICAgTSA9IGRhdGFbaSsrXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFkgPSBkYXRhW2krK107XG4gICAgICAgICAgICAgICAgICAgICAgICBLID0gZGF0YVtpKytdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBrMCA9IDI1NSAtIEs7XG4gICAgICAgICAgICAgICAgICAgICAgICBrMSA9IGswIC8gMjU1O1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIFIgPSBjbGFtcFRvVWludDgoazAgLSBDICogazEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgRyA9IGNsYW1wVG9VaW50OChrMCAtIE0gKiBrMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBCID0gY2xhbXBUb1VpbnQ4KGswIC0gWSAqIGsxKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VEYXRhQXJyYXlbaisrXSA9IFI7XG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZURhdGFBcnJheVtqKytdID0gRztcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlRGF0YUFycmF5W2orK10gPSBCO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VEYXRhQXJyYXlbaisrXSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICB0aHJvdyAnVW5zdXBwb3J0ZWQgY29sb3IgbW9kZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGNvbnN0cnVjdG9yO1xufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWNvZGUgKGRhdGEpIHtcbiAgICBjb25zdCBqcGVnSW1hZ2UgPSBuZXcgSnBlZ0ltYWdlKCk7XG5cbiAgICBqcGVnSW1hZ2UubG9hZEZyb21CdWZmZXIoZGF0YSk7XG5cbiAgICB2YXIgaW1hZ2VEYXRhO1xuICAgIGlmICh0eXBlb2YgSW1hZ2VEYXRhICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpbWFnZURhdGEgPSBuZXcgSW1hZ2VEYXRhKGpwZWdJbWFnZS53aWR0aCwganBlZ0ltYWdlLmhlaWdodCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW1hZ2VEYXRhID0ge1xuICAgICAgICAgICAgd2lkdGg6IGpwZWdJbWFnZS53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDoganBlZ0ltYWdlLmhlaWdodCxcbiAgICAgICAgICAgIGRhdGE6IG5ldyBVaW50OENsYW1wZWRBcnJheShqcGVnSW1hZ2Uud2lkdGggKiBqcGVnSW1hZ2UuaGVpZ2h0ICogNClcbiAgICAgICAgfTtcbiAgICB9XG4gICAganBlZ0ltYWdlLmdldERhdGEoaW1hZ2VEYXRhLCBqcGVnSW1hZ2Uud2lkdGgsIGpwZWdJbWFnZS5oZWlnaHQpO1xuXG4gICAgcmV0dXJuIGltYWdlRGF0YTtcbn07XG4iXX0=
