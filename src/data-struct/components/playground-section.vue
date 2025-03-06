<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import { playground } from "../handler/playground-handler";
import { runSample } from "../samples";
import { EventHandler } from "../handler/event-handler";
import { infoPopup, errorPopup, setErrorPopupText, curToolIdx, ToolList } from "../global";
import ToolInput from "./tool-input.vue";

const playgroundSection = ref<null | HTMLElement>(null);
const pgndCanvas = ref<null | HTMLCanvasElement>(null);
const toolCanvas = ref<null | HTMLCanvasElement>(null);
const lineCanvas = ref<null | HTMLCanvasElement>(null);
const eventHandler = new EventHandler();

function resizeCanvas() {
	if(playgroundSection.value === null) throw "playgroundSection not found";
	const width = playgroundSection.value.clientWidth;
	const height = playgroundSection.value.clientHeight;
	playground.resizeCanvas(width, height);
}

onMounted(() => {
	playground.init(
		pgndCanvas.value as HTMLCanvasElement,
		toolCanvas.value as HTMLCanvasElement,
		lineCanvas.value as HTMLCanvasElement
	);
	resizeCanvas();
	window.addEventListener("resize", resizeCanvas);

	runSample(playground);
})

onUnmounted(() => {
	window.removeEventListener("resize", resizeCanvas);
})
</script>

<template>
<section id="playground-section" ref="playgroundSection">
	<canvas id="playground-lines" ref="lineCanvas"></canvas>
	<canvas
		id="playground"
		@pointerdown="eventHandler.pointerDown($event, playground)"
		@pointerup="eventHandler.pointerUp($event, playground)"
		@pointerenter="eventHandler.pointerEnter($event, playground)"
		@pointerleave="eventHandler.pointerLeave($event, playground)"
		@pointermove="eventHandler.pointerMove($event, playground)"
		ref="pgndCanvas"
	></canvas>
	<canvas id="element" ref="toolCanvas"></canvas>

	<ToolInput />

	<div id="tool-name" v-if="curToolIdx !== -1">
		<div class="tool">
			<div>
				<component :is="ToolList[curToolIdx].icon"></component>
			</div>
		</div>
		<div>{{ ToolList[curToolIdx].name }}</div>
	</div>

	<div id="info-popup" v-if="infoPopup.text !== ''">
		<div class="icon">i</div>
		<div class="info-text">{{ infoPopup.text }}</div>
	</div>

	<div v-if="errorPopup.text !== ''" id="popup-container" @click.self="setErrorPopupText('')">
		<div>
			<div>
				{{errorPopup.text}}
			</div>
			<button class="btn btn-nobg" @click="setErrorPopupText('')">ok</button>
		</div>
	</div>
</section>
</template>

<style scoped>
@import "@css/common.css";

#playground-section{
	overflow: hidden;
	position: relative;
	width: 100%;
	height: 100vh;
}

#playground-lines{
	display: block;
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
}

#playground{
	display: block;
	background-color: transparent;
	position: relative;
	touch-action: none;
	width: 100%;
	height: 100%;
}

#element{
	display: block;
	background-color: transparent;
	position: absolute;
	width: 0;
	height: 0;
	top: 0;
	z-index: 10;
	pointer-events: none;
	opacity: 0.5;
}

#tool-name{
	display: flex;
	flex-direction: row;
	align-items: center;
	position: absolute;
	height: 2.5rem;
	width: 12rem;
	min-width: 2rem;
	padding: 0.3rem;
	bottom: 10%;
	left: 50%;
	transform: translateX(-50%);
	z-index: 100;
	overflow-x: auto;
	overflow-y: hidden;
	background: #252525;
	color: white;
	border-radius: 4px;
	border: 1px solid #555555;
}

.tool{
	display: flex;
	width: 30%;
	height: 100%;
}

.tool div{
	height: 100%;
	color: black;
	min-width: 3rem;
	padding: 0.2rem;
	border-radius: 4px;
}

.tool div > *{
	width: 100%;
	height: 100%;
	--stroke-clr: #444444;
	pointer-events: none;
}

#popup-container{
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.6);
	position: absolute;
	top: 0;
	left: 0;
	z-index: 100;
}

#popup-container > div{
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	min-width: 15rem;
	min-height: 8rem;
	background-color: rgb(20, 20, 20);
	color: black;
	border-radius: 4px;
	font-size: 1.2rem;
	color: rgb(255, 57, 43);
	border: 2px solid rgb(255, 57, 43);
	box-shadow: 0 8px 30px rgb(0, 0, 0);
	padding: 1rem;
}

#popup-container button{
	margin-top: 1.5rem;
}

#info-popup{
	max-width: 40rem;
	min-width: 15rem;
	min-height: 3rem;
	background-color: rgb(40, 40, 40);
	border: 2px solid rgb(255, 200, 100);
	border-radius: 4px;
	box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
	position: absolute;
	bottom: 15%;
	left: 50%;
	transform: translateX(-50%);
	padding: 0.5rem 1rem;
	display: flex;
	flex-direction: row;
	align-items: center;
	z-index: 100;
}

.info-text{
	color: white;
}

#info-popup .icon{
	display: inline-flex;
	justify-content: center;
	align-items: center;
	min-width: 1.2rem;
	min-height: 1.2rem;
	width: 1.2rem;
	height: 1.2rem;
	background-color: rgb(255, 255, 0);
	color: black;
	font-family: monospace;
	border-radius: 20px;
	margin-right: 0.5rem;
}

</style>
