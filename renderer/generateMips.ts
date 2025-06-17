import shader from './shaders/webgpu/mips.wgsl?raw';

let sampler: GPUSampler;
let module: GPUShaderModule;
let buffer: GPUBuffer;
const pipelineByFormat = new WeakMap();

export function generateMips(device: GPUDevice, texture: GPUTexture): void {
    if (!buffer) {
        buffer = device.createBuffer({
            label: 'mips vertex buffer',
            size: 4 * 2 * 6,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(
            buffer.getMappedRange(0, buffer.size)
        ).set([
            0, 0,
            1, 0,
            0, 1,
            0, 1,
            1, 0,
            1, 1
        ]);
        buffer.unmap();

        module = device.createShaderModule({
            label: 'mips shader module',
            code: shader
        });

        sampler = device.createSampler({
            label: 'mips sampler',
            minFilter: 'linear'
        });
    }

    if (!pipelineByFormat[texture.format]) {
        pipelineByFormat[texture.format] = device.createRenderPipeline({
            label: 'mips pipeline',
            layout: 'auto',
            vertex: {
                module,
                buffers: [{
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x2' as const
                    }]
                }]
            },
            fragment: {
                module,
                targets: [{ format: texture.format }]
            }
        });
    }

    const pipeline = pipelineByFormat[texture.format];

    const encoder = device.createCommandEncoder({
        label: 'mips encoder'
    });

    for (let i = 1; i < texture.mipLevelCount; ++i) {
        for (let j = 0; j < texture.depthOrArrayLayers; ++j) {
            const bindGroup = device.createBindGroup({
                layout: pipeline.getBindGroupLayout(0),
                entries: [
                    {
                        binding: 0,
                        resource: sampler
                    },
                    {
                        binding: 1,
                        resource: texture.createView({
                            dimension: '2d',
                            baseMipLevel: i - 1,
                            mipLevelCount: 1,
                            baseArrayLayer: j,
                            arrayLayerCount: 1
                        })
                    }
                ]
            });

            const renderPassDescriptor = {
                label: 'mips render pass',
                colorAttachments: [
                    {
                        view: texture.createView({
                            dimension: '2d',
                            baseMipLevel: i,
                            mipLevelCount: 1,
                            baseArrayLayer: j,
                            arrayLayerCount: 1
                        }),
                        loadOp: 'clear',
                        storeOp: 'store'
                    },
                ],
            } as const;

            const pass = encoder.beginRenderPass(renderPassDescriptor);
            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0, buffer);
            pass.setBindGroup(0, bindGroup);
            pass.draw(6);
            pass.end();
        }
    }
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
}
