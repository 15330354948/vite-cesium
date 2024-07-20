import * as turf from "@turf/turf"
import * as Cesium from 'cesium'
let that = null

console.log(window.viewer);
const handler = new Cesium.ScreenSpaceEventHandler(window.viewer.scene.canvas)
// 坐标拾取,判断点击在模型上还是球面
function handleClick(p) {
    let position = viewer.scene.pickPosition(p)
    // 如果世界坐标点存在
    if (!position) {
        var ray = viewer.camera.getPickRay(p)
        position = viewer.scene.globe.pick(ray, viewer.scene)
    }
    return position
}

// 获取最高的点
function getMaxHeight(list) {
    let avg_height = []
    list.forEach((el) => {
        avg_height.push(carTolng(el).alt)
    })
    return avg_height.reverse()[0]
}

// 空间坐标转经纬度
function carTolng(cartesian) {
    let cartographic = Cesium.Cartographic.fromCartesian(cartesian)
    const alt = cartographic.height > 0 ? cartographic.height : 0 //纬度值
    // const lng = Number(Cesium.Math.toDegrees(cartographic.longitude).toFixed(4)) //经度值
    // const lat = Number(Cesium.Math.toDegrees(cartographic.latitude).toFixed(4)) //纬度值
    const lng = Number(Cesium.Math.toDegrees(cartographic.longitude)) //经度值
    const lat = Number(Cesium.Math.toDegrees(cartographic.latitude)) //纬度值
    return { lng, lat, alt }
}

// 根据经纬度获取高度
function getHeigthByLonLat(lng, lat) {
    let positions = Cesium.Cartographic.fromDegrees(lng, lat) //经纬度转为世界坐标
    //异步函数

    return new Promise((resolve, reject) => {
        Cesium.sampleTerrain(viewer.terrainProvider, 13, [positions]).then(function (updatedPositions) {
            if (updatedPositions) {
                resolve(updatedPositions[0].height)
            }
        })
    })
}

//计算水平距离   positions为存放经纬度坐标的数组 point 经纬度数组 [纬度, 经度]
function calculateHaversineDistance(point1, point2) {
    // 提取起点和终点的纬度和经度
    const lat1 = point1[0]
    const lon1 = point1[1]
    const lat2 = point2[0]
    const lon2 = point2[1]

    // 地球半径（千米）
    const earthRadius = 6371

    // 将角度转换为弧度
    const radLat1 = (Math.PI * lat1) / 180
    const radLat2 = (Math.PI * lat2) / 180
    const deltaLat = (Math.PI * (lat2 - lat1)) / 180
    const deltaLon = (Math.PI * (lon2 - lon1)) / 180

    // Haversine 公式计算
    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    // 返回距离（以千米为单位）
    return Number((earthRadius * c * 1000).toFixed(2))
}

