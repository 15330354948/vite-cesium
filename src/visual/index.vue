
<script setup>
import * as Cesium from 'cesium'
import { onMounted } from 'vue'
import { initMap } from './initMap';
import weatherSystem from "@/utils/weatherSystem";
import ViewshedAnalysis from "./lib/ViewshedAnalysis";
import cesiumTools from "@/utils/cesiumTools";
import { ref, reactive, toRefs } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import pic from "@/assets/login-background.jpg";
import { measureLine } from "./map/measureLine.js"
import { measurePolygon } from "./map/measurePolygon.js"
import MeasureHeight from '@/visual/map/MeasureHeight '
import MeasureDistance from "@/utils/MeasureDistance";
import { DrawPolygon } from "./map/DrawPolygon.js";
import Tool from "@/utils/plot/drawTool.js";
import Flat from "@/utils/tileset/tilesetFlat.js";
import layerSelect from "@/components/layerSelect.vue";
import myPopup from "@/components/myPopup.vue";
import util from "../utils/util.js";

let viewer = ref(null);
let drawer = ref(false);
let visible = ref(false)
let visible2 = ref(false)
let tileset = ref(null);
let drawTool = ref(null);
let flatTool = ref(null);
let isArea = ref(false);
let isGEO = ref(false);
let billboard = ref(null);
let dataSource = ref(null);
let visiblePopup = ref(false);
dataSource = new Cesium.CustomDataSource('dian')
const ruleForm = reactive({
    long: '',
    lat: '',
});
const rules = {
    long: [
        { required: true, message: '请输入经度', trigger: 'blur' },
    ],
    lat: [
        { required: true, message: '请输入纬度', trigger: 'blur' },
    ],
};
const direction = 'rtl';

// 图片列表
const modelList = [
    {
        url: '/images/boss.png',
        uri: '/model/boss/boss.glb',
        name: 'boss',
    }, {
        url: '/images/car.png',
        uri: '/model/car/car.gltf',
        name: 'car',
    }, {
        url: '/images/xn.png',
        uri: '/model/xn/scene.gltf',
        name: 'sb',
    }]

const limitLong = (value) => {
    if (value > 180) {
        ruleForm.long = 180;
    } else if (value < 0) {
        ruleForm.long = 0;
    } else {
        ruleForm.long = value;
    }
};

const limitLat = (value) => {
    if (value > 90) {
        ruleForm.lat = 90;
    } else if (value < 0) {
        ruleForm.lat = 0;
    } else {
        ruleForm.lat = value;
    }
};


onMounted(() => {
    // 初始化地图
    viewer = initMap('cesiumContainer')
    window.viewer = viewer;
})




// 关闭气象
const offSim = () => {
    weatherSystem.offSnow();
    weatherSystem.offSnow2();
    weatherSystem.offLightning();
    weatherSystem.offLightning2();
    weatherSystem.offSunshine();
    weatherSystem.offRainsmall();
    weatherSystem.offRainMid();
    weatherSystem.offRainLarge();
    weatherSystem.offDepFog();
    weatherSystem.offFloatFog();
    weatherSystem.offSand();
    weatherSystem.offStorm();
}
// 开启晴天
const sunshine = () => {
    weatherSystem.onSunshine();
}
// 下小雨
const dropRainSmall = () => {
    weatherSystem.onRainsmall();
}
// 下中雨
const dropRainMid = () => {
    weatherSystem.onRainMid();
}
// 下大雨
const dropRainBig = () => {
    weatherSystem.onRainLarge();
}
// 打雷
const lightning = () => {
    weatherSystem.onLightning();
}
// 打雷2
const lightning2 = () => {
    weatherSystem.onLightning2();
}
// 降雪
const dropSnow = () => {
    weatherSystem.onSnow({ rainSpeed: 100 });
}
// 降雪2
const dropSnow2 = () => {
    weatherSystem.onSnow2({ rainSpeed: 200 });
}
// 多云
const genClouds = () => {
    var position = viewer.scene.camera.positionCartographic;
    // 弧度转经纬度
    var longitude = Cesium.Math.toDegrees(position.longitude);
    var latitude = Cesium.Math.toDegrees(position.latitude);
    var height = position.height;
    let point = {
        Long: longitude,
        Lat: latitude,
        Height: height,
    };
    let cloudParams = {
        numClouds: 500,
        startLong: Number(point.Long) - 0.01,
        stopLong: Number(point.Long) + 0.03,
        startLat: Number(point.Lat) - 0.01,
        stopLat: Number(point.Lat) + 0.03,
        minHeight: Number(point.Height) + 80,
        maxHeight: Number(point.Height) + 200,
        color: Cesium.Color.WHITE,
    };
    weatherSystem.onClouds(cloudParams);
}

// 大雾
const openfog = () => {
    weatherSystem.onDepFog();
    weatherSystem.onFloatFog();
}

// 沙尘暴
const sandStorm = () => {
    weatherSystem.onSand();
    weatherSystem.onStorm();
}


// 加载3d tiles
const add3dt = async () => {
    tileset = await Cesium.Cesium3DTileset.fromUrl("/3dtiles/tileset.json", {
        skipLevelOfDetail: true, // 跳过低级细节
        baseScreenSpaceError: 1024, // 初始屏幕空间误差
        // maximumScreenSpaceError: 512, // 最大屏幕空间误差
        cacheBytes: 4096 * 1024 * 1024, // 缓存字节数
        maximumCacheOverflowBytes: 7168 * 1024 * 1024, // 缓存溢出字节数
        cullRequestsWhileMoving: true, // 移动时剔除请求
        cullRequestsWhileMovingMultiplier: 10, // 值越小越能够更快的剔除
        progressiveResolutionHeightFraction: 0.5, // 数值偏于0能够让初始加载变得模糊
        dynamicScreenSpaceErrorDensity: 0.5, // 数值加大，能让周边加载变快
        dynamicScreenSpaceError: true, // 全屏加载完之后才清晰化房屋
    });

    viewer.scene.primitives.add(tileset);
    viewer.scene.globe.depthTestAgainstTerrain = false;

    viewer.zoomTo(tileset);
    // changeHeight(500, tileset)

}
const add3dt2 = () => {
    // 加载测试模型
    tileset = Cesium.Cesium3DTileset.fromUrl("http://mapgl.com/data/model/qx-simiao/tileset.json", {
        maximumScreenSpaceError: 1
    });

    let changeH = 80;
    tileset.then(function (tst) {
        tileset = tst;
        viewer.scene.primitives.add(tileset);
        viewer.zoomTo(tileset);
        var cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center); //获取模型的中心点经纬度
        var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0); //将经纬度转为笛卡尔坐标
        var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, changeH); //计算模型中心点的高程
        var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3()); // 计算模型中心点的高程差值
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation.clone());
    });
}
//方法二，直接调用函数，调整高度,height表示物体离地面的高度
function changeHeight(height, tileset) {
    height = Number(height);
    if (isNaN(height)) {
        return;
    }
    var cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
    var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, cartographic.height);
    var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, height);
    var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
}

