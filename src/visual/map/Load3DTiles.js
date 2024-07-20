import * as Cesium from 'cesium'
/**加载3dtiles文件 */
export default class Load3DTiles {
    constructor(viewer, url, type) {
        this.viewer = viewer
        this.data = url
        this.type = type
        this.currLayer = null
        this.tileset = null
        this.addData()
    }
    async addData() {
        this.tileset = await Cesium.Cesium3DTileset.fromUrl(this.data.serverUrl[0].url, {
            skipLevelOfDetail: true,
            baseScreenSpaceError: 1024,
            maximumScreenSpaceError: 32,
            cacheBytes: 4096 * 1024 * 1024,
            maximumCacheOverflowBytes: 7168 * 1024 * 1024,
            cullRequestsWhileMoving: true,
            cullRequestsWhileMovingMultiplier: 10, // 值越小越能够更快的剔除
            progressiveResolutionHeightFraction: 0.5, // 数值偏于0能够让初始加载变得模糊
            dynamicScreenSpaceErrorDensity: 0.5, // 数值加大，能让周边加载变快
            dynamicScreenSpaceError: true, // 全屏加载完之后才清晰化房屋
        })
        this.tileset.id = this.data.title + this.data.id
        // this.tileset = new Cesium.Cesium3DTileset({
        //     url: this.url,
        //     maximumScreenSpaceError: 64,
        //     // unionClippingRegions: true,
        // })

        this.viewer.scene.globe.depthTestAgainstTerrain = true
        this.viewer.scene.primitives.add(this.tileset)
        this.viewer.scene.globe.depthTestAgainstTerrain = false
        this.type && this.flyto()

    }
    flyto() {
        // this.tileset.readyPromise.then(res => {
        // this.viewer.zoomTo(res);
        this.viewer.zoomTo(this.tileset);
        // this.viewer.camera.viewBoundingSphere(this.tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0))
        // })
    }
    remove() {
        this.viewer.scene.primitives.remove(this.tileset)
    }
}