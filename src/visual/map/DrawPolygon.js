import * as Cesium from 'cesium'
/**
   * 绘制多边形
   * @param {Object}  option
   * @param {Boolean} option.ground 是否贴地
   */
/**
  * 拾取位置点
  * @param {Object} px 屏幕坐标
  * @return {Object} Cartesian3 三维坐标
  */
function getCatesian3FromPX(px) {
    if (window.viewer && px) {
        var picks = window.viewer.scene.drillPick(px);
        var cartesian = null;
        var isOn3dtiles = false,
            isOnTerrain = false;
        // drillPick
        for (let i in picks) {
            let pick = picks[i];

            if (
                (pick && pick.primitive instanceof Cesium.Cesium3DTileFeature) ||
                (pick && pick.primitive instanceof Cesium.Cesium3DTileset) ||
                (pick && pick.primitive instanceof Cesium.Model)
            ) {
                //模型上拾取
                isOn3dtiles = true;
            }
            // 3dtilset
            if (isOn3dtiles) {
                window.viewer.scene.pick(px); // pick
                cartesian = window.viewer.scene.pickPosition(px);
                if (cartesian) {
                    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                    if (cartographic.height < 0) cartographic.height = 0;
                    let lon = Cesium.Math.toDegrees(cartographic.longitude),
                        lat = Cesium.Math.toDegrees(cartographic.latitude),
                        height = cartographic.height;
                    cartesian = transformWGS84ToCartesian({
                        lng: lon,
                        lat: lat,
                        alt: height
                    });
                }
            }
        }
        // 地形
        let boolTerrain =
        window.viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider;
        // Terrain
        if (!isOn3dtiles && !boolTerrain) {
            var ray = window.viewer.scene.camera.getPickRay(px);
            if (!ray) return null;
            cartesian = window.viewer.scene.globe.pick(ray, window.viewer.scene);
            isOnTerrain = true;
        }
        // 地球
        if (!isOn3dtiles && !isOnTerrain && boolTerrain) {
            cartesian = window.viewer.scene.camera.pickEllipsoid(
                px,
                window.viewer.scene.globe.ellipsoid
            );
        }
        if (cartesian) {
            let position = transformCartesianToWGS84(cartesian);
            if (position.alt < 0) {
                cartesian = transformWGS84ToCartesian(position, 0.1);
            }
            return cartesian;
        }
        return false;
    }
}
/***
   * 坐标转换 84转笛卡尔
   * @param {Object} {lng,lat,alt} 地理坐标
   * @return {Object} Cartesian3 三维位置坐标
   */
function transformWGS84ToCartesian(position, alt) {
    if (window.viewer) {
        return position
            ? Cesium.Cartesian3.fromDegrees(
                position.lng || position.lon,
                position.lat,
                (position.alt = alt || position.alt),
                Cesium.Ellipsoid.WGS84
            )
            : Cesium.Cartesian3.ZERO;
    }
}
/***
 * 坐标转换 笛卡尔转84
 * @param {Object} Cartesian3 三维位置坐标
 * @return {Object} {lng,lat,alt} 地理坐标
 */
function transformCartesianToWGS84(cartesian) {
    if (window.viewer && cartesian) {
        var ellipsoid = Cesium.Ellipsoid.WGS84;
        var cartographic = ellipsoid.cartesianToCartographic(cartesian);
        return {
            lng: Cesium.Math.toDegrees(cartographic.longitude),
            lat: Cesium.Math.toDegrees(cartographic.latitude),
            alt: cartographic.height
        };
    }
}
export const DrawPolygon = (option) => {
    var allPoints = []
    // 设置返回值
    return new Promise((resolve, reject) => {
        // 1. 获取Cesium Viewer
        let viewer = window.viewer;
        // 2. 创建一个用于存储多边形顶点的数组
        let polygonPoints = [];
        // 3. 创建一个用于显示当前绘制中的多边形的实体
        let drawingPolygon = viewer.entities.add({
            id: "drawingPolygon",
            name: "画多边形",
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    return new Cesium.PolygonHierarchy(polygonPoints);
                }, false),
                material: Cesium.Color.BLUE.withAlpha(0.2),
                perPositionHeight: (option && option.ground) || false // true:不贴地/false:贴地
            },
        });

        // 4. 创建一个用于显示当前绘制中的线的实体
        let drawingLine = viewer.entities.add({
            id: "drawingLine",
            name: "画线",
            polyline: {
                positions: new Cesium.CallbackProperty(() => {
                    return polygonPoints;
                }, false),
                width: 3,
                material: Cesium.Color.GREEN
            }
        });

        // 5. 监听鼠标点击事件，将点击的点添加到顶点数组中，并添加点实体
        let handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
        handler.setInputAction(event => {
            var cartesian = getCatesian3FromPX(event.position);
            if (cartesian) {
                // 将点坐标添加到数组中
                polygonPoints.push(cartesian.clone());
                // 在第一次点击时，添加一个克隆的点到数组中，用于动态更新
                if (polygonPoints.length === 1) {
                    polygonPoints.push(cartesian.clone());
                }
                // 添加点实体
                viewer.entities.add({
                    position: cartesian,
                    point: {
                        color: Cesium.Color.RED,
                        pixelSize: 10
                    }
                });

                //将三维笛卡尔坐标系点转为经纬度坐标点，并保存到点数组中
                let cartesian3 = cartesian.clone()
                // 使用Cesium.Cartographic.fromCartesian将Cartesian3对象转换为Cartographic对象
                let cartographic = Cesium.Cartographic.fromCartesian(cartesian3);
                allPoints.push([Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), cartographic.height]);

            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        // 6. 监听鼠标移动事件，动态更新多边形和线的形状
        handler.setInputAction(event => {
            var cartesian = getCatesian3FromPX(event.endPosition);
            if (polygonPoints.length >= 2) {
                if (cartesian && cartesian.x) {
                    polygonPoints.pop();
                    polygonPoints.push(cartesian);
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // 7. 监听鼠标右键点击事件，结束绘制
        handler.setInputAction(() => {
            var cartesian = polygonPoints[polygonPoints.length - 1]
            // 添加点实体
            viewer.entities.add({
                position: cartesian,
                point: {
                    color: Cesium.Color.RED,
                    pixelSize: 10
                }
            });
            polygonPoints.push(polygonPoints[0]);
            handler.destroy(); // 关闭鼠标事件监听，结束绘制
            resolve(allPoints);
        }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    })
}
