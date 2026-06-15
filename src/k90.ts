import packageJson from "../package.json";
import wgslBasicCode from "../shaders/basic.wgsl?raw";

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// CONSTANTS ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
const K90_LOGGER_DIV_ID = "k90-logs";
const K90_CANVAS_DIV_ID = "k90-renderer";
const K90_DEBUG_UI_FPS = "k90-debug";
const K90_RECOMMENDED_MIN_FPS = 50;
const K90_WARNING_MIN_FPS = 30;

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// UTILITIES ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
class Util {

    ///////////////////////////////////////////////////////////////////////////
    public static clamp(k: number, min: number, max: number): number {
        return Math.min(max, Math.max(k, min));
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////// LOGGING ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
class Log {

    ///////////////////////////////////////////////////////////////////////////
    private static _logDiv: HTMLDivElement;

    ///////////////////////////////////////////////////////////////////////////
    private static get logDiv(): HTMLDivElement {
        if (!this._logDiv) {
            const div = document.querySelector(`#${K90_LOGGER_DIV_ID}`);
            if (!div) {
                throw new Error(`Log div with id = '${K90_LOGGER_DIV_ID}' not found!`);
            }
            this._logDiv = div as HTMLDivElement;
        }
        return this._logDiv;
    }

    ///////////////////////////////////////////////////////////////////////////
    private static get date(): string {
        const now = new Date();
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        const millisecond = String(now.getMilliseconds()).padStart(3, '0');
        return `[${hour}:${minute}:${second}:${millisecond}]`;
    }

    ///////////////////////////////////////////////////////////////////////////
    public static info(message: string) {
        this.logDiv.innerHTML += `<span style='color: lightgreen;'>${this.date}: ${message}</span>`;
        this.logDiv.scrollTop = this.logDiv.scrollHeight;
    }

    ///////////////////////////////////////////////////////////////////////////
    public static warn(message: string) {
        this.logDiv.innerHTML += `<span style='color: yellow;'>${this.date}: ${message}</span>`;
        this.logDiv.scrollTop = this.logDiv.scrollHeight;
    }

    ///////////////////////////////////////////////////////////////////////////
    public static error(message: string) {
        this.logDiv.innerHTML += `<span style='color: red;'>${this.date}: ${message}</span>`;
        this.logDiv.scrollTop = this.logDiv.scrollHeight;
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////// DELTA-TIME COMPUTATION /////////////////////////
///////////////////////////////////////////////////////////////////////////
class DeltaTime {

    ///////////////////////////////////////////////////////////////////////////
    private previous: number;

    ///////////////////////////////////////////////////////////////////////////
    public constructor() {
        this.previous = performance.now();
    }

    ///////////////////////////////////////////////////////////////////////////
    public dt(): number {
        const now = performance.now();
        const deltaTime = now - this.previous;
        this.previous = now;
        return deltaTime;
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////// PERFORMANCE ELEMENTS ///////////////////////////
///////////////////////////////////////////////////////////////////////////
class DebugUI {

    ///////////////////////////////////////////////////////////////////////////
    private readonly debugDiv: HTMLDivElement;

    ///////////////////////////////////////////////////////////////////////////
    private prevTime: number;
    private frameCount: number;
    private totalFPS: number;

    ///////////////////////////////////////////////////////////////////////////
    private prevRender: number;
    private totalRender: number;

    ///////////////////////////////////////////////////////////////////////////
    public constructor(private readonly canvas: HTMLCanvasElement,
        private readonly delayMS: number) {

        const debugDiv = document.getElementById(K90_DEBUG_UI_FPS);
        if (!debugDiv) {
            throw new Error(`debug div with id '${K90_DEBUG_UI_FPS}' doesn't exist!`);
        }

        this.prevTime = 0;
        this.frameCount = 0;
        this.totalFPS = 0;

        this.prevRender = 0;
        this.totalRender = 0;

        this.debugDiv = debugDiv as HTMLDivElement;
    }

    ///////////////////////////////////////////////////////////////////////////
    private printAvgFPS() {
        const avgFPS = this.totalFPS / this.frameCount;

        if (avgFPS >= K90_RECOMMENDED_MIN_FPS) {
            this.debugDiv.innerHTML += `<span style='color: #00ff00;'>FPS: ${avgFPS.toFixed(2)}</span><br>`;
        }
        else if (avgFPS >= K90_WARNING_MIN_FPS) {
            this.debugDiv.innerHTML += `<span style='color: #ffff00;'>FPS: ${avgFPS.toFixed(2)}</span><br>`;
        }
        else {
            this.debugDiv.innerHTML += `<span style='color: #ff0000;'>FPS: ${avgFPS.toFixed(2)}</span><br>`;
        }

        this.totalFPS = 0.0;
    }

    ///////////////////////////////////////////////////////////////////////////
    private printResolution() {
        this.debugDiv.innerHTML += `RES: ${this.canvas.width} x ${this.canvas.height}`;
    }

    ///////////////////////////////////////////////////////////////////////////
    private printAvgRenderFPS() {
        const avgRenderFPS = (this.totalRender / this.frameCount);
        this.debugDiv.innerHTML += `RENDER: ${avgRenderFPS.toFixed(2)} MS<br>`;
        this.totalRender = 0.0;
    }

    ///////////////////////////////////////////////////////////////////////////
    public update() {
        this.frameCount += 1;

        const now = performance.now();
        if (now - this.prevTime >= this.delayMS) {
            this.debugDiv.innerHTML = "";

            this.printAvgFPS();
            this.printAvgRenderFPS();
            this.printResolution();

            this.prevTime = now;
            this.frameCount = 1;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    public writeFPS(fps: number) {
        this.totalFPS += fps;
    }

    ///////////////////////////////////////////////////////////////////////////
    public writeDT(dt: number) {
        this.totalFPS += 1000.0 / dt;
    }

    ///////////////////////////////////////////////////////////////////////////
    public beginRender() {
        this.prevRender = performance.now();
    }

    ///////////////////////////////////////////////////////////////////////////
    public endRender() {
        const now = performance.now();
        this.totalRender += now - this.prevRender;
    }
}

///////////////////////////////////////////////////////////////////////////
///////////////////////////// RENDERER PARAMS /////////////////////////////
///////////////////////////////////////////////////////////////////////////
interface RendererConstructorParams {
    canvas: HTMLCanvasElement;
    adapter: GPUAdapter;
    device: GPUDevice;
}

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// RENDERER ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
class Renderer {

    ///////////////////////////////////////////////////////////////////////////
    ////////////////////////////// WEBGPU CONTEXT /////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    private readonly canvas: HTMLCanvasElement;
    private readonly device: GPUDevice;
    private readonly context: GPUCanvasContext;
    private readonly presentationFormat: GPUTextureFormat;

    ///////////////////////////////////////////////////////////////////////////
    /////////////////////////////// PIPELINES /////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    private readonly basicPipeline: GPURenderPipeline;

    ///////////////////////////////////////////////////////////////////////////
    ////////////////////////// PERFORMANCE METRICS ////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    private readonly deltaTime: DeltaTime;
    private totalTime: number;

    ///////////////////////////////////////////////////////////////////////////
    //////////////////////////////// DEBUGGING ////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    private readonly debugUI: DebugUI;

    ///////////////////////////////////////////////////////////////////////////
    /////////////////////////// WEBGPU INITIALIZATION /////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    public static async create(canvasId: string): Promise<Renderer> {
        if (!navigator.gpu) {
            throw new Error("WebGPU is not supported!");
        }

        const adapterOptions: GPURequestAdapterOptions = {
            forceFallbackAdapter: false,
            powerPreference: "high-performance",
        };

        const adapter = await navigator.gpu.requestAdapter(adapterOptions);
        if (!adapter) {
            throw new Error("Failed to retrieve GPU adapter!");
        }

        Log.info(`gpu: ${adapter.info.description}`);
        Log.info(`arch: ${adapter.info.architecture}`);
        Log.info(`vendor: ${adapter.info.vendor}`);

        const device = await adapter.requestDevice({});
        if (!device) {
            throw new Error("Failed to retrieve GPU device!");
        }

        const canvas = document.querySelector(`#${canvasId}`) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error(`Canvas id=${canvasId} doesn't exist!`);
        }

        return new Renderer({
            canvas,
            adapter,
            device,
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    //////////////////////////////// CONSTRUCTOR //////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    private constructor(params: RendererConstructorParams) {
        this.canvas = params.canvas;
        this.device = params.device;

        this.device.lost.then(info => {
            throw new Error(`GPU device LOST due to ${info.reason}`);
        });

        const context = this.canvas.getContext("webgpu") as GPUCanvasContext;
        if (!context) {
            throw new Error("Failed to retrieve GPU context!");
        }

        this.context = context;
        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.presentationFormat,
            colorSpace: "srgb",
        });

        Log.info(`k90.ts version: ${packageJson.version}`);
        Log.info(`k90.ts author: ${packageJson.author}`);
        Log.info(`k90.ts license: ${packageJson.license}`);
        Log.info(`k90.ts description: ${packageJson.description}`);

        Log.info(`canvas format: ${this.presentationFormat}`);

        const shaderModule = this.device.createShaderModule({
            code: wgslBasicCode,
            label: "basic.wgsl"
        });

        this.basicPipeline = this.device.createRenderPipeline({
            label: "basic.wgsl",
            layout: "auto",
            vertex: {
                module: shaderModule,
            },
            fragment: {
                module: shaderModule,
                targets: [{ format: this.presentationFormat }]
            }
        });

        this.deltaTime = new DeltaTime();
        this.totalTime = 0.0;

        this.debugUI = new DebugUI(this.canvas, 1000);

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                let width = entry.devicePixelContentBoxSize[0]?.inlineSize ?? 0;
                let height = entry.devicePixelContentBoxSize[0]?.blockSize ?? 0;

                if (!width || !height) {
                    Log.warn("Rendering is NOT pixel-perfect");

                    const devicePixelRatio = window.devicePixelRatio;
                    width = Math.floor(this.canvas.clientWidth * devicePixelRatio);
                    height = Math.floor(this.canvas.clientHeight * devicePixelRatio);
                }

                width = Util.clamp(width, 1, this.device.limits.maxTextureDimension2D);
                height = Util.clamp(height, 1, this.device.limits.maxTextureDimension2D);

                if (this.canvas.width !== width || this.canvas.height !== height) {
                    Log.info(`Resizing from ${this.canvas.width} x ${this.canvas.height} to ${width} x ${height}`);

                    this.canvas.width = width;
                    this.canvas.height = height;
                }
            }
        });

        resizeObserver.observe(this.canvas);
    }

    ///////////////////////////////////////////////////////////////////////////
    public render(): void {

        this.debugUI.beginRender();

        const dt = this.deltaTime.dt();
        this.totalTime += dt * 1e-3;

        const renderpassDescriptor: GPURenderPassDescriptor = {
            label: "render pass descriptor for basic.wgsl",
            colorAttachments: [{
                clearValue: [Math.cos(this.totalTime) * 0.5 + 0.5, 0.2, 0.2, 1.0],
                loadOp: "clear",
                storeOp: "store",
                view: this.context.getCurrentTexture().createView(),
            }]
        };

        const encoder = this.device.createCommandEncoder({
            label: "command encoder for basic.wgsl pipeline",
        });

        const pass = encoder.beginRenderPass(renderpassDescriptor);
        pass.setPipeline(this.basicPipeline);
        pass.draw(3);
        pass.end();

        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);

        this.debugUI.endRender();

        this.debugUI.writeDT(dt);
        this.debugUI.update();

        requestAnimationFrame(() => this.render());
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////// ENTRY //////////////////////////////////
///////////////////////////////////////////////////////////////////////////
async function main() {
    try {
        const renderer = await Renderer.create(K90_CANVAS_DIV_ID);
        renderer.render();
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
