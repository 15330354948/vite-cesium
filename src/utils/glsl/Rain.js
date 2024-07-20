export default `//【内置变量】颜色纹理，用于在片元着色器中访问各个像素的颜色
              uniform sampler2D colorTexture;
              //【内置变量】纹理坐标，是从顶点着色器中传递下来的。
              in vec2 v_textureCoordinates;
              float hash(float x){
                //取小数部分
                return fract(sin(x*23.3)*13.13);
              }
              
                uniform float rainColorR;
                uniform float rainColorG;
                uniform float rainColorB;
                uniform float rot;
                uniform float rainSize;
                uniform float rainSpeed;
              void main(){
                  //将当前帧数转换为以秒为单位的时间
                  //在Cesium中,czm_frameNumber是一个递增整数值
                  //且一秒钟内,平均会渲染大约60帧,因此除以60可以得到近似的秒数
                  float time = czm_frameNumber / rainSpeed;
                  
                  //窗口分辨率
                  vec2 resolution = czm_viewport.zw;
                  //转换为uv坐标(-1,1)
                  //gl_FragCoord.xy 表示当前片段的屏幕坐标(或窗口坐标)的X和Y分量。
                  //resolution.xy 表示屏幕或窗口的宽度和高度
                  //gl_FragCoord.xy * 2.0 - resolution.xy 将屏幕坐标扩大两倍，然后减去屏幕的宽度和高度。这样处理可以将坐标原点移至屏幕中心。
                  vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
                  
                  //雨颜色值(153,178,204),并做归一化处理(除以255)
                  vec3 c=vec3(rainColorR,rainColorG,rainColorB);
                  //定义雨滴的倾角0.4弧度,转为角度约为23度
                  float a=rot;
                  float si=sin(a),co=cos(a);
                  //将纹理坐标uv角度a旋转
                  uv*=mat2(co,-si,si,co);
                  //将纹理坐标进行缩放变换（变形）
                  uv*=length(uv+vec2(0,4.9))*rainSize+1.0;
                  
                  //加入时间time,基础雨滴颜色,及变换后的uv坐标和一系列随机值运算
                  //得到每一个像素的雨滴颜色
                  float v=1.0-sin(hash(floor(uv.x*100.0))*2.0);
                  //float b=clamp(abs(sin(20.0*time*v+uv.y*(5.0/(2.0+v))))-0.95,0.0,1.0)*20.;
                  float b=clamp(abs(sin(20.0*time*v+uv.y*(1.0/v)))-0.95,0.0,1.0)*10.;
                  c*=v*b;
                  //将雨与场景颜色混合
                  //texture2D(colorTexture, v_textureCoordinates)是获取场景原始颜色值
                  out_FragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1),0.4);
              }
                `;