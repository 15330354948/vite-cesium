export default `
float getDistance(sampler2D depthTexture, vec2 texCoords)
      {
          // 获取深度值，解包，
          float depth = czm_unpackDepth(texture(depthTexture, texCoords));
          if (depth == 0.0) {
              return czm_infinity;
          }
          // 为了解决深度值在非线性空间中导致的精度问题，深度值转换回线性空间，也就是从 NDC 空间再转换回相机空间中，转为当前视角的距离
          vec4 eyeCoordinate = czm_windowToEyeCoordinates(gl_FragCoord.xy, depth);
          return -eyeCoordinate.z / eyeCoordinate.w;
      }
      // 线性插值
      float interpolateByDistance(vec4 nearFarScalar, float distance)
      {
          float startDistance = nearFarScalar.x;
          float startValue = nearFarScalar.y;
          float endDistance = nearFarScalar.z;
          float endValue = nearFarScalar.w;
          // 值限制在 0~1之间
          float t = clamp((distance - startDistance) / (endDistance - startDistance), 0.0, 1.0);
          // 值混合
          return mix(startValue, endValue, t);
      }

      // 透明度混合
      vec4 alphaBlend(vec4 sourceColor, vec4 destinationColor)
      {
          return sourceColor * vec4(sourceColor.aaa, 1.0) + destinationColor * (1.0 - sourceColor.a);
      }
      uniform sampler2D colorTexture;
      uniform sampler2D depthTexture;
      uniform vec4 fogByDistance;
      uniform vec4 fogColor;
      in vec2 v_textureCoordinates;
      void main(void)
      {
          // 获取距离
          float distance = getDistance(depthTexture, v_textureCoordinates);
          // 获取场景当前点的像素值
          vec4 sceneColor = texture(colorTexture, v_textureCoordinates);
          // 插值透明度
          float blendAmount = interpolateByDistance(fogByDistance, distance);
          // 改掉当前场景的透明度
          vec4 finalFogColor = vec4(fogColor.rgb, fogColor.a * blendAmount);
          // 和传入的颜色混合
          out_FragColor = alphaBlend(finalFogColor, sceneColor);
      }
`;