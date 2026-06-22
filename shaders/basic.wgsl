enable f16;

struct VertexInput {
    @builtin(vertex_index) vertexIndex: u32,
    @builtin(instance_index) instanceIndex: u32,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) color: vec4<f16>,
    @location(1) texcoord: vec2<f16>,
}

struct Transform {
    translation: vec4f,
    scale: vec4f,
}

struct VertexData {
    position: vec4<f16>,
    color: vec4<f16>,
    texcoord: vec2<f16>,
}

@group(0) @binding(0) var<storage, read> vertexData: array<VertexData>;
@group(0) @binding(1) var<storage, read> transform: array<Transform>;

@vertex
fn vs(in: VertexInput) -> VertexOutput {

    let vertexPosition = vertexData[in.vertexIndex].position;
    let vertexColor = vertexData[in.vertexIndex].color;
    let texcoord = vertexData[in.vertexIndex].texcoord;

    let translation = transform[in.instanceIndex].translation;
    let scale = transform[in.instanceIndex].scale;

    var out: VertexOutput;
    out.position = scale * (vec4f(vertexPosition) + translation);
    out.color = vertexColor;
    out.texcoord = texcoord;

    return out;
}

struct FragmentOutput {
    @location(0) canvas_output: vec4f,
}

@group(0) @binding(2) var dogSampler: sampler;
@group(0) @binding(3) var dogTexture: texture_2d<f32>;

@fragment
fn fs(in: VertexOutput) -> FragmentOutput {
    var output: FragmentOutput;
    output.canvas_output = vec4f(in.color) * textureSample(dogTexture, dogSampler, vec2f(in.texcoord));
    return output;
}
