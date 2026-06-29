///////////////////////////////////////////////////////////////////////////
//////////////////////////// 3RD PARTY LIBRARIES //////////////////////////
///////////////////////////////////////////////////////////////////////////
import * as webgpuMemory from "./webgpu-memory/webgpu-memory.js";
import * as webgpuUtils from "webgpu-utils";

///////////////////////////////////////////////////////////////////////////
/////////////////////////////////// CONFIG ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
import packageJson from "../package.json";

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// CONSTANTS ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
const K90_LOGGER_DIV_ID = "k90-logs";
const K90_DEBUG_UI_FPS = "k90-debug";
const K90_RECOMMENDED_MIN_FPS = 50;
const K90_WARNING_MIN_FPS = 30;
const K90_MAX_LOGS = 100;

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// UTILITIES ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
export class Util {

    ///////////////////////////////////////////////////////////////////////////
    public static clamp(k: number, min: number, max: number): number {
        return Math.min(max, Math.max(k, min));
    }

    ///////////////////////////////////////////////////////////////////////////
    public static async loadImageBitmap(url: string): Promise<ImageBitmap> {
        const res = await fetch(url);
        const blob = await res.blob();
        return await createImageBitmap(blob, { colorSpaceConversion: "none" });
    }

    ///////////////////////////////////////////////////////////////////////////
    public static bytesToMebi(bytes: number): number {
        return bytes >> 20;
    }

    ///////////////////////////////////////////////////////////////////////////
    public static toRadians(deg: number): number {
        return deg * Math.PI / 180.0;
    }

