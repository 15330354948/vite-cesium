import * as Cesium from 'cesium'
import WMSLayer from '@/visual/map/WMSLayer'
import Load3DTiles from '@/visual/map/Load3DTiles'
import TerrianProvider from '@/visual/map/TerrianProvider'
class CesiumTools {
    constructor() {
        this.layerCollection = [];
    }
    /**
     * 实时获取primitive集合和entity集合
     */
    getPrimitiveCollection() {
        return viewer.scene.primitives._primitives;
    }
    getEntityCollection() {
        return viewer.entities.values;
    }

    /**
     * 将笛卡尔坐标转换为经纬度坐标
     *
     * @param {Cesium.Cartesian3} cartesian - 笛卡尔坐标系 [x, y, z]
     * @return {Array<number>} - 经纬度坐标 [经度, 纬度, 高度]
     */
    convertCartesianToCoordinates(cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);
        const height = cartographic.height;

        return [longitude, latitude, height];
    }
    /**
     * 将经纬度坐标转换为笛卡尔坐标系
     *
     * @param {Array<number>} coordinates - 经纬度坐标 [经度, 纬度, 高度]
     * @return {Cesium.Cartesian3} - 笛卡尔坐标系 [x, y, z]
     */
    convertCoordinatesToCartesian(coordinates) {
        const longitude = coordinates[0];
        const latitude = coordinates[1];
        const height = coordinates.length > 2 ? coordinates[2] : 0;

        return Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    }
    /**
     * 获取屏幕中心点经纬度
     * @return {Array<number>} -  经纬度坐标 [经度, 纬度]
     */
    getCenterPosition() {
        let centerResult = viewer.camera.pickEllipsoid(
            new Cesium.Cartesian2(
                viewer.canvas.clientWidth / 2,
                viewer.canvas.clientHeight / 2,
            ),
        )
        let curPosition = Cesium.Ellipsoid.WGS84.cartesianToCartographic(centerResult);
        let curLongitude = (curPosition.longitude * 180) / Math.PI;
        let curLatitude = (curPosition.latitude * 180) / Math.PI;
        return {
            lon: curLongitude,
            lat: curLatitude,
        }
    }
    /**
     * 获取当前相机位置
     * @return {Array<number>} -  经纬度坐标 [经度, 纬度, 高度]
     */
    getCameraPosition() {
        var position = viewer.scene.camera.positionCartographic;
        // 弧度转经纬度
        var longitude = Cesium.Math.toDegrees(position.longitude);
        var latitude = Cesium.Math.toDegrees(position.latitude);
        var height = position.height;
        return { lng: longitude, lat: latitude, height: height }
    }
    /**
     * 获取当前相机到屏幕中心的距离
     * @return {Float<number>} - [距离]
     */
    getDistanceFromCameraToCenter() {
        let a = this.getCenterPosition();
        // 获取屏幕中心点位置坐标
        let b = this.getCameraPosition();
        let clickPosition1 = Cesium.Cartesian3.fromDegrees(a.lon, a.lat, 0);
        let clickPosition2 = Cesium.Cartesian3.fromDegrees(b.lng, b.lat, b.h);
        // 计算两个点之间的距离
        let distancetemp = Cesium.Cartesian3.distance(clickPosition1, clickPosition2);
        console.log('屏幕到地图中心距离:', distancetemp)
        return distancetemp;
    }

    //相机在原地上升或下降
    moveForward(distance) {
        var camera = viewer.camera;
        var direction = camera.direction;
        //获得此位置默认的向上方向
        var up = Cesium.Cartesian3.normalize(camera.position, new Cesium.Cartesian3());
        var right = Cesium.Cartesian3.cross(direction, up, new Cesium.Cartesian3());
        direction = Cesium.Cartesian3.cross(up, right, new Cesium.Cartesian3());
        direction = Cesium.Cartesian3.normalize(direction, direction);
        direction = Cesium.Cartesian3.multiplyByScalar(direction, distance, direction);
        camera.position = Cesium.Cartesian3.add(camera.position, direction, camera.position);
    }
    setCamera(options) {
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(
                options.lon,
                options.lat,
                Number(options.height) + 100
            ),
        });
    }

    faceToNorth() {
        const resInfo = this.saveViewPoint();
        console.log(resInfo);
        viewer.camera.flyTo({
            duration: 1,
            destination: Cesium.Cartesian3.fromDegrees(
                resInfo.lng, resInfo.lat, resInfo.height
            ),
            orientation: {
                heading: Cesium.Math.toRadians(0),// 方向
                pitch: resInfo.mat.pitch,// 仰角角度
                roll: resInfo.mat.roll // 倾斜角度
            },
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        });
    }
    faceToEarth() {
        const resInfo = this.saveViewPoint();
        viewer.camera.flyTo({
            duration: 1,
            destination: Cesium.Cartesian3.fromDegrees(
                resInfo.lng, resInfo.lat, resInfo.height
            ),
            orientation: {
                pitch: Cesium.Math.toRadians(-90),// 仰角角度
            },
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        });
    }

    saveViewPoint() {
        var head = viewer.scene.camera.heading
        var pitch = viewer.scene.camera.pitch
        var roll = viewer.scene.camera.roll
        var info = { 'head': head, 'pitch': pitch, 'roll': roll }
        var position = viewer.scene.camera.positionCartographic;
        var longitude = Cesium.Math.toDegrees(position.longitude).toFixed(6)
        var latitude = Cesium.Math.toDegrees(position.latitude).toFixed(6)
        var height = position.height
        const resInfo = { lng: Number(longitude), lat: Number(latitude), height: Number(height), mat: info }
        return resInfo;
    }
    showViewPoint(resInfo) {
        viewer.camera.flyTo({
            duration: 1,
            destination: Cesium.Cartesian3.fromDegrees(
                resInfo.lng, resInfo.lat, resInfo.height
            ),
            orientation: {
                pitch: resInfo.mat.pitch,
                heading: resInfo.mat.head,
                roll: resInfo.mat.roll
            },
            easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
        });
    }
    //场景出图
    screenShot() {
        const screenshot = new Promise((resolve, reject) => {
            viewer.render();
            const image = viewer.scene.canvas.toDataURL("image/png");
            resolve(image);
        }).then((base64data) => {
            const image = new Image();
            image.src = base64data;
            function coverImageToCanvas(img) {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                canvas.getContext("2d").drawImage(img, 0, 0);
                return canvas;
            }
            image.onload = function () {
                const canvas = coverImageToCanvas(image);
                const url = canvas.toDataURL("image/png");
                const a = document.createElement("a");
                a.download = "screenShot.png";
                a.href = url;
                a.click();
            };
        });
    }

    getPrimitiveById(id) {
        let primitiveCollection = viewer.scene.primitives._primitives;
        return primitiveCollection.filter(item => {
            return item.id == id;
        })[0];
    }
    getEntitiesById(id) {
        let entitiesCollection = viewer.entities.values;
        return entitiesCollection.filter(item => {
            return item.id == id;
        })[0];
    }

    showModel(options, titleClick) {
        let id = options.boundLabel + options.id;
        console.log(id)
        let oldmodel = this.getPrimitiveById(id);
        if (oldmodel && oldmodel.show == false) {
            oldmodel.show = true;
        } else {
            let params = {
                id: id,
                url: options.gisContent?.serverUrl[0]?.url,
                show: options.pointInfo.isShow,
                scale: options.pointInfo.modelSize[0],

                tx: options.pointInfo.lon, //模型中心X轴坐标(经度，单位：十进制度)
                ty: options.pointInfo.lat,//模型中心Y轴坐标(纬度，单位：十进制度)
                tz: options.pointInfo.height, //模型中心Z轴坐标(高程，单位：米)
                rx: options.pointInfo.rx, //X轴(经度)方向旋转角度(单位：度)
                ry: options.pointInfo.ry, //Y轴(纬度)方向旋转角度(单位：度)
                rz: options.pointInfo.rz  //Z轴(高程)方向旋转角度(单位：度)
            };
            this.loadModel(params);
        }
        let labeloptions = {
            bgColor: 'rgba(20, 36, 70, 0.85)',
            borderColor: '#76BDFF',
            fontColor: '#fff',
        };
    };
    async loadModel(params) {
        const model = viewer.scene.primitives.add(await Cesium.Model.fromGltfAsync({
            id: params.id,
            url: params.url,
            show: params.show,
            scale: params.scale,
            color: params.color,
            //maximumScale: 1   
        }));
        this.updateModelMaxtrix(model, params);
    }

    updateModelMaxtrix(model, params) {
        //旋转
        let mx = Cesium.Matrix3.fromRotationX(Cesium.Math.toRadians(params.rx));
        let my = Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(params.ry));
        let mz = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(params.rz));
        let rotationX = Cesium.Matrix4.fromRotationTranslation(mx);
        let rotationY = Cesium.Matrix4.fromRotationTranslation(my);
        let rotationZ = Cesium.Matrix4.fromRotationTranslation(mz);
        //平移
        let position = Cesium.Cartesian3.fromDegrees(params.tx, params.ty, params.tz);
        let m = Cesium.Transforms.eastNorthUpToFixedFrame(position);
        //旋转、平移矩阵相乘
        Cesium.Matrix4.multiply(m, rotationX, m);
        Cesium.Matrix4.multiply(m, rotationY, m);
        Cesium.Matrix4.multiply(m, rotationZ, m);
        //缩放
        Cesium.Matrix4.multiplyByUniformScale(m, model.scale, m);
        //赋值给model
        if (Cesium.defined(model.primitive)) {
            model.primitive.modelMatrix = m;
        }
        model.modelMatrix = m;
        //model.color = Cesium.Color.WHITE.withAlpha(1);
        viewer.zoomTo(model)
    };
    hideModel(id) {
        let model = this.getPrimitiveById(id);
        model ? model.show = false : null;
    }

    showWms(data) {
        const chooseLayer = this.layerCollection.filter((item) => {
            return item.id == data.label + data.gisId;
        });
        if (chooseLayer.length > 0) {
            let layer = chooseLayer[0].layer;
            layer.show = true;
        } else {
            const currentLayer = new WMSLayer(viewer, data.gisContent, 'wms');
            this.layerCollection.push({
                id: data.label + data.gisId,
                layer: currentLayer.currLayer
            })
        }
    }
    hideWms(data) {
        const chooseLayer = this.layerCollection.filter((item) => {
            return item.id == data.label + data.gisId;
        });
        if (chooseLayer.length > 0) {
            let layer = chooseLayer[0].layer;
            layer.show = false;
        }
    }
    showTerrain(data) {
        new TerrianProvider(viewer, data.gisContent.serverUrl[0].url, 'terrain');
    }
    hideTerrain() {
        viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
    }
    show3DTerrain(data) {
        new Load3DTiles(viewer, data.gisContent, '3d_terrain');
    }
    hide3DTerrain(data) {
        var arr = viewer.scene.primitives._primitives.filter(item => {
            return item.id == data.label + data.gisId
        })
        arr.forEach(item => {
            viewer.scene.primitives.remove(item)
        })
    }
    //3dtiles操作
    translate(tileset, position) {
        const matrix = new Cesium.Matrix4();
        Cesium.Matrix4.fromTranslation(position, matrix);
        Cesium.Matrix4.multiply(tileset.modelMatrix, matrix, tileset.modelMatrix);
    }
    rotate(tileset, rotationZ) {
        const rotation = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(rotationZ));
        Cesium.Matrix4.multiplyByMatrix3(tileset.root.transform, rotation, tileset.root.transform);
    }
    adjustHeight(tileset, height) {
        const { center } = tileset.boundingSphere;
        let temp = this.convertCartesianToCoordinates(center);
        const coord = { lon: temp[0], lat: temp[1] };
        const surface = Cesium.Cartesian3.fromDegrees(coord.lon, coord.lat, 0);
        const offset = Cesium.Cartesian3.fromDegrees(coord.lon, coord.lat, height);
        const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());

        tileset.modelMatrix = Cesium.Matrix4.multiply(tileset.modelMatrix, Cesium.Matrix4.fromTranslation(translation), tileset.modelMatrix);
    }
    //导出json文件
    exportJSON(text, filename) {
        const blob = new Blob([text], { type: "application/json;charset=utf-8" });
        const href = URL.createObjectURL(blob);
        const alink = document.createElement("a");
        alink.style.display = "none";
        alink.download = filename;
        alink.href = href;
        document.body.appendChild(alink);
        alink.click();
        document.body.removeChild(alink);
        URL.revokeObjectURL(href);
        return true;
    }
    readJSON(file) {
        const reader = new FileReader();
        reader.readAsText(file.raw, "UTF-8");
        return reader;
    }
}




let cesiumTools = new CesiumTools;
export default cesiumTools;