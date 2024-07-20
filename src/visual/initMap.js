import * as Cesium from 'cesium'

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxZWVmNzJmZS0yYWQ3LTRkZWEtOTI3OC01ZjQ4N2JiNmQwZTMiLCJpZCI6MTU5NTg5LCJpYXQiOjE3MTg1MjUyMjR9.yzUlfTLVne64z2AejFiIHF-lH0kn_PawbigLM1WwnA4'

export function initMap(component) {
    var viewer = new Cesium.Viewer(component, {
        animation: false, // 动画
        timeline: false, // 时间轴
        geocoder: false, // 查找工具
        homeButton: false, // 主页按钮
        sceneModePicker: false, // 场景模式切换按钮
        navigationHelpButton: false, // 导航帮助按钮
        baseLayerPicker: false, // 底图切换按钮
        fullscreenButton: false, // 全屏按钮
        infoBox: false, // 信息框
        selectionIndicator: false, // 选择指示器
        // sceneMode: Cesium.SceneMode.SCENE3D, // 初始场景模式
        scene3DOnly: true, // 仅3D视图，优化 3D 模式的内存使用和性能，但禁用使用 2D 或 Columbus View 的能力
        preserveDrawingBuffer: true, // 保留缓冲区，避免渲染时出现闪烁
        navigationInstructionsInitiallyVisible: false, // 导航提示框默认隐藏
        mapMode2D: Cesium.MapMode2D.ROTATE, // 2D 视图模式
        // 加载 Cesium 地形
        // terrainProvider: Cesium.createWorldTerrainAsync(),
        // terrain: Cesium.Terrain.fromWorldTerrain({
        //     requestVertexNormals: true,
        // }),
        showAnimate: false, // 显示动画
        contextOptions: {
            requestWebgl1: true, // 请求 WebGL 1.0
            webgl: {
                alpha: true, // 透明度
                depth: false, // 深度
                stencil: true, // 隔离
                antialias: true, // 抗锯齿
                premultipliedAlpha: true, // 预乘 alpha
                preserveDrawingBuffer: true, // 保留缓冲区
                failIfMajorPerformanceCaveat: true // 性能警告
            },
            allowTextureFilterAnisotropic: false // 禁用各向异性过滤
        },
        baseLayer: new Cesium.ImageryLayer(
            new Cesium.WebMapTileServiceImageryProvider({
                url: "http://{s}.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=1d109683f4d84198e37a38c442d68311",
                layer: "tdtBasicLayer",
                style: "default",
                format: "image/jpeg",
                tileMatrixSetID: "GoogleMapsCompatible",
                credit: "",
                subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
                maximumLevel: 18,
            })
        ),
    })

    viewer.cesiumWidget.creditContainer.style.display = "none" // 隐藏底部版权信息
    viewer.scene.postProcessStages.fxaa.enabled = true // 开启 FXAA 后处理
    viewer.scene.screenSpaceCameraController.tiltEventTypes = [Cesium.CameraEventType.RIGHT_DRAG] // 右拖拽控制俯仰
    viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.WHEEL] // 鼠标滚轮控制缩放
    viewer.scene.screenSpaceCameraController.enableRotate = true // 允许旋转
    viewer.scene.screenSpaceCameraController.enableTilt = true // 允许俯仰
    viewer.scene.screenSpaceCameraController.enableZoom = true // 允许缩放
    // let pointView = { x: -1455040.7947191685, y: 4842208.858985916, z: 3920955.5851175827 }
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(116.46, 39.92, 20000000),
    })

    //清除月亮太阳
    viewer.scene.moon.show = false
    viewer.scene.sun.show = true
    //关闭大气
    viewer.scene.skyAtmosphere.show = false
    //屏蔽双击事件防止锁定视角
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
    // 点击时不显示info窗口 绿框
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false //true 禁止 false 允许

    //开启地面大气层和天空大气层
    const scene = viewer.scene
    const globe = scene.globe
    const skyAtmosphere = scene.skyAtmosphere
    const v = parseFloat(21) * 1e-6

    //地面大气层
    globe.atmosphereLightIntensity = parseFloat(20)
    globe.atmosphereRayleighCoefficient.x = parseFloat(5.5) * 1e-6
    globe.atmosphereRayleighCoefficient.y = parseFloat(13) * 1e-6
    globe.atmosphereRayleighCoefficient.z = parseFloat(28.4) * 1e-6
    globe.atmosphereMieCoefficient = new Cesium.Cartesian3(v, v, v)
    globe.atmosphereRayleighScaleHeight = parseFloat(10000)
    globe.atmosphereMieScaleHeight = parseFloat(3200)
    globe.atmosphereMieAnisotropy = parseFloat(0.9)
    globe.atmosphereHueShift = parseFloat(0)
    globe.atmosphereSaturationShift = parseFloat(0)
    globe.atmosphereBrightnessShift = parseFloat(0)
    globe.lightingFadeOutDistance = parseFloat(10000000)
    globe.lightingFadeInDistance = parseFloat(20000000)
    globe.nightFadeOutDistance = parseFloat(10000000)
    globe.nightFadeInDistance = parseFloat(50000000)
    //天空大气层
    skyAtmosphere.atmosphereLightIntensity = parseFloat(50)
    skyAtmosphere.atmosphereRayleighCoefficient.x = parseFloat(5.5) * 1e-6
    skyAtmosphere.atmosphereRayleighCoefficient.y = parseFloat(13) * 1e-6
    skyAtmosphere.atmosphereRayleighCoefficient.z = parseFloat(28.4) * 1e-6
    skyAtmosphere.atmosphereMieCoefficient = new Cesium.Cartesian3(v, v, v)
    skyAtmosphere.atmosphereRayleighScaleHeight = parseFloat(10000)
    skyAtmosphere.atmosphereMieScaleHeight = parseFloat(3200)
    skyAtmosphere.atmosphereMieAnisotropy = parseFloat(0.9)
    skyAtmosphere.hueShift = parseFloat(0)
    skyAtmosphere.saturationShift = parseFloat(0)
    skyAtmosphere.brightnessShift = parseFloat(0)
    //关闭HDR，不然晴天效果不明显
    scene.highDynamicRange = false; //关闭HDR
    //大气层开关
    globe.showGroundAtmosphere = true //地面大气层
    skyAtmosphere.show = true //天空大气层

    globe.enableLighting = true //开启光照
    scene.fog.enabled = true //开启雾效
    globe.dynamicAtmosphereLighting = true //开启动态大气光照
    globe.dynamicAtmosphereLightingFromSun = true //光照来自太阳


    // 删除文字标签
    function removeLabel() {
        let labelEntities = viewer.entities.values.filter(entity => entity.id.indexOf('labelWord') !== -1)
        for (let i = 0; i < labelEntities.length; i++) {
            viewer.entities.remove(labelEntities[i])
        }
    }

    window.viewer = viewer;
    return viewer
}
