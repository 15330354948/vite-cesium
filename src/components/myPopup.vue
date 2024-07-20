<template>
    <div class="system-user-dialog-container" v-if="visiblePopup">
        <div class="header">
            <span>飞行漫游</span>
            <span class="close" @click="close">×</span>
        </div>
        <div class="body">
            <!-- 绘制 -->
            <el-button type="primary" @click="drawLineRoad">绘制</el-button>
            <el-table :data="dataList">
                <el-table-column prop="name" label="名称" />
                <el-table-column fixed="right" label="操作" width="250px">
                    <template #default="scope">
                        <el-button text type="primary" size="small"
                            @click="handleFly(scope.row, scope.$index)">飞行</el-button>
                        <el-button text type="primary" size="small" @click="stopFly(scope.row, scope.$index)">暂停</el-button>
                        <el-button text type="primary" size="small"
                            @click="continueFly(scope.row, scope.$index)">继续</el-button>
                        <el-button text type="danger" size="small"
                            @click="delEntity(scope.row, scope.$index)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <el-dialog v-model="dialogFormVisible" title="配置" width="500">
            <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
                <el-form-item label="漫游路径名称" :label-width="formLabelWidth" prop="title">
                    <el-input v-model="form.title" autocomplete="off" />
                </el-form-item>
                <el-form-item label="漫游高度" :label-width="formLabelWidth" prop="height">
                    <el-input v-model="form.height" autocomplete="off" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm(formRef)">
                        确定
                    </el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import { onUnmounted, ref, reactive, defineEmits, } from 'vue'
import { defineProps } from 'vue'
import * as Cesium from 'cesium'
const props = defineProps({
    viewer: {
        type: Object,
        default: () => { }
    },
    visiblePopup: {
        type: Boolean,
        default: false
    }
})
const emits = defineEmits(['closed'])
const dialogFormVisible = ref(false)
const formLabelWidth = '140px'
const form = reactive({
    title: '',
    height: '',
})
const formRef = ref()
const rules = reactive({
    title: [
        { required: true, message: '请输入', trigger: 'blur' },
    ],
    height: [
        {
            required: true,
            message: '请输入',
            trigger: 'blur',
        },
    ],
})
// 是否开始绘制
const drawing = ref(false)
let dataList = ref([]);

var handler = null;
// 绘制的所有地面的点线实体集合
var entities = [];
// 临时一条数据的point实体列表
var pointEntities = [];
// 临时一条数据的线实体列表
var linesEntities = [];

var activeShapePoints = [];
// 构建列表一条数据的数据，经纬度高度
var customMarks = [];

var floatingPoint = undefined;
var activeShape = undefined;