    ///////////////////////////////////////////////////////////////////////////
    public static toDegrees(rad: number): number {
        return rad * 180.0 / Math.PI;
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////// LOGGING ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
export class Log {

    ///////////////////////////////////////////////////////////////////////////
    private static _logDiv: HTMLDivElement;

    ///////////////////////////////////////////////////////////////////////////
    private static logCount: number = 0;

    ///////////////////////////////////////////////////////////////////////////
    private static lastLog: string = "";

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
    private static canLog(log: string): boolean {
        this.logCount += 1;
        if (this.logCount == K90_MAX_LOGS) {
            this.logDiv.innerHTML += `<span style='color: yellow;'>TOO MANY LOGS, MAX=${K90_MAX_LOGS}</span>`;
            this.logDiv.scrollTop = this.logDiv.scrollHeight;
        }
        const res = this.logCount < K90_MAX_LOGS && log !== this.lastLog;;
        this.lastLog = log;
        return res;
    }

    ///////////////////////////////////////////////////////////////////////////
    public static info(message: string) {
        if (Log.canLog(message)) {
            this.logDiv.innerHTML += `<span style='color: lightgreen;'>${this.date}: ${message}</span>`;
            this.logDiv.scrollTop = this.logDiv.scrollHeight;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    public static warn(message: string) {
        if (Log.canLog(message)) {
            this.logDiv.innerHTML += `<span style='color: yellow;'>${this.date}: ${message}</span>`;
            this.logDiv.scrollTop = this.logDiv.scrollHeight;
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    public static error(message: string) {
        if (Log.canLog(message)) {
            this.logDiv.innerHTML += `<span style='color: red;'>${this.date}: ${message}</span>`;
            this.logDiv.scrollTop = this.logDiv.scrollHeight;
        }
    }
}

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// GEOMETRY ////////////////////////////////
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
export interface GeometryData {
    vertices: Float16Array | Float32Array,
    indices: Uint16Array | Uint32Array,
}

///////////////////////////////////////////////////////////////////////////
export type GeometryPrecision = "half" | "full";

///////////////////////////////////////////////////////////////////////////
export class Geometry {

    ///////////////////////////////////////////////////////////////////////////
    public static genQuad<T extends GeometryPrecision>(precision: T): GeometryData {
        const vertices = new ((precision === "half") ? Float16Array : Float32Array)([
            -0.5, -0.5, 0.0, 1.0,       // position
            0.0, 0.0, 1.0, 0.0,         // normal
            0.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, -0.5, 0.0, 1.0,        // position
            0.0, 0.0, 1.0, 0.0,         // normal
            1.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            -0.5, 0.5, 0.0, 1.0,        // position
            0.0, 0.0, 1.0, 0.0,         // normal
            0.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, 0.5, 0.0, 1.0,         // position
            0.0, 0.0, 1.0, 0.0,         // normal
            1.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding
        ]);

        const indices = new ((precision === "half") ? Uint16Array : Uint32Array)([
            0, 1, 2,
            2, 1, 3,
        ]);

        return {
            vertices,
            indices,
        };
    }

    ///////////////////////////////////////////////////////////////////////////
    public static genCube<T extends GeometryPrecision>(precision: T): GeometryData {
        const vertices = new ((precision === "half") ? Float16Array : Float32Array)([

            // front face
            -0.5, -0.5, 0.5, 1.0,       // position
            0.0, 0.0, 1.0, 0.0,         // normal
            0.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, -0.5, 0.5, 1.0,        // position
            0.0, 0.0, 1.0, 0.0,         // normal
            1.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            -0.5, 0.5, 0.5, 1.0,        // position
            0.0, 0.0, 1.0, 0.0,         // normal
            0.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, 0.5, 0.5, 1.0,         // position
            0.0, 0.0, 1.0, 0.0,         // normal
            1.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            // left face
            -0.5, -0.5, -0.5, 1.0,      // position
            -1.0, 0.0, 0.0, 0.0,        // normal
            0.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            -0.5, -0.5, 0.5, 1.0,       // position
            -1.0, 0.0, 0.0, 0.0,        // normal
            1.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            -0.5, 0.5, -0.5, 1.0,       // position
            -1.0, 0.0, 0.0, 0.0,        // normal
            0.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            -0.5, 0.5, 0.5, 1.0,        // position
            -1.0, 0.0, 0.0, 0.0,        // normal
            1.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            // back face
            0.5, -0.5, -0.5, 1.0,       // position
            0.0, 0.0, -1.0, 0.0,        // normal
            0.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            -0.5, -0.5, -0.5, 1.0,      // position
            0.0, 0.0, -1.0, 0.0,        // normal
            1.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, 0.5, -0.5, 1.0,        // position
            0.0, 0.0, -1.0, 0.0,        // normal
            0.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            -0.5, 0.5, -0.5, 1.0,       // position
            0.0, 0.0, -1.0, 0.0,        // normal
            1.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            // right face
            0.5, -0.5, 0.5, 1.0,        // position
            1.0, 0.0, 0.0, 0.0,         // normal
            0.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, -0.5, -0.5, 1.0,       // position
            1.0, 0.0, 0.0, 0.0,         // normal
            1.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, 0.5, 0.5, 1.0,         // position
            1.0, 0.0, 0.0, 0.0,         // normal
            0.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, 0.5, -0.5, 1.0,        // position
            1.0, 0.0, 0.0, 0.0,         // normal
            1.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            // top face
            -0.5, 0.5, 0.5, 1.0,        // position
            0.0, 1.0, 0.0, 0.0,         // normal
            0.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, 0.5, 0.5, 1.0,         // position
            0.0, 1.0, 0.0, 0.0,         // normal
            1.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            -0.5, 0.5, -0.5, 1.0,       // position
            0.0, 1.0, 0.0, 0.0,         // normal
            0.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, 0.5, -0.5, 1.0,        // position
            0.0, 1.0, 0.0, 0.0,         // normal
            1.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            // bottom face
            -0.5, -0.5, -0.5, 1.0,      // position
            0.0, -1.0, 0.0, 0.0,        // normal
            0.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, -0.5, -0.5, 1.0,       // position
            0.0, -1.0, 0.0, 0.0,        // normal
            1.0, 1.0,                   // texcoord

            0.0, 0.0,                   // padding

            -0.5, -0.5, 0.5, 1.0,       // position
            0.0, -1.0, 0.0, 0.0,        // normal
            0.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding

            0.5, -0.5, 0.5, 1.0,        // position
            0.0, -1.0, 0.0, 0.0,        // normal
            1.0, 0.0,                   // texcoord

            0.0, 0.0,                   // padding
        ]);

        const indices = new ((precision === "half") ? Uint16Array : Uint32Array)([
            // front face
            0, 1, 2,
            2, 1, 3,

            // left face
            4, 5, 6,
            6, 5, 7,

            // back face
            8, 9, 10,
            10, 9, 11,

            // right face
            12, 13, 14,
            14, 13, 15,

            // top face
            16, 17, 18,
            18, 17, 19,

            // bottom face
            20, 21, 22,
            22, 21, 23,
        ]);

        return {
            vertices,
            indices,
        };
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////// DELTA-TIME COMPUTATION /////////////////////////
///////////////////////////////////////////////////////////////////////////
export class DeltaTime {

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
////////////////////////////////// QUERIES ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
export class TimestampQuery {

    ///////////////////////////////////////////////////////////////////////////
    private constructor(private readonly querySet: GPUQuerySet,
        private readonly resolveBuffer: GPUBuffer,
        private readonly readBuffer: GPUBuffer) { }

    ///////////////////////////////////////////////////////////////////////////
    public static async create(renderer: Renderer): Promise<TimestampQuery> {
        const querySet = await renderer.createQuerySet({
            count: 2,
            type: "timestamp",
        });

        const resolveBuffer = await renderer.createBuffer({
            size: querySet.count * BigUint64Array.BYTES_PER_ELEMENT,
            usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
        });

        const readBuffer = await renderer.createBuffer({
            size: resolveBuffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        return new TimestampQuery(querySet, resolveBuffer, readBuffer);
    }

    ///////////////////////////////////////////////////////////////////////////
    public getTimestampWritesForRenderpass(): GPURenderPassTimestampWrites {
        return {
            querySet: this.querySet,
            beginningOfPassWriteIndex: 0,
            endOfPassWriteIndex: 1,
        };
    }

    ///////////////////////////////////////////////////////////////////////////
    public resolve(encoder: GPUCommandEncoder) {
        encoder.resolveQuerySet(this.querySet,
            0,
            this.querySet.count,
            this.resolveBuffer,
            0);

        if (this.readBuffer.mapState === "unmapped") {
            encoder.copyBufferToBuffer(this.resolveBuffer,
                0,
                this.readBuffer,
                0,
                this.readBuffer.size);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    public async getTimePassed(): Promise<number> {
        if (this.readBuffer.mapState === "unmapped") {
            await this.readBuffer.mapAsync(GPUMapMode.READ);
            const times = new BigUint64Array(this.readBuffer.getMappedRange());
            if (times[0] && times[1]) {
                const result = Number(times[1] - times[0]);
                this.readBuffer.unmap();
                return result * 1e-6;
            }
            this.readBuffer.unmap();
        }
        return 0.0;
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////// PERFORMANCE ELEMENTS ///////////////////////////
///////////////////////////////////////////////////////////////////////////
export class DebugUI {

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
    private totalRenderpassMS: number;

    ///////////////////////////////////////////////////////////////////////////
    public constructor(private readonly canvas: HTMLCanvasElement,
        private readonly device: GPUDevice,
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

        this.totalRenderpassMS = 0;

        this.debugDiv = debugDiv as HTMLDivElement;
    }

    ///////////////////////////////////////////////////////////////////////////
    private printAvgFPS() {
        const avgFPS = this.totalFPS / this.frameCount;

        if (avgFPS >= K90_RECOMMENDED_MIN_FPS) {
            this.debugDiv.innerHTML += `<span style='color: #00ff00;'>FPS: ${avgFPS.toFixed(2)}</span> | `;
        }
        else if (avgFPS >= K90_WARNING_MIN_FPS) {
            this.debugDiv.innerHTML += `<span style='color: #ffff00;'>FPS: ${avgFPS.toFixed(2)}</span> | `;
        }
        else {
            this.debugDiv.innerHTML += `<span style='color: #ff0000;'>FPS: ${avgFPS.toFixed(2)}</span> | `;
        }

        this.totalFPS = 0.0;
    }

    ///////////////////////////////////////////////////////////////////////////
    private printResolution() {
        this.debugDiv.innerHTML += `RES: ${this.canvas.width}x${this.canvas.height}<br>`;
    }

    ///////////////////////////////////////////////////////////////////////////
    private printAvgRenderFPS() {
        const avgRenderFPS = (this.totalRender / this.frameCount);
        this.debugDiv.innerHTML += `JS: ${avgRenderFPS.toFixed(2)} MS | `;
        this.totalRender = 0.0;
    }

    ///////////////////////////////////////////////////////////////////////////
    private printMemoryUsage() {
        const info = webgpuMemory.getWebGPUMemoryUsage(this.device);
        this.debugDiv.innerHTML += `GPU TOTAL: ${(Util.bytesToMebi(info.memory.total)).toFixed(2)} MB (MAX: ${Util.bytesToMebi(info.memory.maxTotal)} MB)<br>`;
        this.debugDiv.innerHTML += `GPU BUFFERS (${info.resources["buffer"]}): ${(Util.bytesToMebi(info.memory.buffer)).toFixed(2)} MB<br>`;
        this.debugDiv.innerHTML += `GPU TEXTURES (${info.resources["texture"]}): ${(Util.bytesToMebi(info.memory.texture)).toFixed(2)} MB<br>`;
        this.debugDiv.innerHTML += `GPU CANVAS (${info.resources["canvas"]}): ${(info.memory.canvas >> 20).toFixed(2)} MB<br>`
    }

    ///////////////////////////////////////////////////////////////////////////
    private printRenderpassMS() {
        const avgRenderpassMS = (this.totalRenderpassMS / this.frameCount);
        this.debugDiv.innerHTML += `RENDERPASS: ${avgRenderpassMS.toFixed(2)} MS<br>`;
        this.totalRenderpassMS = 0.0;
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
            this.printMemoryUsage();
            this.printRenderpassMS();

            this.prevTime = now;
            this.frameCount = 0;
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
    public writeRenderpassMS(ms: number) {
        this.totalRenderpassMS += ms;
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
///////////////////////////// TRANSFORM BUFFER ////////////////////////////
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
export interface TransformBufferContents {
    pvm: Float32Array,
}

///////////////////////////////////////////////////////////////////////////
export class TransformBuffer {

    ///////////////////////////////////////////////////////////////////////////
    private constructor(private readonly renderer: Renderer,
        private readonly gpuBuffer: GPUBuffer,
        private readonly view: webgpuUtils.StructuredView,
        private readonly count: number,
        private readonly size: number) { }

    ///////////////////////////////////////////////////////////////////////////
    public totalSizeInBytes() {
        return this.count * this.size;
    }

    ///////////////////////////////////////////////////////////////////////////
    public getBuffer(): GPUBuffer {
        return this.gpuBuffer;
    }

    ///////////////////////////////////////////////////////////////////////////
    public static async create(renderer: Renderer,
        code: string,
        count: number): Promise<TransformBuffer> {

        const defs = webgpuUtils.makeShaderDataDefinitions(code);
        if (!defs.storages["transforms"]) {
            throw new Error("transform: Transforms not found in the shader!");
        }

        const variableDef = defs.storages["transforms"];
        const { size } = webgpuUtils.getSizeAndAlignmentOfUnsizedArrayElement(variableDef);
        const totalSizeInBytes = size * count;

        const view = webgpuUtils.makeStructuredView(variableDef,
            new ArrayBuffer(totalSizeInBytes));

        const buffer = await renderer.createBuffer({
            size: totalSizeInBytes,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        return new TransformBuffer(renderer, buffer, view, count, size);
    }

    ///////////////////////////////////////////////////////////////////////////
    public async upload(values: Array<TransformBufferContents>) {
        if (values.length !== this.count) {
            throw new Error(`There needs to be ${this.count} elements!`);
        }
        this.view.set(values);
        await this.renderer.writeBuffer(this.gpuBuffer, this.view.arrayBuffer);
    }
}

///////////////////////////////////////////////////////////////////////////
///////////////////////////// RENDERER PARAMS /////////////////////////////
///////////////////////////////////////////////////////////////////////////
export interface RendererConstructorParams {
    canvas: HTMLCanvasElement;
    adapter: GPUAdapter;
    device: GPUDevice;
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////// RENDERER TYPES /////////////////////////////
///////////////////////////////////////////////////////////////////////////
export type TypedArray = Uint16Array |
    Uint32Array |
    Float16Array |
    Float32Array |
    ArrayBuffer;

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// RENDERER ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
export class Renderer {

    ///////////////////////////////////////////////////////////////////////////
    ////////////////////////////// WEBGPU CONTEXT /////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    private readonly canvas: HTMLCanvasElement;
    private readonly device: GPUDevice;
    private readonly context: GPUCanvasContext;
    private readonly presentationFormat: GPUTextureFormat;

    ///////////////////////////////////////////////////////////////////////////
    ////////////////////////// PERFORMANCE METRICS ////////////////////////////
    ///////////////////////////////////////////////////////////////////////////
    private readonly deltaTime: DeltaTime;

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

        const device = await adapter.requestDevice({
            requiredFeatures: [
                "core-features-and-limits",
                "timestamp-query",
                "shader-f16",
            ]
        });
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

        this.device.addEventListener("uncapturederror", event => {
            event.preventDefault();
            Log.error(event.error.message);
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

        this.deltaTime = new DeltaTime();
        this.debugUI = new DebugUI(this.canvas, this.device, 1000);
        this.createResizeObserver();
    }

    ///////////////////////////////////////////////////////////////////////////
    private createResizeObserver(): void {
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

                width = Util.clamp(width, 1, this.maxTextureDimension2D());
                height = Util.clamp(height, 1, this.maxTextureDimension2D());

                if (this.canvas.width !== width || this.canvas.height !== height) {
                    Log.info(`Resizing from ${this.canvas.width}x${this.canvas.height} to ${width}x${height}`);

                    this.canvas.width = width;
                    this.canvas.height = height;
                }
            }
        });

        resizeObserver.observe(this.canvas);
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createBuffer(desc: GPUBufferDescriptor): Promise<GPUBuffer> {
        this.device.pushErrorScope("validation");
        const buffer = this.device.createBuffer(desc);
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
        return buffer;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async writeBuffer(buffer: GPUBuffer,
        data: TypedArray,
        offset: number = 0): Promise<void> {

        this.device.pushErrorScope("validation");
        this.device.queue.writeBuffer(buffer, offset, data);
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createAndWriteBuffer(desc: GPUBufferDescriptor,
        data: TypedArray,
        offset: number = 0): Promise<GPUBuffer> {

        const buffer = await this.createBuffer(desc);
        await this.writeBuffer(buffer, data, offset);
        return buffer;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createShaderModule(desc: GPUShaderModuleDescriptor): Promise<GPUShaderModule> {
        this.device.pushErrorScope("validation");
        const module = this.device.createShaderModule(desc);
        const err = await this.device.popErrorScope();
        if (err) {
            const info = await module.getCompilationInfo();
            const lines = desc.code.split("\n");

            const messages = [...info.messages].sort((a, b) => b.lineNum - a.lineNum);
            for (const msg of messages) {
                lines.splice(msg.lineNum, 0, `${''.padEnd(msg.linePos - 1)}${''.padEnd(msg.length, '^')}`,
                    msg.message);
            }

            for (const line of lines) {
                Log.error(line);
            }

            throw new Error(`Failed to compile shader '${desc.label}'!`);
        }

        return module;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createRenderPipeline(desc: GPURenderPipelineDescriptor): Promise<GPURenderPipeline> {
        this.device.pushErrorScope("validation");
        const pipeline = this.device.createRenderPipeline(desc);
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
        return pipeline;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createPipelineLayout(desc: GPUPipelineLayoutDescriptor): Promise<GPUPipelineLayout> {
        this.device.pushErrorScope("validation");
        const layout = this.device.createPipelineLayout(desc);
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
        return layout;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createRenderBundleEncoder(desc: GPURenderBundleEncoderDescriptor): Promise<GPURenderBundleEncoder> {
        this.device.pushErrorScope("validation");
        const encoder = this.device.createRenderBundleEncoder(desc);
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
        return encoder;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createDepthStencilTexture(width: number,
        height: number): Promise<GPUTexture> {

        this.device.pushErrorScope("validation");
        const texture = this.device.createTexture({
            label: "Depth-Stencil texture",
            format: "depth24plus-stencil8",
            size: [width, height, 1],
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            mipLevelCount: 1,
            sampleCount: 1,
            dimension: "2d",
        });
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
        return texture;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createTextureFromBitmap(url: string,
        format: GPUTextureFormat): Promise<GPUTexture> {

        const data = await Util.loadImageBitmap(url);

        if (data.width > this.maxTextureDimension2D() || data.height > this.maxTextureDimension2D()) {
            throw new Error(`${url} is too large for the GPU!`);
        }

        const mipLevelCount = Math.floor(Math.log2(Math.max(data.width, data.height))) + 1;

        this.device.pushErrorScope("validation");
        const texture = this.device.createTexture({
            label: url,
            format: format,
            mipLevelCount: mipLevelCount,
            size: [data.width, data.height, 1],
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        const createTextureError = await this.device.popErrorScope();
        if (createTextureError) {
            throw new Error(createTextureError.message);
        }

        this.device.pushErrorScope("validation");
        this.device.queue.copyExternalImageToTexture({
            source: data,
            flipY: false,
        }, {
            texture: texture,
            mipLevel: 0,
        }, {
            width: data.width,
            height: data.height,
        });

        const copyImageErr = await this.device.popErrorScope();
        if (copyImageErr) {
            throw new Error(copyImageErr.message);
        }

        Log.info(`Loaded ${url} into mip level 0`);

        const imageUrls: Array<string> = [];
        const suffixInd = url.lastIndexOf(".");
        const baseUrl = url.slice(0, suffixInd);
        const suffix = url.slice(suffixInd);

        for (let i = 1; i < mipLevelCount; ++i) {
            const newWidth = Math.max(data.width >> i, 1);
            const newHeight = Math.max(data.height >> i, 1);
            imageUrls.push(`${baseUrl}_${newWidth}x${newHeight}${suffix}`);
        }

        const mipImagePromises = imageUrls.map(imageUrl => Util.loadImageBitmap(imageUrl));
        const loadedMipmaps = await Promise.allSettled(mipImagePromises);

        for (let i = 0; i < loadedMipmaps.length; i++) {
            const result = loadedMipmaps[i];

            if (!result || result.status === "rejected") {
                throw new Error(`Failed to load '${imageUrls[i]}': ${result?.reason}`);
            }

            const mipData = result.value;
            const mipLevel = i + 1;

            this.device.pushErrorScope("validation");
            this.device.queue.copyExternalImageToTexture({
                source: mipData,
                flipY: false,
            }, {
                texture: texture,
                mipLevel: mipLevel,
            }, {
                width: mipData.width,
                height: mipData.height,
            });

            const mipErr = await this.device.popErrorScope();
            if (mipErr) {
                throw new Error(`Failed to copy to mip level ${mipLevel} from ${imageUrls[i]}: ${mipErr.message}`);
            }

            Log.info(`Loaded ${imageUrls[i]} into mip level ${mipLevel}`);
        }

        return texture;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createSampler(desc: GPUSamplerDescriptor): Promise<GPUSampler> {
        this.device.pushErrorScope("validation");
        const sampler = this.device.createSampler(desc);
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
        return sampler;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createBindGroup(desc: GPUBindGroupDescriptor): Promise<GPUBindGroup> {
        this.device.pushErrorScope("validation");
        const bindGroup = this.device.createBindGroup(desc);
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
        return bindGroup;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createBindGroupLayout(desc: GPUBindGroupLayoutDescriptor): Promise<GPUBindGroupLayout> {
        this.device.pushErrorScope("validation");
        const bindGroupLayout = this.device.createBindGroupLayout(desc);
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
        return bindGroupLayout;
    }

    ///////////////////////////////////////////////////////////////////////////
    public async createQuerySet(desc: GPUQuerySetDescriptor): Promise<GPUQuerySet> {
        this.device.pushErrorScope("validation");
        const query = this.device.createQuerySet(desc);
        const err = await this.device.popErrorScope();
        if (err) {
            throw new Error(err.message);
        }
        return query;
    }

    ///////////////////////////////////////////////////////////////////////////
    public createCmdEncoder(desc: GPUCommandEncoderDescriptor): GPUCommandEncoder {
        this.device.pushErrorScope("validation");
        const encoder = this.device.createCommandEncoder(desc);
        this.device.popErrorScope().then(info => {
            if (info) {
                Log.error(info.message);
            }
        });
        return encoder;
    }

    ///////////////////////////////////////////////////////////////////////////
    public submitCmdBuffers(buffers: Array<GPUCommandBuffer>): void {
        this.device.pushErrorScope("validation");
        this.device.queue.submit(buffers);
        this.device.popErrorScope().then(info => {
            if (info) {
                Log.error(info.message);
            }
        });
    }

    ///////////////////////////////////////////////////////////////////////////
    public createViewForCurrentTexture(): GPUTextureView {
        return this.context.getCurrentTexture().createView();
    }

    ///////////////////////////////////////////////////////////////////////////
    public render(callback: (dt: number) => void, enableDebugUI: boolean = true): void {
        if (enableDebugUI) {
            this.debugUI.beginRender();
        }

        const dt = this.deltaTime.dt();
        callback(dt);

        if (enableDebugUI) {
            this.debugUI.endRender();
            this.debugUI.writeDT(dt);
            this.debugUI.update();
        }

        requestAnimationFrame(() => this.render(callback, enableDebugUI));
    }

    ///////////////////////////////////////////////////////////////////////////
    public getPresentationFormat(): GPUTextureFormat {
        return this.presentationFormat;
    }

    ///////////////////////////////////////////////////////////////////////////
    public maxTextureDimension2D(): number {
        return this.device.limits.maxTextureDimension2D;
    }

    ///////////////////////////////////////////////////////////////////////////
    public writeRenderpassMS(ms: number) {
        this.debugUI.writeRenderpassMS(ms);
    }

    ///////////////////////////////////////////////////////////////////////////
    public getAspectRatio(): number {
        return this.canvas.width / this.canvas.height;
    }

    ///////////////////////////////////////////////////////////////////////////
    public getRenderWidth(): number {
        return this.canvas.width;
    }

    ///////////////////////////////////////////////////////////////////////////
    public getRenderHeight(): number {
        return this.canvas.height;
    }
}
