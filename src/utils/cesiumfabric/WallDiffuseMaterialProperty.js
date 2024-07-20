import * as Cesium from 'cesium'
class WallDiffuseMaterialProperty {
    constructor(options) {
        this._definitionChanged = new Cesium.Event();
        this._color = undefined;
        this.color = options.color;
    };

    get isConstant() {
        return false;
    }

    get definitionChanged() {
        return this._definitionChanged;
    }

    getType(time) {
        return Cesium.Material.WallDiffuseMaterialType;
    }

    getValue(time, result) {
        if (!Cesium.defined(result)) {
            result = {};
        }

        result.color = Cesium.Property.getValueOrDefault(this._color, time, Cesium.Color.RED, result.color);
        return result
    }

    equals(other) {
        return (this === other ||
            (other instanceof WallDiffuseMaterialProperty &&
                Cesium.Property.equals(this._color, other._color))
        )
    }
}

Object.defineProperties(WallDiffuseMaterialProperty.prototype, {
    color: Cesium.createPropertyDescriptor('color'),
})

Cesium.WallDiffuseMaterialProperty = WallDiffuseMaterialProperty;
Cesium.Material.WallDiffuseMaterialProperty = 'WallDiffuseMaterialProperty';
Cesium.Material.WallDiffuseMaterialType = 'WallDiffuseMaterialType';
Cesium.Material.WallDiffuseMaterialSource =
    `
    uniform vec4 color;
    czm_material czm_getMaterial(czm_materialInput materialInput){
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec2 st = materialInput.st;
    material.diffuse = color.rgb * 2.0;
    material.alpha = color.a * (1.0 - fract(st.t)) * 0.8;//立体向上
    //material.alpha = color.a *  (fract(st.t)) * 0.8;//立体向下
    //material.alpha = color.a * (fract(st.s)) * 0.8;//水平逆时针
    //material.alpha = color.a * (1.0 - fract(st.s)) * 0.8;//水平顺时针
    //material.alpha=mod(1.0-st.s+czm_frameNumber,1.0);

    return material;
    }

    `


Cesium.Material._materialCache.addMaterial(Cesium.Material.WallDiffuseMaterialType, {
    fabric: {
        type: Cesium.Material.WallDiffuseMaterialType,
        uniforms: {
            color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
        },
        source: Cesium.Material.WallDiffuseMaterialSource
    },
    translucent: function (material) {
        return true;
    }
})
