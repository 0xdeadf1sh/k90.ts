///////////////////////////////////////////////////////////////////////////
//////////////////////////////////// ENGINE ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
import {
    Renderer,
    Geometry,
    TransformBuffer,
    TimestampQuery,
    FirstPersonCamera,
    Log,
} from "./k90";

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////// MATH ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
import { mat4 } from "wgpu-matrix";

///////////////////////////////////////////////////////////////////////////
////////////////////////////////// SHADERS ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
import wgslBasicCode from "../shaders/basic.wgsl?raw";

///////////////////////////////////////////////////////////////////////////
////////////////////////////////// ENTRY //////////////////////////////////
///////////////////////////////////////////////////////////////////////////
async function main() {
    try {
        const renderer = await Renderer.create("k90-renderer");

        const cube = Geometry.genCube("half");

        const indexBuffer = await renderer.createAndWriteBuffer({
            label: "Index Buffer",
            size: cube.indices.byteLength,
            usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        }, cube.indices);

        const vertexBuffer = await renderer.createAndWriteBuffer({
            label: "Vertex Buffer",
            size: cube.vertices.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        }, cube.vertices);

        const objectCount = 1;
        const transformBuffer = await TransformBuffer.create(renderer,
            wgslBasicCode,
            objectCount);

        const shaderModule = await renderer.createShaderModule({
            label: "basic.wgsl",
            code: wgslBasicCode,
        });

        const texture = await renderer.createTextureFromBitmap(
            "/assets/textures/cat/cat.jpg",
            "rgba8unorm-srgb",
        );

        const sampler = await renderer.createSampler({
            label: "Texture Sampler",
            addressModeU: "repeat",
            addressModeV: "repeat",
            addressModeW: "repeat",
            minFilter: "linear",
            magFilter: "linear",
            mipmapFilter: "linear",
            maxAnisotropy: 4,
        });

        const bindGroup0Layout = await renderer.createBindGroupLayout({
            entries: [
                {
                    binding: 0, visibility: GPUShaderStage.VERTEX, buffer: {
                        type: "read-only-storage",
                        minBindingSize: cube.vertices.byteLength,
                    }
                },
                {
                    binding: 1, visibility: GPUShaderStage.VERTEX, buffer: {
                        type: "read-only-storage",
                        minBindingSize: transformBuffer.totalSizeInBytes(),
                    }
                },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: {} },
            ],
        });

        const bindGroup0 = await renderer.createBindGroup({
            layout: bindGroup0Layout,
            entries: [
                { binding: 0, resource: vertexBuffer },
                { binding: 1, resource: transformBuffer.getBuffer() },
                { binding: 2, resource: sampler },
                { binding: 3, resource: texture },
            ],
        });

        const renderpassQuery = await TimestampQuery.create(renderer);

        const pipelineLayout = await renderer.createPipelineLayout({
            bindGroupLayouts: [
                bindGroup0Layout,
            ],
        });

        const basicPipeline = await renderer.createRenderPipeline({
            label: "basic.wgsl",
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
            },
            fragment: {
                module: shaderModule,
                targets: [{ format: renderer.getPresentationFormat() }]
            },
            primitive: {
                topology: "triangle-list",
                cullMode: "back",
                frontFace: "ccw",
            },
            depthStencil: {
                format: "depth24plus-stencil8",
                depthCompare: "greater",
                depthWriteEnabled: true,
            },
        });

        const renderBundleEncoder = await renderer.createRenderBundleEncoder({
            colorFormats: [renderer.getPresentationFormat()],
            depthStencilFormat: "depth24plus-stencil8",
        });

        renderBundleEncoder.setPipeline(basicPipeline);
        renderBundleEncoder.setBindGroup(0, bindGroup0);
        renderBundleEncoder.setIndexBuffer(indexBuffer, "uint16");
        renderBundleEncoder.drawIndexed(cube.indices.length, objectCount);

        const renderBundle = renderBundleEncoder.finish();

        let totalTime: number = 0;
        let depthStencilTexture: GPUTexture | null = null;

        const camera = new FirstPersonCamera(window);

        renderer.render(async (dt: number) => {

            totalTime += dt * 1e-3;

            if (!depthStencilTexture ||
                depthStencilTexture.width !== renderer.getRenderWidth() ||
                depthStencilTexture.height !== renderer.getRenderHeight()) {

                depthStencilTexture?.destroy();

                const w = renderer.getRenderWidth();
                const h = renderer.getRenderHeight();
                depthStencilTexture = await renderer.createDepthStencilTexture(w, h);
                Log.info(`Created a depth-stencil texture of size ${w}x${h}`);
            }

            const projView = camera.update(dt, renderer.getAspectRatio());
            const model = mat4.axisRotation([1.0, 1.0, 1.0], totalTime);

            transformBuffer.upload([{ pvm: mat4.mul(projView, model) }]);

            const renderpassDescriptor: GPURenderPassDescriptor = {
                label: "render pass descriptor for basic.wgsl",
                colorAttachments: [{
                    clearValue: [0.2, 0.2, 0.3, 1.0],
                    loadOp: "clear",
                    storeOp: "store",
                    view: renderer.createViewForCurrentTexture(),
                }],
                depthStencilAttachment: {
                    view: depthStencilTexture.createView(),
                    depthLoadOp: "clear",
                    depthStoreOp: "store",
                    depthClearValue: 0.0,
                    stencilLoadOp: "clear",
                    stencilStoreOp: "discard",
                    stencilClearValue: 0.0,
                },
                timestampWrites: renderpassQuery.getTimestampWritesForRenderpass(),
            };

            const cmdEncoder = renderer.createCmdEncoder({
                label: "basic.wgsl pipeline",
            });

            const pass = cmdEncoder.beginRenderPass(renderpassDescriptor);
            pass.executeBundles([renderBundle]);
            pass.end();

            renderpassQuery.resolve(cmdEncoder);

            const commandBuffer = cmdEncoder.finish();
            renderer.submitCmdBuffers([commandBuffer]);

            renderpassQuery.getTimePassed().then(timePassed => {
                renderer.writeRenderpassMS(timePassed);
            });
        });
    }
    catch (ex) {
        printException(ex);
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////// EXCEPTION HANDLING /////////////////////////////
///////////////////////////////////////////////////////////////////////////
function printException(ex: unknown) {
    const exceptionDiv = document.querySelector("#k90-exception") as HTMLDivElement;

    if ((ex instanceof Error) && exceptionDiv) {
        exceptionDiv.innerHTML += `[K90 EXCEPTION]: ${ex.message}<br><br>`;
        exceptionDiv.innerHTML += `${ex.stack}`;
        exceptionDiv.style.display = "flex";
    }
    else {
        window.alert("K90: UNKNOWN EXCEPTION OCCURRED");
    }
}

main();
