<!-- 子组件-底图切换 -->
<script setup>
import changeLayer from "../visual/map/changeLayer";
const props = defineProps({
    viewer: {
        type: Object,
        default: () => {}
    }

})
let layerArr = {}
const layerList = [
    {
        name: "天地图影像",
        imgUrl: "/images/map/tdtyx.jpg",
        url: "img_w",
        type: "tdt",
        isClick: false
    },
    {
        name: "天地图街道",
        imgUrl: "/images/map/vec_c.jpg",
        url: "vec_w",
        type: "tdt",
        isClick: false
    },  
    {
        name: "矢量注记",
        imgUrl: "/images/map/vec_c.jpg",
        url: "cva_w",
        type: "tdt",
        isClick: false
    },
    {
        name: "arcgis影像",
        imgUrl: "/images/map/arcgisyx.jpg",
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
        type: "arcgis",
        isClick: false
    },
    {
        name: "蓝黑色街道",
        imgUrl: "/images/map/layer.jpg",
        url: "https://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer",
        type: "arcgis",
        isClick: false
    },
]
const clickLayer = (item) => {
    item.isClick = !item.isClick;
    changeLayer(viewer, item, layerArr);
}
</script>
<template>
    <div class="layerSelect">
        <div class="title">底图切换</div>
        <div class="content">
            <div v-for="(item, index) in layerList" :key="index" class="itemDiv" :class="item.isClick ? 'itemDivSelect' : ''"
                @click="clickLayer(item)">
                <div class="img">
                    <img :src="item.imgUrl" alt="" />
                    <span>{{ item.name }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.layerSelect {
    width: 100%;
    height: 100%;
}

.content {
    width: 100%;
    padding: 10px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
    overflow-y: auto;
}
.img{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}
img{
    width: 90px;
    height: 60px;
}
.itemDiv{
    color: #000;
}
.itemDivSelect{
    color: #ccc;
    font-weight: bold;
}
</style>