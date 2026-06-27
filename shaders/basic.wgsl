enable f16;

struct VertexInput {
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) texcoord: vec2h,
}

struct Transform {
    pvm: mat4x4f,
}

struct VertexData {
    position: vec4h,
    normal: vec4h,
    texcoord: vec2h,
}

@group(0) @binding(0) var<storage, read> vertexData: array<VertexData>;
@group(0) @binding(1) var<storage, read> transforms: array<Transform>;

override applyScale: bool;

@vertex
fn vs(in: VertexInput) -> VertexOutput {

    let vertexPosition = vertexData[in.vertexIndex].position;
    let texcoord = vertexData[in.vertexIndex].texcoord;

    var out: VertexOutput;
    out.position = transforms[in.instanceIndex].pvm * vec4f(vertexPosition);
    out.texcoord = texcoord;

    return out;
}

struct FragmentOutput {
    @location(0) canvas_output: vec4f,
}

@group(0) @binding(2) var imgSampler: sampler;
@group(0) @binding(3) var imgTexture: texture_2d<f32>;

@fragment
fn fs(in: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;
    output.canvas_output = textureSample(imgTexture, imgSampler, vec2f(in.texcoord));
    output.canvas_output = pow(output.canvas_output, vec4(1.0 / 2.2));
    return output;
}
