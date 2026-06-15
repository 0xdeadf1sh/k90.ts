import packageJson from "../package.json";

///////////////////////////////////////////////////////////////////////////
///////////////////////////////// CONSTANTS ///////////////////////////////
///////////////////////////////////////////////////////////////////////////
const K90_LOGGER_DIV_ID = "k90-logs";
const K90_CANVAS_DIV_ID = "k90-renderer";

///////////////////////////////////////////////////////////////////////////
////////////////////////////////// LOGGING ////////////////////////////////
///////////////////////////////////////////////////////////////////////////
class Logger {
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
    private readonly adapter: GPUAdapter;
    private readonly device: GPUDevice;
    private readonly context: GPUCanvasContext;
    private readonly presentationFormat: GPUTextureFormat;

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

        const deviceDescriptor: GPUDeviceDescriptor = {
            defaultQueue: undefined,
            requiredFeatures: [],
            requiredLimits: {},
        };

        const device = await adapter.requestDevice(deviceDescriptor);
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
        this.adapter = params.adapter;
        this.device = params.device;

        const context = this.canvas.getContext("webgpu") as GPUCanvasContext;
        if (!context) {
            throw new Error("Failed to retrieve GPU context!");
        }

        this.context = context;
        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.presentationFormat,
            colorSpace: "srgb"
        });

        Logger.info(`k90.ts version: ${packageJson.version}`);
        Logger.info(`k90.ts author: ${packageJson.author}`);
        Logger.info(`k90.ts license: ${packageJson.license}`);
        Logger.info(`k90.ts description: ${packageJson.description}`);

        Logger.info(`canvas format: ${this.presentationFormat}`);
    }

    ///////////////////////////////////////////////////////////////////////////
    public render(): void {
    }
}

///////////////////////////////////////////////////////////////////////////
////////////////////////////////// ENTRY //////////////////////////////////
///////////////////////////////////////////////////////////////////////////
async function main() {
    try {
        const renderer = await Renderer.create(K90_CANVAS_DIV_ID);
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
