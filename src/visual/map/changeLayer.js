import * as Cesium from 'cesium'
export default function changeLayer(viewer, params, arr) {
    addData(viewer, params, arr)
    async function addData(viewer, params, arr) {
        if (params.url) {
            let url, layer
            switch (params.type) {
                case 'tdt':
                    url = params.url.split('_')
                    layer = new Cesium.WebMapTileServiceImageryProvider({
                        url: `http://{s}.tianditu.com/${params.url}/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=${url[0]}&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=1d109683f4d84198e37a38c442d68311`,
                        layer: 'tdtBasicLayer',
                        style: 'default',
                        format: 'image/jpeg',
                        tileMatrixSetID: 'GoogleMapsCompatible',
                        credit: '',
                        subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
                        maximumLevel: 17
                    })
                    break;
                case 'arcgis':
                    layer = await Cesium.ArcGisMapServerImageryProvider.fromUrl(params.url);
                    break;
                default:
                    break;
            }
            if (arr[params.url]) {

                viewer.imageryLayers.remove(arr[params.url])
                if (!arr[params.url].isDestroyed()) {
                    arr[params.url].destroy()
                }
                delete arr[params.url]
            } else {
                let newArr = Object.assign({}, arr)
                delete newArr['cia_w']
                delete newArr['cva_w']
                let index = Object.keys(newArr).length + 1

                viewer.imageryLayers.addImageryProvider(layer, index)
                let num = viewer.imageryLayers._layers.length + 1
                arr[params.url] = viewer.imageryLayers._layers[index]
            }
        }
    }

}