import * as Cesium from 'cesium'
import Lightning from "./glsl/Lightning"
import Lightning2 from "./glsl/Lightning2"
import Snow from "./glsl/Snow"
import Snow2 from "./glsl/Snow2"
import Rain from "./glsl/Rain"
import RainSmall from "./glsl/RainSmall"
import Fog from "./glsl/Fog"
import FloatFog from "./glsl/FloatFog"

class Weather {
    constructor() {
        this.bloom = null;
        this.lightning = null;
        this.lightning2 = null;
        this.rainsmall = null;
        this.rainMid = null;
        this.rainLarge = null;
        this.snow = null;
        this.snow2 = null;
        this.clouds = null;
        this.depFog = null;
        this.floatFog = null;
        this.sand = null;
        this.storm = null;
    };
    //晴天
    onSunshine(option = { contrast: 128, brightness: -0.1, delta: 1.0, sigma: 7.78, stepSize: 5.0, shadowMapSize: 1024 * 2, shadowMapDarkness: 0.6, shadowMapMaximumDistance: 10000.0 }) {
        if (!this.bloom) {
            this.bloom = viewer.scene.postProcessStages.bloom;
            this.bloom.uniforms.contrast = option.contrast;
            this.bloom.uniforms.brightness = option.brightness; //光强
            this.bloom.uniforms.delta = option.delta;
            this.bloom.uniforms.sigma = option.sigma;
            this.bloom.uniforms.stepSize = option.stepSize;
            viewer.shadows = true; //阴影
            viewer.shadowMap.enabled = true;
            viewer.shadowMap.size = option.shadowMapSize;
            viewer.shadowMap.darkness = option.shadowMapDarkness; //阴影强度
            viewer.shadowMap.softShadows = false;
            viewer.shadowMap.maximumDistance = option.shadowMapMaximumDistance;
            //设置当前时间，阴影角度随时间变化
            viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
        }
        this.bloom.enabled = true;
        viewer.shadows = true;
        viewer.scene.sun.show = true;
        viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date());
        //viewer.scene.sun.glowFactor = 5;
        return this.bloom;
    };
    offSunshine() {
        if (this.bloom) {
            this.bloom.enabled = false;
            viewer.shadows = false;
            viewer.scene.sun.show = false;
        }
    };
    //雨天,小、中、大
    onRainsmall(option = {}) {
        if (!this.rainsmall) {
            this.rainsmall = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "rainSmallEffect",
                    fragmentShader: RainSmall,
                }));
        }
        this.rainsmall.enabled = true;
    };
    offRainsmall() {
        if (this.rainsmall) {
            this.rainsmall.enabled = false;
        }
    };

    onRainMid(option = { rainColorR: 0.6, rainColorG: 0.7, rainColorB: 0.8, rot: 0.4, rainSize: 0.3, rainSpeed: 160.0 }) {
        if (!this.rainMid) {
            this.rainMid = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "rainMidEffect",
                    fragmentShader: Rain,
                    uniforms: {
                        rainColorR: option.rainColorR,
                        rainColorG: option.rainColorG,
                        rainColorB: option.rainColorB,
                        rot: option.rot,//0垂直，0.4左下
                        rainSize: option.rainSize,
                        rainSpeed: option.rainSpeed,
                    },
                }));
        }
        this.rainMid.enabled = true;
    };
    offRainMid() {
        if (this.rainMid) {
            this.rainMid.enabled = false;
        }
    };

    onRainLarge(option = { rainColorR: 0.6, rainColorG: 0.7, rainColorB: 0.8, rot: 0.1, rainSize: 0.1, rainSpeed: 30.0 }) {
        if (!this.rainLarge) {
            this.rainLarge = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "rainLargeEffect",
                    fragmentShader: Rain,
                    uniforms: {
                        rainColorR: option.rainColorR,
                        rainColorG: option.rainColorG,
                        rainColorB: option.rainColorB,
                        rot: option.rot,
                        rainSize: option.rainSize,
                        rainSpeed: option.rainSpeed,
                    },
                }));
        }
        this.rainLarge.enabled = true;
    };
    offRainLarge() {
        if (this.rainLarge) {
            this.rainLarge.enabled = false;
        }
    };
    //打雷，有三种类型
    onLightning(option = { fall_interval: 0.7, mix_factor: 0.3 }) {
        if (!this.lightning) {
            this.lightning = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "czm_lightning",
                    fragmentShader: Lightning,
                    uniforms: {
                        fall_interval: option.fall_interval, //0-1.0之间的数
                        mix_factor: option.mix_factor, //混合系数0-1.0之间的数,最好小于0.8
                    },
                })
            )
        }
        this.lightning.enabled = true;
    };
    offLightning() {
        if (this.lightning) {
            this.lightning ? this.lightning.enabled = false : null;
        }
    };
    onLightning2(option = { fall_interval: 0.7, mix_factor: 0.3 }) {
        if (!this.lightning2) {
            this.lightning2 = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "czm_lightning2",
                    fragmentShader: Lightning2,
                })
            )
        }
        this.lightning2.enabled = true;
    };
    offLightning2() {
        this.lightning2 ? this.lightning2.enabled = false : null;
    };
    // 下雪
    onSnow(option = { rainSpeed: 100 }) {
        if (!this.snow) {
            this.snow = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "snowEffect",
                    fragmentShader: Snow,
                    uniforms: {
                        rainSpeed: option.rainSpeed,
                    },
                })
            )
            this.snow.enabled = true
        } else {
            this.snow ? this.snow.enabled = false : null;
        }
    };
    offSnow() {
        if (this.snow) {
            this.snow ? this.snow.enabled = false : null;
        }
    };
    onSnow2(option = { rainSpeed: 100 }) {
        if (!this.snow2) {
            this.snow2 = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "snowEffect2",
                    fragmentShader: Snow2,
                })
            )
        }
        this.snow2.enabled = true
    };
    offSnow2() {
        this.snow2 ? this.snow2.enabled = false : null;
    };
    //云
    onClouds(params) {
        Cesium.Math.setRandomNumberSeed(2.5);
        let long,
            lat,
            height,
            scaleX,
            scaleY,
            aspectRatio,
            cloudHeight,
            depth,
            slice;
        let cloudParameters = {
            long: params.startLong,
            lat: params.startLat,
            height: params.minHeight,
        };
        let that = this;
        if (!this.clouds) {
            this.clouds = new Cesium.CloudCollection();
            createRandomClouds.bind(this)(
                params.numClouds,
                params.startLong,
                params.stopLong,
                params.startLat,
                params.stopLat,
                params.minHeight,
                params.maxHeight,
                params.color
            );
            viewer.scene.primitives.add(this.clouds);

            Cesium.knockout.track(cloudParameters);
            Cesium.knockout
                .getObservable(cloudParameters, "long")
                .subscribe(function (newValue) {
                    if (that.clouds) {
                        for (let i = 0; i < that.clouds.length; i++) {
                            let cc = that.clouds.get(i);
                            let res = transformCartesianToWGS84(cc.position);
                            if (res.lng > (params.startLong + 0.2) || res.lat > (params.startLat + 0.2)) {
                                cc.position = Cesium.Cartesian3.fromDegrees(params.startLong + getRandomNumberInRange(0, 0.1), params.startLat + getRandomNumberInRange(0, 0.1), res.alt);
                            } else {
                                cc.position = Cesium.Cartesian3.fromDegrees(res.lng + 0.000001, res.lat, res.alt);
                            }
                        }
                    }

                });
            this.cloudsInterval = setInterval(() => {
                cloudParameters.long += 0.00001;
            }, 16);
        }
        function createRandomClouds(
            numClouds,
            startLong,
            stopLong,
            startLat,
            stopLat,
            minHeight,
            maxHeight,
            color
        ) {
            const rangeLong = stopLong - startLong;
            const rangeLat = stopLat - startLat;
            for (let i = 0; i < numClouds; i++) {
                long = startLong + getRandomNumberInRange(0, rangeLong);
                lat = startLat + getRandomNumberInRange(0, rangeLat);
                height = getRandomNumberInRange(minHeight, maxHeight);
                scaleX = getRandomNumberInRange(300, 500);
                scaleY = scaleX / 2.0 - getRandomNumberInRange(0, scaleX / 4.0);
                slice = getRandomNumberInRange(0.3, 0.7);
                depth = getRandomNumberInRange(5, 20);
                aspectRatio = getRandomNumberInRange(1.5, 2.1);
                cloudHeight = getRandomNumberInRange(5, 20);
                this.clouds.add({
                    position: Cesium.Cartesian3.fromDegrees(long, lat, height),
                    scale: new Cesium.Cartesian2(scaleX, scaleY),
                    maximumSize: new Cesium.Cartesian3(
                        aspectRatio * cloudHeight,
                        cloudHeight,
                        depth
                    ),
                    slice: slice,
                    color: color,
                });
            }
        }
    };
    //深度雾和漂浮雾
    onDepFog(option = { fogByDistance: new Cesium.Cartesian4(100, 0.0, 400, 0.55), fogColor: Cesium.Color.WHITESMOKE }) {
        if (!this.depFog) {
            this.depFog = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "depFogEffect",
                    fragmentShader: Fog,
                    uniforms: {
                        fogByDistance: option.fogByDistance, //[0]开始距离 [1]开始值 [2]结束距离 [3]结束值
                        fogColor: option.fogColor, //颜色
                    },
                })
            )
        }
        this.depFog.enabled = true;
    };
    offDepFog() {
        if (this.depFog) {
            this.depFog ? this.depFog.enabled = false : null;
        }
    };
    onFloatFog() {
        if (!this.floatFog) {
            this.floatFog = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "floatFogEffect",
                    fragmentShader: FloatFog,
                })
            );
        }
        this.floatFog.enabled = true;
    };
    offFloatFog() {
        this.floatFog ? this.floatFog.enabled = false : null;
    };

    //飞沙和沙暴
    onSand(option = { rainColorR: 0.721, rainColorG: 0.525, rainColorB: 0.043, rot: 1.5, rainSize: 1.2, rainSpeed: 60.0 }) {
        if (!this.sand) {
            this.sand = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "sandEffect",
                    fragmentShader: Rain,
                    uniforms: {
                        rainColorR: option.rainColorR,
                        rainColorG: option.rainColorG,
                        rainColorB: option.rainColorB,
                        rot: option.rot,//0垂直，0.4左下
                        rainSize: option.rainSize,
                        rainSpeed: option.rainSpeed,
                    },
                }))
        }
        this.sand.enabled = true;
    };
    offSand() {
        this.sand ? this.sand.enabled = false : null;
    };
    onStorm(option = { fogByDistance: new Cesium.Cartesian4(100, 0.0, 400, 0.35), fogColor: Cesium.Color.BURLYWOOD }) {
        if (!this.storm) {
            this.storm = viewer.scene.postProcessStages.add(
                new Cesium.PostProcessStage({
                    name: "stormEffect",
                    fragmentShader: Fog,
                    uniforms: {
                        fogByDistance: option.fogByDistance,
                        fogColor: option.fogColor,
                    },
                })
            )
        }
        this.storm.enabled = true;
    };
    offStorm() {
        this.storm ? this.storm.enabled = false : null;
    };
    // 环境
    // 大气层
    toggleAtmosphere() {
        const groundAtmosphere = viewer.scene.globe.showGroundAtmosphere;
        const skyAtmosphere = viewer.scene.skyAtmosphere;

        viewer.scene.globe.showGroundAtmosphere = !groundAtmosphere;
        viewer.scene.skyAtmosphere.show = !skyAtmosphere;
    };
    showSun(glowFactor = 1) {
        viewer.scene.sun.show = true;
        viewer.scene.sun.glowFactor = glowFactor;
    };
    hideSun() {
        viewer.scene.sun.show = false;
    };
    showMoon() {
        viewer.scene.moon.show = true;
        viewer.scene.moon.onlySunLighting = true;
    };
    hideMoon() {
        viewer.scene.moon.show = false;
    };
    showSkyBox() {
        viewer.scene.skyBox.show = true;
    };
    hideSkyBox() {
        viewer.scene.skyBox.show = false;
    };
    openDOF(option = { focalDistance: 87, delta: 1, sigma: 3.78, stepSize: 2.46 }) {
        var collection = viewer.scene.postProcessStages;
        if (!this.silhouette) {
            this.silhouette = collection.add(Cesium.PostProcessStageLibrary.createDepthOfFieldStage());
        }
        this.silhouette.uniforms.focalDistance = option.focalDistance;
        this.silhouette.uniforms.delta = option.delta;
        this.silhouette.uniforms.sigma = option.sigma;
        this.silhouette.uniforms.stepSize = option.stepSize;
        this.silhouette.enabled = true;
    };
    closeDOF() {
        this.silhouette.enabled = false;
    };
    openLensFlare(option = {
        intensity: 6.0,
        distortion: 14.0,
        dispersion: 0.5,
        haloWidth: 0.4,
        dirtAmount: 0.6,
    }) {
        var collection = viewer.scene.postProcessStages;
        if (!this.lensFlare) {
            this.lensFlare = collection.add(Cesium.PostProcessStageLibrary.createLensFlareStage());
        }
        this.lensFlare.uniforms.intensity = option.intensity;
        this.lensFlare.uniforms.distortion = option.distortion;
        this.lensFlare.uniforms.ghostDispersal = option.dispersion;
        this.lensFlare.uniforms.haloWidth = option.haloWidth;
        this.lensFlare.uniforms.dirtAmount = option.dirtAmount;
        this.lensFlare.uniforms.earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;
        this.lensFlare.enabled = true;
    };
    closeLensFlare() {
        this.lensFlare.enabled = false;
    };
}

function transformCartesianToWGS84(cartesian) {
    if (viewer && cartesian) {
        var ellipsoid = Cesium.Ellipsoid.WGS84;
        var cartographic = ellipsoid.cartesianToCartographic(cartesian);
        return {
            lng: Cesium.Math.toDegrees(cartographic.longitude),
            lat: Cesium.Math.toDegrees(cartographic.latitude),
            alt: cartographic.height
        };
    }
}

function getRandomNumberInRange(minValue, maxValue) {
    return (
        minValue + Cesium.Math.nextRandomNumber() * (maxValue - minValue)
    );
}


let weatherSystem = new Weather;
export default weatherSystem;