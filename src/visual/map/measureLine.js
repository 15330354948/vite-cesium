/* eslint-disable */
import * as Cesium from 'cesium'

//测量长度
export const measureLine = (viewer) => {
  //鼠标会偏差
  // var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
  var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  var positions = [];
  var poly = null;
  var distance = 0;
  var cartesian = null;
  var floatingPoint;
  var labelPt;

  handler.setInputAction(function (movement) {
    let ray = viewer.camera.getPickRay(movement.endPosition); //Cartesian3_to_WGS84

    cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (!Cesium.defined(cartesian))
      //跳出地球时异常
      return;

    if (positions.length >= 2) {
      if (!Cesium.defined(poly)) {
        poly = new PolyLinePrimitive(positions);
      } else {
        positions.pop();
        positions.push(cartesian);
      }
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

  handler.setInputAction(function (movement) {
    let ray = viewer.camera.getPickRay(movement.position);

    cartesian = viewer.scene.globe.pick(ray, viewer.scene);
    if (!Cesium.defined(cartesian))
      //跳出地球时异常
      return;

    if (positions.length == 0) {
      positions.push(cartesian.clone());
    }

    positions.push(cartesian);
    //记录鼠标单击时的节点位置，异步计算贴地距离
    labelPt = positions[positions.length - 1];

    if (positions.length > 2) {
      getSpaceDistance(positions);
    } else if (positions.length == 2) {
      //在三维场景中添加Label
      floatingPoint = viewer.entities.add({
        name: '空间距离',
        position: labelPt,
        point: {
          pixelSize: 5,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
      });
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  handler.setInputAction(function () {
    handler.destroy(); //关闭事件句柄
    handler = undefined;
    positions.pop(); //最后一个点无效
    if (positions.length == 1) viewer.entities.remove(floatingPoint);
  }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

  var PolyLinePrimitive = (function () {
    function _(positions) {
      this.options = {
        name: '直线',
        polyline: {
          show: true,
          positions: [],
          material: Cesium.Color.YELLOW.withAlpha(0.8),
          width: 5,
          clampToGround: true,
        },
      };
      this.positions = positions;
      this._init();
    }

    _.prototype._init = function () {
      var _self = this;

      var _update = function () {
        return _self.positions;
      };

      //实时更新polyline.positions
      this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);

      viewer.entities.add(this.options);
    };

    return _;
  })();

  //空间两点距离计算函数
  function getSpaceDistance(positions) {
    //只计算最后一截，与前面累加
    //因move和鼠标左击事件，最后两个点坐标重复
    var i = positions.length - 3;
    var point1cartographic = Cesium.Cartographic.fromCartesian(positions[i]);
    var point2cartographic = Cesium.Cartographic.fromCartesian(positions[i + 1]);

    getTerrainDistance(point1cartographic, point2cartographic);
  }

  function getTerrainDistance(point1cartographic, point2cartographic) {
    var geodesic = new Cesium.EllipsoidGeodesic();

    geodesic.setEndPoints(point1cartographic, point2cartographic);

    var s = geodesic.surfaceDistance;
    var cartoPts = [point1cartographic];

    for (var jj = 1000; jj < s; jj += 1000) {
      //分段采样计算距离
      var cartoPt = geodesic.interpolateUsingSurfaceDistance(jj);

      cartoPts.push(cartoPt);
    }

    cartoPts.push(point2cartographic);

    //返回两点之间的距离
    Cesium.sampleTerrain(viewer.terrainProvider, 8, cartoPts).then((updatedPositions) => {
      for (var jj = 0; jj < updatedPositions.length - 1; jj++) {
        var geoD = new Cesium.EllipsoidGeodesic();

        geoD.setEndPoints(updatedPositions[jj], updatedPositions[jj + 1]);

        var innerS = geoD.surfaceDistance;

        innerS = Math.sqrt(
          Math.pow(innerS, 2) + Math.pow(updatedPositions[jj + 1].height - updatedPositions[jj].height, 2),
        );
        distance += innerS;
      }

      //在三维场景中添加Label
      var lon1 = viewer.scene.globe.ellipsoid.cartesianToCartographic(labelPt).longitude;
      var lat1 = viewer.scene.globe.ellipsoid.cartesianToCartographic(labelPt).latitude;
    //   var lonLat = '(' + Cesium.Math.toDegrees(lon1).toFixed(2) + ',' + Cesium.Math.toDegrees(lat1).toFixed(2) + ')';
      var textDisance = distance.toFixed(2) + '米';

      if (distance > 10000) textDisance = (distance / 1000.0).toFixed(2) + '千米';
      floatingPoint = viewer.entities.add({
        name: '贴地距离',
        position: labelPt,
        point: {
          pixelSize: 5,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
        label: {
          text: textDisance,
          font: '18px sans-serif',
          fillColor: Cesium.Color.GOLD,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(20, -20),
        },
      });
    });
  }
};