// 天际线边缘检测
const createEdge = () => {
    var collection = viewer.scene.postProcessStages;

    var edgeDetection = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();

    var postProccessStage = new Cesium.PostProcessStage({
        name: "czm_skylinetemp",
        fragmentShader:
            "uniform sampler2D colorTexture;" +
            "uniform sampler2D depthTexture;" +
            "in vec2 v_textureCoordinates;" +
            "void main(void)" +
            "{" +
            "float depth = czm_readDepth(depthTexture, v_textureCoordinates);" +
            "vec4 color = texture(colorTexture, v_textureCoordinates);" +
            "if(depth<1.0 - 0.000001){" +
            "out_FragColor = color;" +
            "}" +
            "else{" +
            "out_FragColor = vec4(1.0,0.0,0.0,1.0);" +
            "}" +
            "}",
    });

    var postProccessStage1 = new Cesium.PostProcessStage({
        name: "czm_skylinetemp1",
        fragmentShader:
            "uniform sampler2D colorTexture;" +
            "uniform sampler2D redTexture;" +
            "uniform sampler2D silhouetteTexture;" +
            "in vec2 v_textureCoordinates;" +
            "void main(void)" +
            "{" +
            "vec4 redcolor=texture(redTexture, v_textureCoordinates);" +
            "vec4 silhouetteColor = texture(silhouetteTexture, v_textureCoordinates);" +
            "vec4 color = texture(colorTexture, v_textureCoordinates);" +
            "if(redcolor.r == 1.0){" +
            "out_FragColor = mix(color, vec4(1.0,0.0,0.0,1.0), silhouetteColor.a);" +
            "}" +
            "else{" +
            "out_FragColor = color;" +
            "}" +
            "}",
        uniforms: {
            redTexture: postProccessStage.name,
            silhouetteTexture: edgeDetection.name,
        },
    });

    var postProccessStage = new Cesium.PostProcessStageComposite({
        name: "czm_skyline",
        stages: [edgeDetection, postProccessStage, postProccessStage1],
        inputPreviousStageTexture: false,
        uniforms: edgeDetection.uniforms,
    });

    collection.add(postProccessStage);
}

// 打开太阳
const createSun = () => {
    weatherSystem.showSun(1);
}

// 关闭太阳
const hideSun = () => {
    weatherSystem.hideSun();
}

// 打开月亮
const createMoon = () => {
    weatherSystem.showMoon();
}

// 关闭月亮
const hideMoon = () => {
    weatherSystem.hideMoon();
}

// 打开星空
const createSkybox = () => {
    weatherSystem.showSkyBox();
}

// 关闭星空
const hideSkybox = () => {
    weatherSystem.hideSkyBox();
}

// 打开景深
const openDOF = () => {
    let options = {
        focalDistance: 10,
        delta: 1,
        sigma: 3.78,
        stepSize: 2.46,
    };
    weatherSystem.openDOF(options);
}

// 关闭景深
const hideDOF = () => {
    weatherSystem.closeDOF();
}

// 打开耀斑
const openBloom = () => {
    weatherSystem.openLensFlare();
}

// 关闭耀斑
const hideBloom = () => {
    weatherSystem.closeLensFlare();
}

// 切换大气层
const toggleAtmosphere = () => {
    weatherSystem.toggleAtmosphere();
}

// 切换宇宙盒
const changeSkyBox = () => {
    viewer.scene.skyBox = new Cesium.SkyBox({
        sources: {
            negativeX: "/skybox/box1/tycho2t3_80_mx.jpg",
            negativeY: "/skybox/box1/tycho2t3_80_my.jpg",
            negativeZ: "/skybox/box1/tycho2t3_80_mz.jpg",
            positiveX: "/skybox/box1/tycho2t3_80_px.jpg",
            positiveY: "/skybox/box1/tycho2t3_80_py.jpg",
            positiveZ: "/skybox/box1/tycho2t3_80_pz.jpg",
        },
    });
}

const formRef = ref(null);
// 定位
const flyTo = () => {
    formRef.value.validate((valid) => {
        let obj = { ...ruleForm }
        if (valid) {
            viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(Number(obj.long), Number(obj.lat), 500000),
                orientation: {
                    heading: Cesium.Math.toRadians(0.0),
                    pitch: Cesium.Math.toRadians(-90.0),
                    roll: 0.0
                }
            });
        }
    });

    // // 定位到银川
    // viewer.camera.flyTo({
    //     destination: Cesium.Cartesian3.fromDegrees(106.20, 38.95, 500000),
    //     orientation: {
    //         heading: Cesium.Math.toRadians(0.0),
    //         pitch: Cesium.Math.toRadians(-90.0),
    //         roll: 0.0
    //     }
    // });
}

