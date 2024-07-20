export default `
float rand(float x)
{
    return fract(sin(x)*75154.32912);
}

float rand3d(vec3 x)
{
    return fract(375.10297 * sin(dot(x, vec3(103.0139,227.0595,31.05914))));
}

float noise(float x)
{
    float i = floor(x);
    float a = rand(i), b = rand(i+1.);
    float f = x - i;
    return mix(a,b,f);
}

float perlin(float x)
{
    float r=0.,s=1.,w=1.;
    for (int i=0; i<6; i++) {
        s *= 2.0;
        w *= 0.5;
        r += w * noise(s*x);
    }
    return r;
}

float noise3d(vec3 x)
{
    vec3 i = floor(x);
    float i000 = rand3d(i+vec3(0.,0.,0.)), i001 = rand3d(i+vec3(0.,0.,1.));
    float i010 = rand3d(i+vec3(0.,1.,0.)), i011 = rand3d(i+vec3(0.,1.,1.));
    float i100 = rand3d(i+vec3(1.,0.,0.)), i101 = rand3d(i+vec3(1.,0.,1.));
    float i110 = rand3d(i+vec3(1.,1.,0.)), i111 = rand3d(i+vec3(1.,1.,1.));
    vec3 f = x - i;
    return mix(mix(mix(i000,i001,f.z), mix(i010,i011,f.z), f.y),
               mix(mix(i100,i101,f.z), mix(i110,i111,f.z), f.y), f.x);
}

float perlin3d(vec3 x)
{
    float r = 0.0;
    float w = 1.0, s = 1.0;
    for (int i=0; i<5; i++) {
        w *= 0.5;
        s *= 2.0;
        r += w * noise3d(s * x);
    }
    return r;
}

float f(float y)
{
    float w = 0.4; // width of strike
    return w * (perlin(2. * y) - 0.5);
}

float plot(vec2 p, float d, bool thicker)
{
    if (thicker) d += 5. * abs(f(p.y + 0.001) - f(p.y));
    return smoothstep(d, 0., abs(f(p.y) - p.x));
}
vec3 render(vec2 uv)
{
    float x = czm_frameNumber/50. + 0.1; 

    float m = 0.25; // 雷电存在最长时间
    float i = floor(x/m);
    float f = x/m - i;
    float k = 0.4; // //雷电出现频率
    float n = noise(i);
    float t = ceil(n-k); // occurrence
    float d = max(0., n-k) / (1.-k); // duration
    float o = ceil(t - f - (1. - d)); // occurrence with duration
    float gt = 0.1; // glare duration
    float go = ceil(t - f - (1. - gt)); // glare occurrence

    float lightning = 0.;

    if (o == 1.) {
        vec2 uv2 = uv;
        uv2.y += i * 2.; // select type of lightning
        float p = (noise(i+10.) - 0.5) * 2.; // position of lightning
        uv2.x -= p;

        float strike = plot(uv2, 0.01, true);
        float glow = plot(uv2, 0.04, false);
        float glow2 = plot(uv2, 1.5, false);

        lightning = strike * 10.4 + glow * 0.15;

        float h = noise(i+5.); // height
        lightning *= smoothstep(h, h+0.05, uv.y + perlin(1.2*uv.x + 4.*h)*0.03);
        lightning += glow2 * 0.3;
    }

    return vec3(lightning );
}
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
void main( void )
{
    vec2 uv = (gl_FragCoord.xy / (czm_viewport.zw / 2.0)) - 0.0;
    uv.x =  uv.x - 1.;
    uv.x *= 16. / 9.;

    out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(render(uv),1.0), 0.3);
}
`;