const drawLineRoad = () => {
    // dialogFormVisible.value = true;
    drawing.value = true;
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(function (event) {
        if (drawing.value) {
            viewer.scene.globe.depthTestAgainstTerrain = true;
            console.log(event.position);
            var earthPosition = props.viewer.scene.pickPosition(event.position);
            console.log(earthPosition);
            if (Cesium.defined(earthPosition)) {
                if (activeShapePoints.length === 0) {
                    floatingPoint = createPoint(earthPosition)
                    activeShapePoints.push(earthPosition);
                    var dynamicPositions = new Cesium.CallbackProperty(function () {
                        return activeShapePoints;
                    }, false);
                    activeShape = drawShape(dynamicPositions) // 绘制动态图
                    // 线实体集合
                    linesEntities.push(activeShape);
                }
                activeShapePoints.push(earthPosition);//点实体集合
                pointEntities.push(createPoint(earthPosition));
            }
        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
    //鼠标移动
    handler.setInputAction(function (event) {
        if (Cesium.defined(floatingPoint)) {
            var newPosition = props.viewer.scene.pickPosition(event.endPosition);
            if (Cesium.defined(newPosition)) {
                floatingPoint.position.setValue(newPosition);
                activeShapePoints.pop();
                activeShapePoints.push(newPosition);
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.setInputAction(function () {
        if (drawing.value) {
            drawing.value = false;
            terminateShape();
        }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
}

//绘制点
const createPoint = (worldPosition) => {
    var point = props.viewer.entities.add({
        position: worldPosition,
        point: {
            color: Cesium.Color.RED,
            pixelsize: 10,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        }
    });
    return point;
}
//绘制线
const drawShape = (positionData) => {
    var shape = props.viewer.entities.add({
        polyline: {
            with: 10,
            color: Cesium.Color.RED,
            positions: positionData,
            clampToGround: true,
        }
    });
    console.log(shape);
    return shape;
}
//双击后处理数据
const terminateShape = () => {
    linesEntities.push(drawShape(activeShapePoints));//绘制最终图

    //因双击会触发俩次单机事件，去除最后一个点重复绘制，并删除多余的点
    props.viewer.entities.remove(pointEntities[pointEntities.length - 1]);
    pointEntities.pop();
    dialogFormVisible.value = true;//弹出对话框
    props.viewer.entities.remove(floatingPoint);
    //去除动态点图形(当前鼠标点)
    props.viewer.entities.remove(activeShape);//去除动态图形
    floatingPoint = undefined;
    activeShape = undefined;
    activeShapePoints = [];
    props.viewer.trackedEntity = null;
}

const submitForm = async (formEl) => {
    console.log(form);
    const valid = await formEl.validate()
    if (valid) {
        if (pointEntities.length) {
            for (const item of pointEntities) {
                const latitude = toDegrees(Cesium.Cartographic.fromCartesian(item.position._value).latitude)
                const longitude = toDegrees(Cesium.Cartographic.fromCartesian(item.position._value).longitude)
                customMarks.push({ longitude, latitude, height: form.height })
            }
        }
        addElectronicFence(form.title, customMarks)
        customMarks = [];
        form.height = 300;
        dialogFormVisible.value = false;
        formEl.resetFields();
    }
}

// 添加列表数据
var addElectronicFence = (name, positions) => {
    //点实体和线实体的集合
    entities.push({
        pointEntities: pointEntities,
        linesEntities: linesEntities
    });
    dataList.value.push({
        id: Cesium.createGuid(),
        name: name,
        positions: positions,
    });
    console.log(dataList);
    pointEntities = [];
    linesEntities = [];
    //移除点击事件
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
}

const delEntity = (item, index) => {
    //如果删除的是当前飞行的路线 暂停飞行并删除飞机实体
    if (item.id == airplaneEntity.id) {
        stopFly();
        props.viewer.entities.remove(airplaneEntity);
    }
    //循环删除条目上的实体点和实体线
    for (const obj of entities[index].pointEntities) {
        props.viewer.entities.remove(obj);
    }

    for (const obj of entities[index].linesEntities) {
        props.viewer.entities.remove(obj);
    }
    //删除当前条目的数据
    entities.splice(index, 1);
    dataList.value.splice(index, 1);
}

const positionProperty = new Cesium.SampledPositionProperty();
//时间的间隔
const timeStepInSeconds = 10;
var airplaneEntity = null;

const handleFly = (item, index) => {
    //当下个飞行前清除上次的飞行对象和路径
    if (airplaneEntity != null) {
        props.viewer.entities.remove(airplaneEntity);
    }
    //获取条目经纬度数据集合
    let flightData = item.positions;
    const totalSeconds = (flightData.length - 1) * timeStepInSeconds;
    //设置起点时间
    const time = new Date('2020-03-09T23:10:00Z');
    const start = Cesium.JulianDate.fromDate(time);// 设置终点时间
    const stop = Cesium.JulianDate.addSeconds(start, totalSeconds, new Cesium.JulianDate());

    props.viewer.clock.startTime = start.clone();
    props.viewer.clock.stopTime = stop.clone();
    props.viewer.clock.currentTime = start.clone();
    //设置进度条，从哪里开始到哪里结束
    // props.viewer.timeline.zoomTo(start, stop);

    for (let i = 0; i < flightData.length; i++) {
        const dataPoint = flightData[i];
        console.log(flightData);
        // 采样时间
        const time = Cesium.JulianDate.addSeconds(start, i * timeStepInSeconds, new Cesium.JulianDate());
        // 计算当前的3D坐标
        console.log(dataPoint.longitude, dataPoint.latitude, dataPoint.height);
        const position = Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, Number(dataPoint.height));
        // 添加轨迹采样点
        positionProperty.addSample(time, position);

        // 添加物体点
        // const point = props.viewer.entities.add({
        //     position: position,
        //     point: {
        //         pixelSize: 10,
        //         color: new Cesium.Color(0.7, 0.8, 0, 0.7)
        //     }
        // })
    }

    // 创建飞机
    airplaneEntity = props.viewer.entities.add({
        id: item.id,
        availability: new Cesium.TimeIntervalCollection([
            new Cesium.TimeInterval({
                start: start,
                stop: stop
            })
        ]),
        position: positionProperty,
        model: {
            uri: '/tynb/1.gltf',
        },
        // 自动计算前进方向
        orientation: new Cesium.VelocityOrientationProperty(positionProperty),
        // 绘制轨迹线
        path: new Cesium.PathGraphics({
            width: 3,
        })
    })
    // 设置相机追踪运动物体
    props.viewer.trackedEntity = airplaneEntity;
    // 设置时间速率
    props.viewer.clock.multiplier = 1;
    // 设置自动播放
    props.viewer.clock.shouldAnimate = true;
}

//停止飞行
const stopFly = () => {
    props.viewer.clock.shouldAnimate = false;
}
//继续飞行
const continueFly = () => {
    props.viewer.clock.shouldAnimate = true;
};
// 弧度转角度
const toDegrees = (radians) => {
    return (radians * 180) / Math.PI;
};
// 角度转弧度
const toRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
}

onUnmounted(() => {
    //清除绘制的内容
    props.viewer.entities.removeAll();
    if (handler != null) {
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }
})
const close = () => {
    emits('closed', false)
}
</script>
<style scoped>
.system-user-dialog-container {
    position: absolute;
    background-color: #fff;
    border-radius: 4px;
    top: 10px;
    right: 10px;
    width: 400px;
    max-width: 600px;
    z-index: 9999;
}

.header {
    padding: 10px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
}

.close {
    font-size: 18px;
    color: #999;
    cursor: pointer;
}

.body {
    padding: 10px;
}

.el-form {
    display: flex !important;
    flex-direction: column !important;
}</style>