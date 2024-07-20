export default `

#define S(x, y, z) smoothstep(x, y, z)
#define B(a, b, edge, t) S(a-edge, a+edge, t)*S(b+edge, b-edge, t)
#define sat(x) clamp(x,0.,1.)


#define HIGH_QUALITY
#define RAIN
//#define DROP_DEBUG

vec3 ro, rd;

float N(float t) {
	return fract(sin(t*10234.324)*123423.23512);
}
vec3 N31(float p) {
    //  3 out, 1 in... DAVE HOSKINS
   vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
   p3 += dot(p3, p3.yzx + 19.19);
   return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
}
float N2(vec2 p)
{	// Dave Hoskins - https://www.shadertoy.com/view/4djSRW
	vec3 p3  = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}


float DistLine(vec3 ro, vec3 rd, vec3 p) {
	return length(cross(p-ro, rd));
}

vec3 ClosestPoint(vec3 ro, vec3 rd, vec3 p) {
    // returns the closest point on ray r to point p
    return ro + max(0., dot(p-ro, rd))*rd;
}

float Remap(float a, float b, float c, float d, float t) {
	return ((t-a)/(b-a))*(d-c)+c;
}

float BokehMask(vec3 ro, vec3 rd, vec3 p, float size, float blur) {
	float d = DistLine(ro, rd, p);
    float m = S(size, size*(1.-blur), d);

    #ifdef HIGH_QUALITY
    m *= mix(.7, 1., S(.8*size, size, d));
    #endif

    return m;
}



float SawTooth(float t) {
    return cos(t+cos(t))+sin(2.*t)*.2+sin(4.*t)*.02;
}

float DeltaSawTooth(float t) {
    return 0.4*cos(2.*t)+0.08*cos(4.*t) - (1.-sin(t))*sin(t+cos(t));
}

vec2 GetDrops(vec2 uv, float seed, float m) {

    float t = czm_frameNumber /60.+m*30.;
    vec2 o = vec2(0.);

    #ifndef DROP_DEBUG
    uv.y += t*.05;
    #endif

    uv *= vec2(10., 2.5)*2.;
    vec2 id = floor(uv);
    vec3 n = N31(id.x + (id.y+seed)*546.3524);
    vec2 bd = fract(uv);

    vec2 uv2 = bd;

    bd -= .5;

    bd.y*=4.;

    bd.x += (n.x-.5)*.6;

    t += n.z * 6.28;
    float slide = SawTooth(t);

    float ts = 1.5;
    vec2 trailPos = vec2(bd.x*ts, (fract(bd.y*ts*2.-t*2.)-.5)*.5);

    bd.y += slide*2.;								// make drops slide down

    #ifdef HIGH_QUALITY
    float dropShape = bd.x*bd.x;
    dropShape *= DeltaSawTooth(t);
    bd.y += dropShape;								// change shape of drop when it is falling
    #endif

    float d = length(bd);							// distance to main drop

    float trailMask = S(-.2, .2, bd.y);				// mask out drops that are below the main
    trailMask *= bd.y;								// fade dropsize
    float td = length(trailPos*max(.5, trailMask));	// distance to trail drops

    float mainDrop = S(.2, .1, d);
    float dropTrail = S(.1, .02, td);

    dropTrail *= trailMask;
    o = mix(bd*mainDrop, trailPos, dropTrail);		// mix main drop and drop trail

    #ifdef DROP_DEBUG
    if(uv2.x<.02 || uv2.y<.01) o = vec2(1.);
    #endif

    return o;
}

void CameraSetup(vec2 uv, vec3 pos, vec3 lookat, float zoom) {
	ro = pos;
    vec3 f = normalize(lookat-ro);
    vec3 r = cross(vec3(0., 1., 0.), f);
    vec3 u = cross(f, r);
    float t = 0.;

    vec2 offs = vec2(0.);
    #ifdef RAIN
    vec2 dropUv = uv;

    #ifdef HIGH_QUALITY
    float x = (sin(t*.1)*.5+.5)*.5;
    x = -x*x;
    float s = sin(x);
    float c = cos(x);

    mat2 rot = mat2(c, -s, s, c);

    #ifndef DROP_DEBUG
    dropUv = uv*rot;
    dropUv.x += -sin(t*.1)*.5;
    #endif
    #endif

    offs = GetDrops(dropUv, 1., 0.);

    #ifndef DROP_DEBUG
    offs += GetDrops(dropUv*1.4, 10., 0.);
    #ifdef HIGH_QUALITY
    offs += GetDrops(dropUv*2.4, 25., 0.);
    //offs += GetDrops(dropUv*3.4, 11.);
    //offs += GetDrops(dropUv*3., 2.);
    #endif

    float ripple = sin(t+uv.y*3.1415*30.+uv.x*124.)*.5+.5;
    ripple *= .005;
    offs += vec2(ripple*ripple, ripple);
    #endif
    #endif
    vec3 center = ro + f*zoom;
    vec3 i = center + (uv.x-offs.x)*r + (uv.y-offs.y)*u;

    rd = normalize(i-ro);
}

uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;

void main( void )
{
	  float t = czm_frameNumber /60.;
    vec3 col = vec3(0.);
    //vec3 col =  texture(colorTexture, v_textureCoordinates).rgb; //高亮度降雨
    vec2 uv = gl_FragCoord.xy / czm_viewport.zw; // 0 <> 1

    uv -= .0;
    uv.x *= czm_viewport.z/czm_viewport.w;


    vec3 pos = vec3(.3, .15, 0.);

    float bt = t * 5.;
    float h1 = N(floor(bt));
    float h2 = N(floor(bt+1.));
    float bumps = mix(h1, h2, fract(bt))*.1;
    bumps = bumps*bumps*bumps;

    pos.y += bumps;
    float lookatY = pos.y+bumps;
    vec3 lookat = vec3(0.3, lookatY, 1.);
    vec3 lookat2 = vec3(0., lookatY, .7);
    lookat = mix(lookat, lookat2, sin(t*.1)*.5+.5);

    uv.y += bumps*4.;
    CameraSetup(uv, pos, lookat, 2.);

    t *= .03;

    // fix for GLES devices by MacroMachines
    #ifdef GL_ES
	const float stp = 1./8.;
	#else
	float stp = 1./8.;
	#endif

    #ifndef GL_ES
    #ifdef HIGH_QUALITY
    stp = 1./32.;
    #else
    stp = 1./16.;
    #endif
    #endif
    col += sat(rd.y);
  out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(col, 1),0.6);

  //out_FragColor = vec4(col, 1);//高亮度降雨
}
                `;