// 贴地距离
function distance() {
    const viewer = window.viewer

    var linearr = [] // 线的坐标存储
    let theta = 0
    var hoverEntity = null
    var entities = []

    // 鼠标点击
    handler.setInputAction(function (e) {
        const cartesian = handleClick(e.position)
        if (cartesian) {
            linearr.push(cartesian)
            // 添加一个线对象
            if (!entities.length) {
                linearr.push(cartesian)
                entities.push(
                    viewer.entities.add({
                        measure: true,
                        position: linearr[0],
                        label: {
                            text: "起点",
                            backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
                            showBackground: false, //显示背景
                            style: Cesium.LabelStyle.FILL,
                            horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
                            verticalOrigin: Cesium.VerticalOrigin.CENTER,
                            font: "25pt",
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
                            outlineWidth: 11,
                            pixelOffset: new Cesium.Cartesian2(30, -20),
                            clampToGround: true,
                        },
                        point: {
                            pixelSize: 6,
                            color: Cesium.Color.YELLOW,
                            // clampToGround: true
                            disableDepthTestDistance: 0,
                        },
                        polyline: {
                            positions: new Cesium.CallbackProperty(function () {
                                return linearr
                            }, false),
                            width: 3,
                            material: new Cesium.PolylineOutlineMaterialProperty({
                                color: Cesium.Color.fromCssColorString("#c5c500"),
                                dashLength: 20,
                            }),
                            clampToGround: true,
                        },
                    })
                )
                // 随鼠标移动的点
                hoverEntity = viewer.entities.add({
                    measure: true,
                    name: "距离",
                    type: 1,
                    mad: 3,
                    position: new Cesium.CallbackProperty(function () {
                        return linearr[linearr.length - 1]
                    }, false),
                    point: {
                        pixelSize: 6,
                        color: Cesium.Color.YELLOW,

                        clampToGround: true,
                    },
                    label: {
                        text: new Cesium.CallbackProperty(function () {
                            if (theta > 0) {
                                let text_str = theta < 10 ? (theta * 1000).toFixed(2) + "m" : Number(theta || 0).toFixed(2) + "km"
                                return text_str
                            } else {
                                return ""
                            }
                        }, false),
                        backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
                        showBackground: false, //显示背景
                        style: Cesium.LabelStyle.FILL,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        font: "25pt",
                        fillColor: Cesium.Color.WHITE,
                        outlineColor: Cesium.Color.BLACK,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
                        outlineWidth: 11,
                        pixelOffset: new Cesium.Cartesian2(30, -20),
                        clampToGround: true,
                    },
                })
            }
            if (linearr.length > 2) {
                entities.push(
                    viewer.entities.add({
                        measure: true,
                        name: "juli",
                        mad: 3,
                        position: linearr[linearr.length - 1],
                        point: {
                            pixelSize: 6,
                            color: Cesium.Color.YELLOW,
                            clampToGround: true,
                        },
                        label: {
                            text: theta < 10 ? (theta * 1000).toFixed(2) + "m" : (theta = theta.toFixed(2) + "km"),
                            backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
                            showBackground: false, //显示背景
                            style: Cesium.LabelStyle.FILL,
                            horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
                            verticalOrigin: Cesium.VerticalOrigin.CENTER,
                            font: "25pt",
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
                            outlineWidth: 11,
                            disableDepthTestDistance: Number.POSITIVE_INFINITY,
                            pixelOffset: new Cesium.Cartesian2(0, -20),
                        },
                    })
                )
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 鼠标移动
    handler.setInputAction(function (e) {
        let cartesian = handleClick(e.endPosition)
        if (cartesian) {
            if (linearr.length > 0) {
                // 考虑在鼠标移动的一瞬间,linearr应该增加一个坐标点,当再次移动时,该坐标点应该更换
                linearr[linearr.length - 1] = cartesian
                // 确定两点
                var cartographic = Cesium.Cartographic.fromCartesian(linearr[linearr.length - 1])
                var lat = Cesium.Math.toDegrees(cartographic.latitude)
                var lng = Cesium.Math.toDegrees(cartographic.longitude)
                var cartographic2 = Cesium.Cartographic.fromCartesian(linearr[linearr.length - 2])
                var lat2 = Cesium.Math.toDegrees(cartographic2.latitude)
                var lng2 = Cesium.Math.toDegrees(cartographic2.longitude)
                // turf.js 计算两点间距离
                var from = turf.point([lng, lat])
                var to = turf.point([lng2, lat2])
                theta = turf.distance(from, to)
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 结束绘制
    handler.setInputAction(function () {
        handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        stop()
        linearr.pop()
        viewer.entities.remove(hoverEntity)
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}

// 方位角
function azimuth() {
    const viewer = window.viewer

    var linearr = [] // 线的坐标存储
    let theta = 0 //方位角角度
    let entities = []

    // 鼠标点击事件监听
    handler.setInputAction(function (event) {
        // 获取世界坐标点
        var cartesian = handleClick(event.position)
        // 如果世界坐标点存在
        if (cartesian) {
            // 添加一个线对象
            if (!entities.length) {
                linearr.push(cartesian)
                linearr.push(cartesian)
                entities.push(
                    viewer.entities.add({
                        measure: true,
                        position: new Cesium.CallbackProperty(function () {
                            return linearr[linearr.length - 1]
                        }, false),
                        // 字体标签样式
                        label: {
                            text: new Cesium.CallbackProperty(function () {
                                return "Az：" + theta.toFixed(2) + "°"
                            }, false),
                            backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
                            showBackground: false, //显示背景
                            style: Cesium.LabelStyle.FILL,
                            horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
                            verticalOrigin: Cesium.VerticalOrigin.CENTER,
                            font: "25pt",
                            fillColor: Cesium.Color.WHITE,
                            outlineColor: Cesium.Color.BLACK,
                            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
                            outlineWidth: 11,
                            clampToGround: true,
                            pixelOffset: new Cesium.Cartesian2(0, -30),
                            eyeOffset: new Cesium.Cartesian3(0, 0, -1),
                            // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        },
                        polyline: {
                            positions: new Cesium.CallbackProperty(function () {
                                return linearr
                            }, false),
                            width: 5,
                            material: new Cesium.PolylineOutlineMaterialProperty({
                                color: Cesium.Color.fromCssColorString("#c5c500"),
                                dashLength: 20,
                            }),
                            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                            clampToGround: true,
                        },
                    })
                )
            } else {
                // 结束绘制
                handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK)
                stop()
                // azimuth();
            }
            linearr[linearr.length - 1] = cartesian
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 鼠标移动事件监听
    handler.setInputAction(function (event) {
        var cartesian = handleClick(event.endPosition)
        if (cartesian) {
            if (entities.length) {
                // 考虑在鼠标移动的一瞬间,linearr应该增加一个坐标点,当再次移动时,该坐标点应该更换
                linearr[linearr.length - 1] = cartesian
                var cartographic = Cesium.Cartographic.fromCartesian(linearr[0])
                var lat = Cesium.Math.toDegrees(cartographic.latitude)
                var lng = Cesium.Math.toDegrees(cartographic.longitude)
                var cartographic2 = Cesium.Cartographic.fromCartesian(linearr[linearr.length - 1])
                var lat2 = Cesium.Math.toDegrees(cartographic2.latitude)
                var lng2 = Cesium.Math.toDegrees(cartographic2.longitude)
                var point1 = turf.point([lng, lat])
                var point2 = turf.point([lng2, lat2])
                theta = turf.bearing(point1, point2)
                if (theta < 0) theta += 360
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

// 贴地面积（待验证）
function area() {
    const viewer = window.viewer

    var linearr = [] // 线的坐标存储
    let points = []
    let entities = []
    let height = 0

    const computeArea = (points) => {
        var res = 0
        //拆分三角曲面

        for (var i = 0; i < points.length - 2; i++) {
            var j = (i + 1) % points.length
            var k = (i + 2) % points.length
            var totalAngle = Angle(points[i], points[j], points[k])
            var dis_temp1 = distance(points[j], points[0])
            var dis_temp2 = distance(points[k], points[0])
            res += (dis_temp1 * dis_temp2 * Math.sin(totalAngle)) / 2
        }
        if (res < 1000000) {
            res = Math.abs(res).toFixed(2) + " 平方米"
        } else {
            res = Math.abs((res / 1000000.0).toFixed(2)) + " 平方公里"
        }
        return res
    }
    const distance = (point1, point2) => {
        var point1cartographic = Cesium.Cartographic.fromCartesian(point1)
        var point2cartographic = Cesium.Cartographic.fromCartesian(point2)
        /**根据经纬度计算出距离**/
        var geodesic = new Cesium.EllipsoidGeodesic()
        geodesic.setEndPoints(point1cartographic, point2cartographic)
        var s = geodesic.surfaceDistance
        //返回两点之间的距离
        s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2))
        return s
    }
    const Angle = (p1, p2, p3) => {
        var bearing21 = Bearing(p2, p1)
        var bearing23 = Bearing(p2, p3)
        var angle = bearing21 - bearing23
        if (angle < 0) {
            angle += 360
        }
        return angle
    }
    const Bearing = (from, to) => {
        from = Cesium.Cartographic.fromCartesian(from)
        to = Cesium.Cartographic.fromCartesian(to)

        var lat1 = from.latitude
        var lon1 = from.longitude
        var lat2 = to.latitude
        var lon2 = to.longitude
        var angle = -Math.atan2(
            Math.sin(lon1 - lon2) * Math.cos(lat2),
            Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)
        )
        if (angle < 0) {
            angle += Math.PI * 2.0
        }
        var degreesPerRadian = 180.0 / Math.PI //弧度转化为角度

        angle = angle * degreesPerRadian //角度
        return angle
    }

    //获取节点的中心点
    const getCenterPosition = (tempPositions) => {
        let points = []
        if (tempPositions.length < 3) return tempPositions[0]
        tempPositions.forEach((position) => {
            const point3d = cartesian3ToPoint3D(position)
            points.push([point3d.x, point3d.y])
        })

        //构建turf.js  lineString
        let geo = turf.lineString(points)
        let bbox = turf.bbox(geo)
        let bboxPolygon = turf.bboxPolygon(bbox)
        let pointOnFeature = turf.center(bboxPolygon)
        let lonLat = pointOnFeature.geometry.coordinates

        return Cesium.Cartesian3.fromDegrees(lonLat[0], lonLat[1], height + 0.3)
    }

    const cartesian3ToPoint3D = (position) => {
        const cartographic = Cesium.Cartographic.fromCartesian(position)
        const lon = Cesium.Math.toDegrees(cartographic.longitude)
        const lat = Cesium.Math.toDegrees(cartographic.latitude)
        return { x: lon, y: lat, z: cartographic.height }
    }

    //获取某个点的高度
    const getPositionHeight = (position) => {
        const cartographic = Cesium.Cartographic.fromCartesian(position)
        return cartographic.height
    }

    //统一节点的高度
    const unifiedHeight = (positions, height) => {
        if (!height) height = getPositionHeight(positions[0]) //如果没有指定高度 就用第一个的高度
        let point3d
        for (let i = 0; i < positions.length; i++) {
            const element = positions[i]
            point3d = cartesian3ToPoint3D(element)
            positions[i] = Cesium.Cartesian3.fromDegrees(point3d.x, point3d.y, height)
        }

        return height
    }
    // 创建面
    const createPolygon = function (positions, color) {
        entities.push(
            viewer.entities.add({
                measure: true,
                polygon: {
                    hierarchy: positions,
                    material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString("#c5c50080")),
                    HeightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    classificationType: Cesium.ClassificationType.BOTH,
                },
            })
        )
    }
    // 左键
    handler.setInputAction(function (event) {
        // 获取世界坐标点
        const cartesian = handleClick(event.position)
        if (cartesian) {
            // 添加一个对象
            if (!entities.length) {
                linearr.push(cartesian.clone())

                createPolygon(new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(linearr), false))
                height = unifiedHeight(linearr)
            }
            linearr.push(cartesian)

            points.push(
                viewer.entities.add({
                    measure: true,
                    name: "贴地面积点",
                    position: linearr[linearr.length - 1],
                    point: {
                        pixelSize: 6,
                        color: Cesium.Color.YELLOW,
                        HeightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    },
                })
            )
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 鼠标移动
    handler.setInputAction(function (event) {
        const cartesian = handleClick(event.endPosition)
        if (entities.length) {
            linearr.pop()
            linearr.push(cartesian)
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 结束绘制
    handler.setInputAction(function () {
        linearr.pop()
        linearr.push(linearr[0])
        // let areaArr = linearr.map((x) => {
        //   let arr = Cesium.Cartographic.fromCartesian(x);
        //   return [Cesium.Math.toDegrees(arr.longitude), Cesium.Math.toDegrees(arr.latitude)];
        // });
        // let polygonTurf = turf.polygon([areaArr]);
        // let center = turf.centroid(polygonTurf);
        // let pointArr = center.geometry.coordinates;
        // let theta = turf.area(polygonTurf);
        // // 中心点位置
        // var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(linearr[0]);
        // var elec_String = viewer.scene.globe.getHeight(cartographic).toFixed(4); //海拔
        // let pointObj = Cesium.Cartesian3.fromDegrees(pointArr[0], pointArr[1], Number(elec_String));

        // if (theta / 1000 / 1000 > 10) theta = (theta / 1000 / 1000).toFixed(2) + "Km²";
        // else theta = theta.toFixed(2) + "m²";

        // 拆分三角形计算面积
        const theta = computeArea(linearr)

        // 计算中心坐标
        const pointObj = getCenterPosition(linearr)
        entities.push(
            viewer.entities.add({
                measure: true,
                name: "平行面积",
                position: pointObj,
                label: {
                    text: theta,
                    backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
                    showBackground: false, //显示背景
                    style: Cesium.LabelStyle.FILL,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                    font: "25pt",
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
                    outlineWidth: 11,
                    // clampToGround: true,
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: 0,
                },
            })
        )
        handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        points.forEach((el) => {
            viewer.entities.remove(el)
        })

        stop()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}

// 坐标测量
function coordinate() {
    const viewer = window.viewer

    var position = null
    let lng = 0,
        lat = 0,
        alt = 0

    viewer.entities.add({
        measure: true,
        position: new Cesium.CallbackProperty(() => position, true),
        label: {
            text: new Cesium.CallbackProperty(function () {
                return `经度：${lng}，纬度：${lat}，高程：${alt}`
            }, true),
            backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
            showBackground: false, //显示背景
            style: Cesium.LabelStyle.FILL,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            font: "25pt",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
            outlineWidth: 11,
            clampToGround: true,
            pixelOffset: new Cesium.Cartesian2(0, -30),
            eyeOffset: new Cesium.Cartesian3(0, 0, -1),
            disableDepthTestDistance: 0,
        },
        point: {
            pixelSize: 6,
            color: Cesium.Color.YELLOW,
            // clampToGround: true,
            // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 0,
        },
    })

    handler.setInputAction((event) => {
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
        stop()
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction((event) => {
        var cartesian = handleClick(event.endPosition)
        if (cartesian) {
            position = cartesian
            let cartographic = Cesium.Cartographic.fromCartesian(cartesian)
            lng = Cesium.Math.toDegrees(cartographic.longitude).toFixed(4) //经度值
            lat = Cesium.Math.toDegrees(cartographic.latitude).toFixed(4) //纬度值
            alt = cartographic.height > 0 ? cartographic.height.toFixed(0) : 0 //纬度值
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

// 高度差
function heightDiff() {
    const viewer = window.viewer

    let diff = 0
    var linearr = []
    var entities = []
    // 随鼠标移动的点

    // 两点之间的线段
    const line = viewer.entities.add({
        measure: true,
        name: "高度差",
        position: new Cesium.CallbackProperty(function () {
            return linearr[linearr.length - 1]
        }, false),
        point: {
            pixelSize: 6,
            color: Cesium.Color.YELLOW,
            clampToGround: true,
        },
        label: {
            text: new Cesium.CallbackProperty(function () {
                return "垂直高度" + diff + "m"
            }, false),
            backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
            showBackground: false, //显示背景
            style: Cesium.LabelStyle.FILL,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            font: "25pt",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
            outlineWidth: 11,
            clampToGround: true,
            pixelOffset: new Cesium.Cartesian2(0, -10),
        },
        polyline: {
            positions: new Cesium.CallbackProperty(function () {
                return linearr
            }, false),
            width: 3,
            material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.fromCssColorString("#c5c500"),
                dashLength: 20,
            }),
        },
    })

    // 创建点位
    function createPoint(p) {
        entities.push(
            viewer.entities.add({
                measure: true,
                position: p,
                point: {
                    pixelSize: 6,
                    color: Cesium.Color.YELLOW,
                    // clampToGround: true
                    disableDepthTestDistance: 0,
                },
            })
        )
    }

    // 鼠标点击
    handler.setInputAction(function (e) {
        const cartesian = handleClick(e.position)
        if (cartesian) {
            if (entities.length === 0) {
                linearr.push(cartesian)
                linearr.push(cartesian)
                createPoint(linearr[linearr.length - 1])
            } else {
                // 结束绘制
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
                handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)

                stop()
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 鼠标移动
    handler.setInputAction(function (e) {
        let cartesian = handleClick(e.endPosition)
        if (cartesian) {
            if (linearr.length === 2) {
                linearr[linearr.length - 1] = cartesian
                diff = Math.abs(carTolng(linearr[1]).alt - carTolng(linearr[0]).alt).toFixed(2)
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

// 水平面积
function flatArea() {
    const viewer = window.viewer

    var linearr = [] // 线的坐标存储
    let points = []
    let entities = []

    // 创建面
    const createPolygon = function (positions, color) {
        entities.push(
            viewer.entities.add({
                measure: true,
                polygon: {
                    hierarchy: positions,
                    material: new Cesium.ColorMaterialProperty(Cesium.Color.fromCssColorString("#c5c50080")),
                    perPositionHeight: true,
                },
            })
        )
    }
    // 左键
    handler.setInputAction(function (event) {
        // 获取世界坐标点
        const cartesian = handleClick(event.position)
        if (cartesian) {
            // 添加一个对象
            if (!entities.length) {
                linearr.push(cartesian.clone())
                createPolygon(new Cesium.CallbackProperty(() => new Cesium.PolygonHierarchy(linearr), false))
            }
            linearr.push(cartesian)
            points.push(
                viewer.entities.add({
                    measure: true,
                    name: "平行形面积点",
                    position: linearr[linearr.length - 1],
                    point: {
                        pixelSize: 6,
                        color: Cesium.Color.YELLOW,
                        disableDepthTestDistance: 0,
                    },
                })
            )
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 鼠标移动
    handler.setInputAction(function (event) {
        const cartesian = handleClick(event.endPosition)
        if (entities.length) {
            linearr.pop()
            linearr.push(cartesian)
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    // 结束绘制
    handler.setInputAction(function () {
        linearr.pop()
        linearr.push(linearr[0])
        let areaArr = linearr.map((x) => {
            let arr = Cesium.Cartographic.fromCartesian(x)
            return [Cesium.Math.toDegrees(arr.longitude), Cesium.Math.toDegrees(arr.latitude)]
        })

        let polygonTurf = turf.polygon([areaArr])
        let center = turf.centroid(polygonTurf)
        let pointArr = center.geometry.coordinates
        let pointObj = Cesium.Cartesian3.fromDegrees(pointArr[0], pointArr[1], getMaxHeight(linearr) + 2)
        let theta = turf.area(polygonTurf)
        if (theta / 1000 / 1000 > 10) theta = (theta / 1000 / 1000).toFixed(2) + "Km²"
        else theta = theta.toFixed(2) + "m²"
        entities.push(
            viewer.entities.add({
                measure: true,
                name: "平行面积",
                position: pointObj,
                label: {
                    text: theta,
                    backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
                    showBackground: false, //显示背景
                    style: Cesium.LabelStyle.FILL,
                    horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
                    verticalOrigin: Cesium.VerticalOrigin.CENTER,
                    font: "25pt",
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
                    outlineWidth: 11,
                    // clampToGround: true,
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: 0,
                },
            })
        )
        handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
        handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
        points.forEach((el) => {
            viewer.entities.remove(el)
        })
        stop()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
}

// 空间测距
function spaceDistance() {
    const viewer = window.viewer

    let diff = 0
    var linearr = []
    var entities = []

    // 两点之间的线段
    viewer.entities.add({
        measure: true,
        name: "空间距离",
        position: new Cesium.CallbackProperty(function () {
            return linearr[linearr.length - 1]
        }, false),
        point: {
            pixelSize: 6,
            color: Cesium.Color.YELLOW,
            clampToGround: true,
        },
        label: {
            text: new Cesium.CallbackProperty(function () {
                return diff + "m"
            }, false),
            backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
            showBackground: false, //显示背景
            style: Cesium.LabelStyle.FILL,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            font: "25pt",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
            outlineWidth: 11,
            clampToGround: true,
            pixelOffset: new Cesium.Cartesian2(0, -10),
        },
        polyline: {
            positions: new Cesium.CallbackProperty(function () {
                return linearr
            }, false),
            width: 3,
            material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.fromCssColorString("#c5c500"),
                dashLength: 20,
            }),
        },
    })

    // 创建点位
    function createPoint(p) {
        entities.push(
            viewer.entities.add({
                measure: true,
                position: p,
                point: {
                    pixelSize: 6,
                    color: Cesium.Color.YELLOW,
                    // clampToGround: true
                    disableDepthTestDistance: 0,
                },
            })
        )
    }

    // 鼠标点击
    handler.setInputAction(function (e) {
        const cartesian = handleClick(e.position)
        if (cartesian) {
            if (entities.length === 0) {
                linearr.push(cartesian)
                linearr.push(cartesian)
                createPoint(linearr[linearr.length - 1])
            } else {
                // 结束绘制
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
                handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)

                stop()
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 鼠标移动
    handler.setInputAction(function (e) {
        let cartesian = handleClick(e.endPosition)
        if (cartesian) {
            if (linearr.length === 2) {
                linearr[linearr.length - 1] = cartesian
                // diff = Cesium.Cartesian3.distance(linearr[0], linearr[1]).toFixed(2)
                const a = carTolng(linearr[0])
                const b = carTolng(linearr[1])
                diff = calculateHaversineDistance([a.lng, a.lat], [b.lng, b.lat])
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

// 三角测量
function triangle() {
    const viewer = window.viewer

    let entities = [], //实体集合
        linearr = [], //点集合
        spaceDiff = 0, //空间距离
        flatDistance = 0, //水面距离
        heightDiff = 0, //高差
        meetPoint //交点
    let l2 = [], //高差线
        l3 = [] //水平线

    // 创建点位
    function createPoint(p) {
        entities.push(
            viewer.entities.add({
                measure: true,
                position: p,
                point: {
                    pixelSize: 6,
                    color: Cesium.Color.YELLOW,
                },
            })
        )
    }

    // 创建交点
    function createMeetPoint() {
        entities.push(
            viewer.entities.add({
                measure: true,
                position: new Cesium.CallbackProperty(function () {
                    return meetPoint
                }, false),
                point: {
                    pixelSize: 6,
                    color: Cesium.Color.YELLOW,
                },
            })
        )
    }

    // 两点的交点
    const getMeetPoint = (points) => {
        const first = carTolng(points[0])
        const second = carTolng(points[1])
        // 计算两点的高度差
        heightDiff = second.alt - first.alt

        // 计算得出交点具体坐标
        meetPoint = Cesium.Cartesian3.fromDegrees(first.lng, first.lat, first.alt + heightDiff)

        // 第二点与交点的水平距离
        flatDistance = Cesium.Cartesian3.distance(meetPoint, points[1])
        const a = carTolng(meetPoint)
        const b = carTolng(points[1])
        flatDistance = calculateHaversineDistance([a.lng, a.lat], [b.lng, b.lat])

        const c = carTolng(points[0])
        const d = carTolng(points[1])
        // spaceDiff = calculateHaversineDistance([c.lng, c.lat], [d.lng, d.lat])
        spaceDiff = Cesium.Cartesian3.distance(points[0], points[1])
        l2 = [linearr[0], meetPoint]
        l3 = [meetPoint, linearr[1]]
        createMeetPoint()
    }

    // 水平线段及距离
    viewer.entities.add({
        measure: true,
        name: "三角测量-水平",
        position: new Cesium.CallbackProperty(function () {
            return meetPoint
        }, false),
        point: {
            pixelSize: 6,
            color: Cesium.Color.YELLOW,
            clampToGround: true,
        },
        label: {
            text: new Cesium.CallbackProperty(function () {
                return "水平" + flatDistance.toFixed(2) + "m"
            }, false),
            backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
            showBackground: false, //显示背景
            style: Cesium.LabelStyle.FILL,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            font: "25pt",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
            outlineWidth: 11,
            clampToGround: true,
            pixelOffset: new Cesium.Cartesian2(0, -10),
        },
        // 水平距离
        polyline: {
            positions: new Cesium.CallbackProperty(function () {
                return l3
            }, false),
            width: 3,
            material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.fromCssColorString("#c5c500"),
                dashLength: 20,
            }),
        },
    })

    // 高差线段及距离
    viewer.entities.add({
        measure: true,
        name: "三角测量-高差",
        position: new Cesium.CallbackProperty(function () {
            return linearr[0]
        }, false),
        point: {
            pixelSize: 6,
            color: Cesium.Color.YELLOW,
            clampToGround: true,
        },
        label: {
            text: new Cesium.CallbackProperty(function () {
                return "高差" + heightDiff.toFixed(2) + "m"
            }, false),
            backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
            showBackground: false, //显示背景
            style: Cesium.LabelStyle.FILL,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            font: "25pt",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
            outlineWidth: 11,
            clampToGround: true,
            pixelOffset: new Cesium.Cartesian2(0, -10),
        },
        // 高差
        polyline: {
            positions: new Cesium.CallbackProperty(function () {
                return l2
            }, false),
            width: 3,
            material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.fromCssColorString("#c5c500"),
                dashLength: 20,
            }),
        },
    })

    // 空间线段及距离
    viewer.entities.add({
        measure: true,
        name: "三角测量-空间线段",
        position: new Cesium.CallbackProperty(function () {
            return linearr[1]
        }, false),
        point: {
            pixelSize: 6,
            color: Cesium.Color.YELLOW,
            clampToGround: true,
        },
        label: {
            text: new Cesium.CallbackProperty(function () {
                return "空间" + spaceDiff.toFixed(2) + "m"
            }, false),
            backgroundColor: new Cesium.Color.fromCssColorString("#8b8784"),
            showBackground: false, //显示背景
            style: Cesium.LabelStyle.FILL,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER, //对齐方式
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            font: "25pt",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE, // label样式
            outlineWidth: 11,
            clampToGround: true,
            pixelOffset: new Cesium.Cartesian2(0, -10),
        },
        // 空间距离
        polyline: {
            positions: new Cesium.CallbackProperty(function () {
                return linearr
            }, false),
            width: 3,
            material: new Cesium.PolylineOutlineMaterialProperty({
                color: Cesium.Color.fromCssColorString("#c5c500"),
                dashLength: 20,
            }),
        },
    })
    // 鼠标点击
    handler.setInputAction(function (e) {
        const cartesian = handleClick(e.position)
        if (cartesian) {
            if (entities.length === 0) {
                linearr.push(cartesian)
                linearr.push(cartesian)
                createPoint(linearr[linearr.length - 1])
            } else {
                createPoint(meetPoint)

                // 结束绘制
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
                handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)

                stop()
            }
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 鼠标移动
    handler.setInputAction(function (e) {
        let cartesian = handleClick(e.endPosition)
        if (cartesian) {
            if (linearr.length === 2) {
                linearr[linearr.length - 1] = cartesian
                getMeetPoint(linearr)
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)
}

function clearAll() {
    viewer.entities.values.forEach((element) => {
        if (element.measure) {
            viewer.entities.remove(element)
        }
    })
    if (viewer.entities.values.filter((x) => x.measure).length) {
        clearAll()
    }
    console.log(viewer.entities.values)
}

function stop() {
    that.isActive = null
}

function sendThis(_this) {
    that = _this
}

const toolMap = [
    { label: "水平测距", func: "spaceDistance", img: "icon_spcj", active: false, idx: 1 },
    { label: "贴地测距", func: "distance", img: "icon_tdcj", active: true, idx: 2 },
    { label: "水平面积", func: "flatArea", img: "icon_spmj", active: false, idx: 3 },
    { label: "贴地面积", func: "area", img: "icon_tdmj", active: true, idx: 4 },
    { label: "方位角", func: "azimuth", img: "icon_fwj", active: true, idx: 5 },
    { label: "坐标测量", func: "coordinate", img: "icon_zbcl", active: true, idx: 6 },
    { label: "高度差", func: "heightDiff", img: "icon_gdc", active: false, idx: 7 },
    { label: "三角测量", func: "triangle", img: "icon_sjcl", active: false, idx: 8 },
]

export default {
    toolMap,
    azimuth,
    area,
    distance,
    coordinate,
    heightDiff,
    flatArea,
    spaceDistance,
    triangle,
    clearAll,
    stop,
    sendThis,
    getHeigthByLonLat,
}