// 空间可视域分析
const viewShedAnal = () => {
    ElMessageBox.alert('鼠标点击第一次获取坐标，点击第二次结束', 'Title', {
        // autofocus: false,
        confirmButtonText: 'OK',
        callback: () => {
            // ElMessage({
            //     type: 'info',
            //     message: `关闭`,
            // })
            drawer.value = false;
        },
    })
    let i = 0;
    var horizontalViewAngle = 90; //视角水平张角
    var verticalViewAngle = 60; //视角垂直张角
    var endPosition = null;
    var viewShed = null;
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
        i++;
        if (i === 1) {
            var startPosition = viewer.scene.pickPosition(movement.position); //鼠标点击一次获取开始坐标
            if (!startPosition) return;
            viewShed = new ViewshedAnalysis(viewer, {
                viewPosition: startPosition,
                viewPositionEnd: startPosition,
                horizontalViewAngle: horizontalViewAngle,
                verticalViewAngle: verticalViewAngle,
            });
            // 鼠标移动的事件
            handler.setInputAction((movement) => {
                endPosition = viewer.scene.pickPosition(movement.endPosition);
                if (!endPosition) return;
                viewShed.updatePosition(endPosition);
                if (!viewShed.sketch) {
                    viewShed.drawSketch();
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
        // 鼠标点击两次获取结束坐标
        if (i === 2) {
            i = 0;
            endPosition = viewer.scene.pickPosition(movement.position);
            viewShed.updatePosition(endPosition);
            viewShed.update();
            handler && handler.destroy(); //销毁鼠标事件
            //store.setSelected(null)
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 开启卷帘对比
const splitCompare = () => {
    //初始化UI
    let splitLine = document.createElement("div");
    splitLine.id = "slider";
    viewer.cesiumWidget.container.appendChild(splitLine);
    //设置卷帘对比项
    const layers = viewer.imageryLayers;
    const vecLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapTileServiceImageryProvider(
            {
                url: `http://{s}.tianditu.com/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=1d109683f4d84198e37a38c442d68311`,
                layer: "tdtVecBasicLayer",
                style: "default",
                format: "image/jpeg",
                tileMatrixSetID: "GoogleMapsCompatible",
                credit: "",
                subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
                maximumLevel: 17,
            },
            1
        )
    );
    const cvaLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.WebMapTileServiceImageryProvider(
            {
                url: `http://{s}.tianditu.com/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=1d109683f4d84198e37a38c442d68311`,
                layer: "tdtVecBasicLayer",
                style: "default",
                format: "image/jpeg",
                tileMatrixSetID: "GoogleMapsCompatible",
                credit: "",
                subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
                maximumLevel: 17,
            },
            2
        )
    );

    vecLayer.splitDirection = Cesium.SplitDirection.RIGHT;
    cvaLayer.splitDirection = Cesium.SplitDirection.RIGHT;

    const slider = document.getElementById("slider");
    viewer.scene.splitPosition = slider.offsetLeft / slider.parentElement.offsetWidth;

    //添加事件监听
    const handler = new Cesium.ScreenSpaceEventHandler(slider);
    let moveActive = false;
    function move(movement) {
        if (!moveActive) {
            return;
        }

        const relativeOffset = movement.endPosition.x;
        const splitPosition = (slider.offsetLeft + relativeOffset) / slider.parentElement.offsetWidth;
        slider.style.left = `${100.0 * splitPosition}%`;
        viewer.scene.splitPosition = splitPosition;
    }

    handler.setInputAction(function () {
        moveActive = true;
        slider.style.backgroundColor = "green";
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    handler.setInputAction(function () {
        moveActive = true;
    }, Cesium.ScreenSpaceEventType.PINCH_START);

    handler.setInputAction(move, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(move, Cesium.ScreenSpaceEventType.PINCH_MOVE);

    handler.setInputAction(function () {
        moveActive = false;
        slider.style.backgroundColor = "#d3d3d3";
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
    handler.setInputAction(function () {
        moveActive = false;
    }, Cesium.ScreenSpaceEventType.PINCH_END);
}
// 关闭卷帘对比
const splitClose = () => {
    let slider = document.getElementById("slider");
    if (slider) {
        slider.remove();
        let layerArr = viewer.imageryLayers._layers;
        for (let i = layerArr.length; i > 0; i--) {
            viewer.imageryLayers.remove(layerArr[i], true);
        }
    }
}

// 去除背景
const removebg = () => {
    viewer.scene.skyBox.show = false;
    //viewer.scene.backgroundColor = new Cesium.Color(0.0, 0.0, 0.0, 0.0);
    viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
    let bg = document.getElementById("cesiumContainer");
    console.log(bg);
    bg.style.background = "url(" + pic + ")";
}

// 加载模型
const loadModel = (data) => {
    drawer.value = false;
    visible.value = false;
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(async (movement) => {
        var lon;
        var lat;
        var height;
        var cartographic;
        var scene = viewer.scene;
        var ellipsoid = scene.globe.ellipsoid;
        var cartesian = viewer.scene.pickPosition(movement.position); //鼠标点击一次获取开始坐标
        viewer.scene.globe.depthTestAgainstTerrain = true; // 开启地形深度检测
        if (cartesian) {
            cartographic = ellipsoid.cartesianToCartographic(cartesian);//地图坐标
            // 笛卡尔转经纬度
            lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(10);
            lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(10);
            //地理高度
            height = (cartographic.height + 1).toFixed(5);
            const heading = Cesium.Math.toRadians(135);
            const pitch = 0;
            const roll = 0;
            const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
            const modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(cartesian, hpr); //模型矩阵
            let customShader = new Cesium.CustomShader({
                uniforms: {
                    u_r: {
                        value: 1.0,
                        type: Cesium.UniformType.FLOAT,
                    },
                    u_g: {
                        value: 0.0,
                        type: Cesium.UniformType.FLOAT,
                    },
                    u_b: {
                        value: 0.0,
                        type: Cesium.UniformType.FLOAT,
                    },
                },
                fragmentShaderText: `
                        void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                                //vec3 suncolor = vec3(sin(czm_frameNumber/80.0*.1)*1.0,cos(czm_frameNumber/80.0*.1)*1.0,cos(czm_frameNumber/80.0*.1)*1.0);
                                material.diffuse =  material.diffuse * 2.0;
                                material.roughness = 0.05;
                                //material.specular = material.specular*suncolor;
                                material.specular = material.specular*vec3(1.0,0.78,0.05);
                                //material.diffuse = vec3(1.0);
                                //material.alpha = 0.3;
                    }`,
            });
            scene.primitives.add(
                await Cesium.Model.fromGltfAsync({
                    url: data.uri,
                    modelMatrix: modelMatrix,
                    customShader,
                    // minimumPixelSize: 128,
                })
            );
            handler && handler.destroy(); //销毁鼠标事件
        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

// 测试模型
const testModel = async () => {
    viewer.scene.debugShowFramesPerSecond = true;

    const scene = viewer.scene;
    const hpRoll = new Cesium.HeadingPitchRoll();
    let customShader = new Cesium.CustomShader({
        uniforms: {
            u_r: {
                value: 1.0,
                type: Cesium.UniformType.FLOAT,
            },
            u_g: {
                value: 0.0,
                type: Cesium.UniformType.FLOAT,
            },
            u_b: {
                value: 0.0,
                type: Cesium.UniformType.FLOAT,
            },
        },
        fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
              //vec3 suncolor = vec3(sin(czm_frameNumber/80.0*.1)*1.0,cos(czm_frameNumber/80.0*.1)*1.0,cos(czm_frameNumber/80.0*.1)*1.0);
              material.diffuse =  material.diffuse * 2.0;
              material.roughness = 0.05;
              //material.specular = material.specular*suncolor;
              material.specular = material.specular*vec3(1.0,0.78,0.05);
              //material.diffuse = vec3(1.0);
              //material.alpha = 0.3;
  }`,
    });

    const localFrames = [];
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            localFrames.push({
                pos: Cesium.Cartesian3.fromDegrees(107.334 + (j + 1) * 0.00005, 30.335 + (i + 1) * 0.00005, 0.0),
                converter: Cesium.Transforms.eastNorthUpToFixedFrame,
            });
        }
    }
    for (let i = 0; i < localFrames.length; i++) {
        const position = localFrames[i].pos;
        const converter = localFrames[i].converter;
        try {
            scene.primitives.add(
                await Cesium.Model.fromGltfAsync({
                    url: "/tynb/1.gltf",
                    modelMatrix: Cesium.Transforms.headingPitchRollToFixedFrame(position, hpRoll, Cesium.Ellipsoid.WGS84, converter),
                    customShader,
                    //minimumPixelSize: 128,
                })
            );

        } catch (error) {
            console.log(`Error loading model: ${error}`);
        }
    }
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(107.33405, 30.33505, 100.0),
    });

}

// 指北针显示
const faceToNorth = () => {
    cesiumTools.faceToNorth();
}

// 正射视角显示
const faceToEarth = () => {
    cesiumTools.faceToEarth();
}

// 记录视点
const saveViewPoint = () => {
    const viewpoint = cesiumTools.saveViewPoint();
    if (viewpoint) {
        console.log("记录成功:", viewpoint);
        localStorage.setItem("viewpoint", JSON.stringify(viewpoint));
    } else {
        console.log("未知原因，记录失败!");
    }
}

// 视点显示
const showViewPoint = () => {
    let viewpoint = localStorage.getItem("viewpoint");
    if (viewpoint) {
        viewpoint = JSON.parse(viewpoint);
        console.log("当前视点:", viewpoint);
        cesiumTools.showViewPoint(viewpoint);
    } else {
        console.log("当前未记录视点");
    }
}

// 场景出图
const screenShot = () => {
    cesiumTools.screenShot();
}

// 二分屏
const cloneCesium = () => {
    closeCloneCesium();
    console.log("二分屏");
    const originMapcon = document.getElementById("cesiumContainer");
    originMapcon.style.width = "50%";

    let newMapcon = document.createElement("div");
    newMapcon.id = "mapCon2";
    newMapcon.className = "mapCon-flex";
    newMapcon.style.width = "50%";
    newMapcon.style.height = "100vh";
    newMapcon.style.transform = "translateX(" + 100 + "%)";

    originMapcon.insertAdjacentElement("afterend", newMapcon);
    window.viewer2 = initMap("mapCon2");
    viewer2.scene.camera = viewer.scene.camera;
}
// 四分屏
const cloneCesiumX = () => {
    closeCloneCesium();
    console.log("四分屏");
    const originMapcon = document.getElementById("cesiumContainer");
    originMapcon.style.width = "50%";
    originMapcon.style.height = "50vh";

    let newMapcon = document.createElement("div");
    newMapcon.id = "mapCon2";
    newMapcon.className = "mapCon-flex";
    newMapcon.style.width = "50%";
    newMapcon.style.height = "50vh";
    newMapcon.style.transform = "translateX(" + 100 + "%)";
    originMapcon.insertAdjacentElement("afterend", newMapcon);

    let newMapcon3 = document.createElement("div");
    newMapcon3.id = "mapCon3";
    newMapcon3.className = "mapCon-flex";
    newMapcon3.style.width = "50%";
    newMapcon3.style.height = "50vh";
    newMapcon3.style.transform = "translateY(" + 100 + "%)";
    newMapcon.insertAdjacentElement("afterend", newMapcon3);

    let newMapcon4 = document.createElement("div");
    newMapcon4.id = "mapCon4";
    newMapcon4.className = "mapCon-flex";
    newMapcon4.style.width = "50%";
    newMapcon4.style.height = "50vh";
    newMapcon4.style.transform = "translateY(" + 100 + "%)" + "translateX(" + 100 + "%)";
    newMapcon3.insertAdjacentElement("afterend", newMapcon4);

    window.viewer2 = initMap("mapCon2");
    window.viewer3 = initMap("mapCon3");
    window.viewer4 = initMap("mapCon4");
    viewer4.scene.camera = viewer3.scene.camera = viewer2.scene.camera = viewer.scene.camera;
}
// 关闭分屏
const closeCloneCesium = () => {
    const map = document.getElementById("cesiumContainer");
    const map2 = document.getElementById("mapCon2");
    const map3 = document.getElementById("mapCon3");
    const map4 = document.getElementById("mapCon4");
    if (map2) {
        map2.remove();
        window.viewer2 = null;
    }
    if (map3) {
        map3.remove();
        window.viewer3 = null;
    }
    if (map4) {
        map4.remove();
        window.viewer4 = null;
    }
    map.style.width = "100%";
    map.style.height = "100vh";
}

// 获取经纬度
const getLonLat = () => {
    drawer.value = false;
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event) => {
        var lon;
        var lat;
        var height;
        var cartographic;
        var scene = viewer.scene;
        var ellipsoid = scene.globe.ellipsoid;
        var cartesian = viewer.scene.pickPosition(event.position); //鼠标点击一次获取开始坐标
        console.log(cartesian);
        viewer.scene.globe.depthTestAgainstTerrain = true; // 开启地形深度检测
        if (cartesian) {
            cartographic = ellipsoid.cartesianToCartographic(cartesian); // 地图坐标
            // 笛卡尔转经纬度
            lon = Cesium.Math.toDegrees(cartographic.longitude).toFixed(10);
            lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(10);
            //地理高度
            height = (cartographic.height + 1).toFixed(5);
            console.log("经度：" + lon + " 纬度：" + lat + " 高度：" + height);
        }
        // handler && handler.destroy(); //销毁鼠标事件
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

const measureDistance = () => {
    console.log(window.viewer);
    measureLine(viewer)
}
const areaMeasure = () => {
    measurePolygon(window.viewer)
}
const heightMeasure = () => {
    const currentHeight = new MeasureHeight(window.viewer)
    console.log(currentHeight);
    currentHeight.initEvents()
    currentHeight.activate()
}
const drawPoint = () => {
    let options = {
        ground: false     //true:不贴地/false:贴地      
    }
    DrawPolygon(options).then((allPoints) => {
        var resultPoints = allPoints;
        console.log(resultPoints);
    })
}

const modelFlatten = () => {
    console.log(tileset);
    if (!tileset) return;
    if (!drawTool.value) {
        drawTool = new Tool(viewer, {
            canEdit: false,
        });
    }

    if (!flatTool.value) {
        flatTool = new Flat(tileset, {
            flatHeight: -30
        });
    }
    console.log(drawTool);
    drawTool.start({
        type: "polygon",
        style: {
            heightReference: 1,
            fill: false,
            outline: true,
            outlineColor: "#ff0000"
        },
        success: function (entObj, ent) {
            let positions = entObj.getPositions();

            flatTool.addRegion({
                positions: positions,
                id: new Date().getTime()
            });
            drawTool.removeAll();

        }
    })
}
const clearMeasure = () => {
    // 清除所有测量
    viewer.entities.removeAll()
}

// 切换底图
const changeBaseMap = () => {
    // 切换底图
    const baseMap = viewer.scene.imageryLayers.get(0);
    // if (baseMap.url === "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer") {
    //     baseMap.url = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer";
}

const loadVector = async () => {
    const geoJson = await Cesium.GeoJsonDataSource.load('/geojson/china.geojson')
    viewer.dataSources.add(geoJson)
}

const loadGeojson = async () => {
    isGEO = !isGEO
    viewer.dataSources.removeAll()
    if (!isGEO) {
        const geoJson = await Cesium.GeoJsonDataSource.load('/geojson/china.json', {
            // clampToGround: true, //贴地显示
            stroke: Cesium.Color.WHITE, //线颜色
            fill: Cesium.Color.RED.withAlpha(0.5), //填充颜色
            strokeWidth: 1 //线宽
        })
        viewer.dataSources.add(geoJson)
        let entities = geoJson.entities.values;
        let colorHash = {};
        for (let i = 0; i < entities.length; i++) {
            let entity = entities[i];
            let name = entity.name;
            let color = colorHash[name];
            if (!color) {
                color = Cesium.Color.fromRandom({
                    alpha: 1,
                });
                colorHash[name] = color;
            }
            entity.polygon.material = color;
            entity.polygon.outline = false;
            if (entity.properties.childrenNum) {
                entity.polygon.extrudedHeight = entity.properties.childrenNum * 5000;
            }
            //高度扩大5000倍，便于观察
        }
    } else {
        viewer.dataSources.removeAll()
    }

}

const loadGeojson2 = async () => {
    isGEO = !isGEO
    viewer.dataSources.removeAll()
    if (!isGEO) {
        const geoJson = await Cesium.GeoJsonDataSource.load('/geojson/sichuan.json', {
            // clampToGround: true, //贴地显示
            stroke: Cesium.Color.WHITE, //线颜色
            fill: Cesium.Color.BLUE.withAlpha(0.3), //填充颜色
            strokeWidth: 5, //线宽
        })
        viewer.dataSources.add(geoJson) //显示
        let entities = geoJson.entities.values;
        let colorHash = {};
        for (let i = 0; i < entities.length; i++) {
            let entity = entities[i];
            let name = entity.name;
            let color = colorHash[name];
            if (!color) {
                color = Cesium.Color.fromRandom({
                    alpha: 1,
                });
                colorHash[name] = color;
            }
            entity.polygon.material = color;
            entity.polygon.outline = false;
            entity.polygon.extrudedHeight = entity.properties.childrenNum * 5000; //高度扩大5000倍，便于观察
        }
    }

}

const loadPoint = () => {
    viewer.dataSources.add(dataSource)
    for (let i = 0; i < 30; i++) {
        var point = {
            name: '点' + i,
            // position: Cesium.Cartesian3.fromDegrees(107.334 + (i + 1) * 0.00005, 30.335 + (i + 1) * 0.00005, 0.0),
            position: Cesium.Cartesian3.fromDegrees(
                Math.random() * (105 - 109) + 109,
                Math.random() * (27 - 31) + 31,
            ),
            billboard: {
                show: true, //是否显示图标
                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0), //图标偏移
                horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //水平方向
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM, //垂直方向
                scale: 1.0, //缩放
                color: Cesium.Color.WHITE, //颜色
                // rotation: Cesium.Math.PI_OVER_FOUR,
                alignedAxis: Cesium.Cartesian3.ZERO, //旋转轴
                width: 30, //图标宽
                height: 30, //图标高
                pixelOffset: new Cesium.Cartesian2(0, 0), //图标偏移
            },
        }
        dataSource.entities.add(point)
        dataSource.entities.values.forEach(entity => {
            entity.billboard.image = "/images/point.png"
        });
        billboard = viewer.entities.add(point)

        dataSource.clustering.enabled = true; // 开启聚合
        dataSource.clustering.pixelRange = 100; // 聚合像素范围
        dataSource.clustering.minimumClusterSize = 2; // 最小聚合数量
        dataSource.clustering.clusterEvent.addEventListener((clusteredEntities, cluster) => {
            console.log(clusteredEntities.length);
            // 关闭自带的显示聚合数量的标签
            cluster.label.show = false; // 关闭标签显示
            cluster.billboard.show = true; // 显示聚合图标
            cluster.billboard.id = cluster.label.id; // 聚合图标和标签绑定
            cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM; // 垂直方向
            // 根据聚合数量的多少设置不同层级的图片以及大小
            if (clusteredEntities.length >= 20) {
                cluster.billboard.image = combineIconAndLabel(
                    "/images/point1.png",
                    clusteredEntities.length,
                    64
                );
                cluster.billboard.width = 60;
                cluster.billboard.height = 60;
            } else if (clusteredEntities.length >= 12) {
                cluster.billboard.image = combineIconAndLabel(
                    "/images/point2.png",
                    clusteredEntities.length,
                    64
                );
                console.log(cluster);
                cluster.billboard.width = 50;
                cluster.billboard.height = 50;
            } else if (clusteredEntities.length >= 8) {
                cluster.billboard.image = combineIconAndLabel(
                    "/images/point3.png",
                    clusteredEntities.length,
                    64
                );
                cluster.billboard.width = 45;
                cluster.billboard.height = 45;
            } else {
                cluster.billboard.image = combineIconAndLabel(
                    "/images/point4.png",
                    clusteredEntities.length,
                    64
                );

                cluster.billboard.width = 40;
                cluster.billboard.height = 40;
            }
        })

        // combineListener()
    }
}

// 聚合方法
const combineIconAndLabel = (url, label, size) => {
    console.log(url);
    let canvas = document.createElement("canvas");
    canvas.width = size * 3.5;
    canvas.height = size * 3.5;
    let ctx = canvas.getContext("2d");

    let promise = new Cesium.Resource.fetchImage(url).then((image) => {
        // 异常判断
        try {
            ctx.drawImage(image, -5, -5);
        } catch (e) {
            console.log(e);
        }
        // 渲染字体
        // font属性设置顺序：font-style, font-variant, font-weight, font-size, line-height, font-family
        ctx.fillStyle = Cesium.Color.WHITE.toCssColorString();
        ctx.font = "bold 100px Microsoft YaHei";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(label, 160, 80); // 字体位置

        return canvas;
    });
    return promise;
}


const showDistrict = () => {
    let wordsArr = [
        {
            name: '北京市', position: { longitude: 116.46, latitude: 39.92, height: 20 }
        },
        {
            name: '银川市', position: { longitude: 106.1937654632311, latitude: 38.48299200423149, height: 20 }
        },
        {
            name: '兰州市', position: { longitude: 103.753701, latitude: 36.06528, height: 20 }
        },
        {
            name: '西宁市', position: { longitude: 101.778219, latitude: 36.62331, height: 20 }
        },
        {
            name: '拉萨市', position: { longitude: 91.1132, latitude: 29.6575, height: 20 }
        },
        {
            name: '重庆市', position: { longitude: 106.55843415538, latitude: 29.568996245339, height: 20 }
        },
        {
            name: '成都市', position: { longitude: 104.08153351042, latitude: 30.655821878416, height: 20 }
        },
        {
            name: '西安市', position: { longitude: 108.93, latitude: 34.27, height: 20 }
        },
        {
            name: '昆明市', position: { longitude: 102.833722, latitude: 24.881539, height: 20 }
        },
        {
            name: '贵阳市', position: { longitude: 106.71667, latitude: 26.56667, height: 20 }
        },
        {
            name: '南宁市', position: { longitude: 108.36667, latitude: 22.84667, height: 20 }
        },
        {
            name: '海口市', position: { longitude: 110.33119, latitude: 20.02977, height: 20 }
        },
        {
            name: '乌鲁木齐市', position: { longitude: 87.61773, latitude: 43.82617, height: 20 }
        },
        {
            name: '天津市', position: { longitude: 117.2, latitude: 39.13, height: 20 }
        },
        {
            name: '哈尔滨市', position: { longitude: 126.63974, latitude: 45.75702, height: 20 }
        },
        {
            name: '石家庄市', position: { longitude: 114.50246, latitude: 38.04547, height: 20 }
        },
        {
            name: '太原市', position: { longitude: 112.55, latitude: 37.87, height: 20 }
        },
        {
            name: '呼和浩特市', position: { longitude: 111.75, latitude: 40.83, height: 20 }
        },
        {
            name: '济南市', position: { longitude: 117, latitude: 36.65, height: 20 }
        },
        {
            name: '南京市', position: { longitude: 118.78, latitude: 32.04, height: 20 }
        },
        {
            name: '合肥市', position: { longitude: 117.27, latitude: 31.86, height: 20 }
        },
        {
            name: '武汉市', position: { longitude: 114.31, latitude: 30.52, height: 20 }
        },
        {
            name: '长沙市', position: { longitude: 113, latitude: 28.21, height: 20 }
        },
        {
            name: '郑州市', position: { longitude: 113.65, latitude: 34.76, height: 20 }
        },
        {
            name: '南昌市', position: { longitude: 115.89, latitude: 28.68, height: 20 }
        },
        {
            name: '长春市', position: { longitude: 125.35, latitude: 43.88, height: 20 }
        },
        {
            name: '沈阳市', position: { longitude: 123.43, latitude: 41.8, height: 20 }
        },
        {
            name: '大连市', position: { longitude: 121.62, latitude: 38.92, height: 20 }
        },
        {
            name: '上海市', position: { longitude: 121.48, latitude: 31.22, height: 20 }
        },
        {
            name: '杭州市', position: { longitude: 120.19, latitude: 30.26, height: 20 }
        },
        {
            name: '福州市', position: { longitude: 119.3, latitude: 26.08, height: 20 }
        },
        {
            name: '广州市', position: { longitude: 113.23, latitude: 23.16, height: 20 }
        },
        {
            name: '香港', position: { longitude: 114.17, latitude: 22.28, height: 20 }
        },
        {
            name: '澳门', position: { longitude: 113.54, latitude: 22.19, height: 20 }
        },
        {
            name: '台北市', position: { longitude: 121.5, latitude: 25.05, height: 20 }
        },
    ]
    isArea = !isArea;
    if (!isArea) {
        // viewer.scene.globe.depthTestAgainstTerrain = true //开启深度测试
        for (let i = 0; i < wordsArr.length; i++) {
            let labelEntity = new Cesium.Entity({
                position: Cesium.Cartesian3.fromDegrees(wordsArr[i].position.longitude, wordsArr[i].position.latitude),
                id: 'labelWord' + i,
                label: {
                    text: wordsArr[i].name, //文本
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE, //有填充和边框
                    scale: 1, //比例尺
                    fillColor: Cesium.Color.WHITE, //填充颜色
                    outlineColor: Cesium.Color.BLACK, //边框颜色
                    outlineWidth: 2, //边框宽度
                    horizontalOrigin: Cesium.HorizontalOrigin.LEFT,//对齐方式
                    verticalOrigin: Cesium.VerticalOrigin.CENTER, //垂直对齐方式
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //高度参考
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 10e6), //显示条件
                    scaleByDistance: new Cesium.NearFarScalar(10e4, 1.0, 10e6, 0.4) //距离缩放
                }
            });
            viewer.entities.add(labelEntity)
        }
    } else {
        // 关闭行政区显示
        let labelEntities = viewer.entities.values.filter(entity => entity.id.indexOf('labelWord') !== -1)
        for (let i = 0; i < labelEntities.length; i++) {
            viewer.entities.remove(labelEntities[i])
        }
        viewer.scene.globe.depthTestAgainstTerrain = false //关闭深度测试
    }

}
// 飞行漫游
const autoFly = () => {
    drawer.value = false;
    visiblePopup.value = true;
}
const dialogClose = async () => {
    visiblePopup.value = false;
}
// 练习demo
// 实体entity
setTimeout(() => {
    //   广告牌
    // const entity = viewer.entities.add({
    //     position: Cesium.Cartesian3.fromDegrees(107.33485938632096, 30.336220243421018, 0),
    //     billboard: {
    //         image: "/xb/xbdh/3d66Model-12229075-files-4.jpg",
    //         scale: 0.05,
    //         verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    //     },

    //     label: {
    //         text: "广告牌", // 文本
    //         font: "16px sans-serif", // 字体
    //         style: Cesium.LabelStyle.FILL_AND_OUTLINE, // 样式
    //         outlineWidth: 2, // 外边框宽度
    //         verticalOrigin: Cesium.VerticalOrigin.BOTTOM, // 垂直对齐方式
    //         pixelOffset: new Cesium.Cartesian2(0, -55), // 偏移量
    //         translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e5, 0.0), // 透明度随距离变化
    //         distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10000000.0), // 显示条件
    //     },
    // });
    // viewer.zoomTo(entity);

    // 盒子
    // const box = viewer.entities.add({
    //     position: Cesium.Cartesian3.fromDegrees(107.33485938632096, 30.336220243421018, 100),
    //     box: {
    //         dimensions: new Cesium.Cartesian3(100, 100, 100),
    //         material: Cesium.Color.BLUE.withAlpha(0.5),
    //         outline: true,
    //         outlineColor: Cesium.Color.WHITE,
    //     }
    // })
    // viewer.zoomTo(box);

}, 1000);

const testBtn = () => {
    const scene = viewer.scene;
    const globe = scene.globe;

    // Tropics of Cancer and Capricorn
    const coffeeBeltRectangle = Cesium.Rectangle.fromDegrees(
        -180.0,
        -23.43687,
        180.0,
        23.43687
    );

    globe.cartographicLimitRectangle = coffeeBeltRectangle;
    globe.showSkirts = false;
    globe.backFaceCulling = false;
    globe.undergroundColor = undefined;
    scene.skyAtmosphere.show = false;

    // Add rectangles to show bounds
    const rectangles = [];

    for (let i = 0; i < 10; i++) {
        rectangles.push(
            viewer.entities.add({
                rectangle: {
                    coordinates: coffeeBeltRectangle,
                    material: Cesium.Color.WHITE.withAlpha(0.0),
                    height: i * 5000.0,
                    outline: true,
                    outlineWidth: 4.0,
                    outlineColor: Cesium.Color.WHITE,
                },
            })
        );
    }

}
</script>

<template>
    <div id="app">
        <div id="cesiumContainer" class="mapCon-flex">
        </div>
        <!-- 操作控件 -->
        <div class="control-container">
            <el-button type="primary" @click="drawer = true">控件</el-button>
        </div>
        <el-drawer v-model="drawer" title="控件库" :direction="direction" size="20%">
            <p>模拟气象环境：</p>
            <div>
                <el-button type="primary" @click="offSim">关闭所有气象</el-button>
            </div>
            <el-button type="primary" @click="sunshine">晴天</el-button>
            <el-button type="primary" @click="dropRainSmall">下小雨</el-button>
            <el-button type="primary" @click="dropRainMid">下中雨</el-button>
            <el-button type="primary" @click="dropRainBig">下大雨</el-button>
            <el-button type="primary" @click="lightning">打雷</el-button>
            <el-button type="primary" @click="lightning2">打雷2</el-button>
            <el-button type="primary" @click="dropSnow">降雪</el-button>
            <el-button type="primary" @click="dropSnow2">降雪2</el-button>
            <!-- <el-button type="primary" @click="genClouds">多云(固定点位)</el-button> -->
            <el-button type="primary" @click="openfog">大雾</el-button>
            <el-button type="primary" @click="sandStorm">沙尘暴</el-button>
            <p>世界环境：</p>
            <el-button type="primary" @click="add3dt">加载3d tiles</el-button>
            <el-button type="primary" @click="add3dt2">加载3d tiles2</el-button>
            <el-button type="primary" @click="createEdge">天际线边缘检测</el-button>
            <el-button type="primary" @click="createSun">打开太阳</el-button>
            <el-button type="primary" @click="hideSun">关闭太阳</el-button>
            <el-button type="primary" @click="createMoon">打开月亮</el-button>
            <el-button type="primary" @click="hideMoon">关闭月亮</el-button>
            <el-button type="primary" @click="createSkybox">打开星空</el-button>
            <el-button type="primary" @click="hideSkybox">关闭星空</el-button>
            <el-button type="primary" @click="openDOF">打开景深</el-button>
            <el-button type="primary" @click="hideDOF">关闭景深</el-button>
            <el-button type="primary" @click="openBloom">打开耀斑</el-button>
            <el-button type="primary" @click="hideBloom">关闭耀斑</el-button>
            <el-button type="primary" @click="toggleAtmosphere">切换大气层</el-button>
            <el-button type="primary" @click="changeSkyBox">切换宇宙盒</el-button>
            <p>工具：</p>
            <el-button type="primary" @click="viewShedAnal">空间可视域分析</el-button>
            <el-button type="primary" @click="removebg">去除背景</el-button>
            <el-popover :visible="visible" placement="bottom" :width="400" trigger="click">
                <template #reference>
                    <el-button type="primary" style="margin-right: 16px" @click="visible = !visible">加载模型</el-button>
                </template>
                <div class="model-container">
                    <div class="imgBox" v-for="(item, index) in modelList" :key="index">
                        <img class="img-item" :src="item.url" :alt="item.name" @click="loadModel(item)">
                    </div>
                </div>
            </el-popover>
            <el-button type="primary" @click="testModel">加载测试模型</el-button>
            <el-button type="primary" @click="modelFlatten">模型压平</el-button>
            <el-button type="primary" @click="measureDistance">长度测量</el-button>
            <el-button type="primary" @click="areaMeasure">面积测量</el-button>
            <el-button type="primary" @click="heightMeasure">高度测量</el-button>
            <el-button type="primary" @click="drawPoint">贴地面积</el-button>
            <el-button type="primary" @click="clearMeasure">清除测量</el-button>
            <!-- 切换底图 -->
            <el-popover :visible2="visible2" placement="bottom" :width="400" trigger="click">
                <template #reference>
                    <el-button type="primary" @click="visible2 = !visible2">切换底图</el-button>
                </template>
                <layerSelect :viewer="viewer"></layerSelect>
            </el-popover>
            <!-- <el-button type="primary" @click="changeBaseMap">切换底图</el-button> -->
            <p>地图工具</p>
            <!-- 定位 -->
            <div style="display: flex; justify-content: space-between;">
                <el-form :model="ruleForm" ref="formRef" :rules="rules">
                    <el-form-item prop="long">
                        <el-input v-model="ruleForm.long" @input="limitLong" placeholder="输入经度"></el-input>
                    </el-form-item>
                    <el-form-item prop="lat">
                        <el-input v-model="ruleForm.lat" @input="limitLat" placeholder="输入纬度"></el-input>
                    </el-form-item>
                </el-form>
            </div>
            <el-button type="primary" @click="flyTo()">定位</el-button>
            <el-button type="primary" @click="getLonLat()">获取经纬度</el-button>
            <el-button type="primary" @click="showDistrict()">显示行政区</el-button>
            <!-- 矢量图 -->
            <el-button type="primary" @click="loadVector">加载矢量图</el-button>
            <!-- 加载geojson -->
            <el-button type="primary" @click="loadGeojson">加载geojson</el-button>
            <el-button type="primary" @click="loadGeojson2">加载geojson2</el-button>
            <!-- 撒点聚合模拟 -->
            <el-button type="primary" @click="loadPoint">加载点聚合</el-button>
            <!-- 飞行漫游 -->
            <el-button type="primary" @click="autoFly">飞行漫游</el-button>
            <el-button type="primary" @click="faceToNorth">指北显示</el-button>
            <el-button type="primary" @click="faceToEarth">正射视角显示</el-button>
            <el-button type="primary" @click="saveViewPoint">记录视点</el-button>
            <el-button type="primary" @click="showViewPoint">视点显示</el-button>
            <el-button type="primary" @click="screenShot">场景出图</el-button>
            <!-- 卷帘对比 -->
            <el-button type="primary" @click="splitCompare">开启卷帘对比</el-button>
            <el-button type="primary" @click="splitClose">关闭卷帘对比</el-button>
            <el-button type="primary" @click="cloneCesium">二分屏</el-button>
            <el-button type="primary" @click="cloneCesiumX">四分屏</el-button>
            <el-button type="primary" @click="closeCloneCesium">关闭分屏</el-button>
            <el-button type="primary" @click="testBtn">测试</el-button>
        </el-drawer>

        <myPopup v-show="visiblePopup" :visiblePopup="visiblePopup" :viewer="viewer" @closed="dialogClose"></myPopup>
    </div>
</template>

<style>
.el-form {
    display: flex;
}

.el-button {
    margin: 5px 0;
}

#cesiumContainer {
    width: 100%;
    height: 100vh;
    position: absolute;
    z-index: 0;
}

.mapCon-flex {
    position: absolute;
}

.control-container {
    position: absolute;
    top: 10px;
    left: 10px;
}

.model-container {
    display: flex;
}

.imgBox {
    margin: 0 5px;
    width: 100px;
    height: 100px;
}

.img-item {
    width: 100%;
    height: 100%;
    cursor: pointer;
}

#slider {
    position: absolute;
    left: 50%;
    top: 0px;
    background-color: #d3d3d3;
    width: 5px;
    height: 100%;
    z-index: 9999;
}

#slider:hover {
    cursor: ew-resize;
}
</style>
