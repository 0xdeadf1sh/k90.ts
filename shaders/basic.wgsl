struct VertexInput {
    @builtin(vertex_index) vertexIndex: u32,
}

struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) @interpolate(perspective, center) color: vec4f,
}

@vertex
fn vs(in: VertexInput) -> VertexOutput {

    let pos = array(
        vec2(-0.5, -0.5),
        vec2(0.5, -0.5),
        vec2(0.0, 0.5),
    );

    let col = array(
        vec4(1.0, 0.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(0.0, 0.0, 1.0, 1.0),
    );

    var out: VertexOutput;
    out.position = vec4f(pos[in.vertexIndex], 0.0, 1.0);
    out.color = col[in.vertexIndex];

    return out;
}

@fragment
fn fs(in: VertexOutput) -> @location(0) vec4f {
    return pow(in.color, vec4(1.0 / 2.2));
}
