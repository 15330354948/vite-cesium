import * as Cesium from 'cesium'
/**加载terrain数据 */
export default class addTerrain {
    constructor(viewer, url, type) {
        this.viewer = viewer
        this.url = url
        this.type = type
        this.addData()
    }
    async addData() {
        this.viewer.terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(this.url)
        this.type && this.flyto()
        // this.viewer.terrainProvider = new Cesium.CesiumTerrainProvider({ url: this.url })
    }
    flyto() {
        // this.viewer.terrainProvider.readyPromise.then(res => {
        let viewer = this.viewer
        let xhr = new XMLHttpRequest()
        xhr.open('GET', this.url + '/meta.json', true)
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const jsonStr = JSON.parse(xhr.responseText)
                viewer.camera.flyTo({
                    destination: Cesium.Rectangle.fromDegrees(jsonStr.latLonBounds.west, jsonStr.latLonBounds.south, jsonStr.latLonBounds.east, jsonStr.latLonBounds.north)

                });
            }
        }
        xhr.send(null)
        // })
    }
    remove() {
        this.viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider({});
    }
}