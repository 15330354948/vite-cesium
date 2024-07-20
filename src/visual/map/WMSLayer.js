import * as Cesium from 'cesium'
/**加载shp类型文件 */
export default class WMSLayer {
    constructor(viewer, data, type) {
        this.viewer = viewer
        this.data = data
        this.type = type
        this.currLayer = 0
        this.addData()
    }
    addData() {
        this.provider = new Cesium.WebMapServiceImageryProvider({
            url: this.data.serverUrl[0].url,
            layers: this.data.title,
            parameters: {
                layers: this.data.title,
                service: 'WMS',
                format: 'image/png',
                srs: this.data.serverUrl[0].srs ? this.data.serverUrl[0].srs : 'EPSG:4326',
                width: 256,
                height: 256,
                version: '1.1.1',
                transparent: true,
            }
        });
        if (viewer.map[this.data.title + this.data.id]) {
            viewer.imageryLayers.remove(viewer.map[this.data.title + this.data.id])
            delete viewer.map[this.data.title + this.data.id]
        }
        let layer = this.viewer.imageryLayers.addImageryProvider(this.provider)
        this.viewer.map[this.data.title + this.data.id] = layer
        this.currLayer = this.viewer.imageryLayers._layers[this.viewer.imageryLayers.length - 1]
        this.type && this.flyto()
    }
    flyto() {
        viewer.camera.flyTo({
            destination: Cesium.Rectangle.fromDegrees(this.data.minx, this.data.miny, this.data.maxx, this.data.maxy)
        });
    }
    remove() {
        viewer.imageryLayers.remove(viewer.map[data.label + data.gisId])
        delete viewer.map[data.label + data.gisId]
    }
}