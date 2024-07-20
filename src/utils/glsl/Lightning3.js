export default `
float hash11(float p)
{
    p = fract(p * .1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
}

float hash12(vec2 p)
{
	vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

mat2 rotate2d(float theta)
{
    float c = cos(theta);
    float s = sin(theta);
    return mat2(
        c, -s,
        s, c
    );
}

float noise(vec2 p)
{
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    float a = hash12(ip);
    float b = hash12(ip + vec2(1, 0));
    float c = hash12(ip + vec2(0, 1));
    float d = hash12(ip + vec2(1, 1));

    vec2 t = smoothstep(0.0, 1.0, fp);
    return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
}

float fbm(vec2 p, int octaveCount)
{
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < octaveCount; ++i)
    {
        value += amplitude * noise(p);
        p *= rotate2d(0.45);
        p *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
void main(void)
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = (gl_FragCoord.xy / (czm_viewport.zw / 2.0)) - 0.0;
    uv.x =  uv.x - 1.;
    uv.x *= 16. / 9.;

    // UPDATE: move the line in X axis
    uv.x += 2.0 - fract(czm_frameNumber / 100.) * 4.0;

    uv += 2.0 * fbm(uv+1.8*czm_frameNumber/50., 10) - 1.0;

    float dist = abs(uv.x);
    vec3 col = vec3(0.2, 0.3, 0.8) * pow(mix(0.0, 0.07, hash11(czm_frameNumber)) / dist, 1.0);

    col = pow(col, vec3(1.0));
    // Output to screen
    out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(col, 1.0), 0.3);
}
`;