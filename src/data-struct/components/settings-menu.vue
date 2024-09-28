<script setup lang="ts">
import { showToolBar, isMenuOpen, setIsMenuOpen, setIsMemAllocShow, isMemAllocShow, isSelectedItemShow, setIsSelectedItemShow } from "./refs";
import { playground } from "../handler/playground-handler";
import { setDelay, DELAY, focusedElement, isRetainTool } from "../global";
import Range from "../../common-components/range.vue";
import ToolIcon from "../assets/icons/spawner.svg";
import RamIcon from "../assets/icons/ram.svg";
import { componentMap } from "./tool-component-map";
import { sampleDBTree, sampleDGraph, sampleLinkedList, sampleUEdgeMatrix, sampleUGraph } from "./samples";
import Select from "../../common-components/select.vue";
import { computed, ref, watch } from "vue";

const exampleMap = {
	ll: "Linked List",
	graph: "Graph",
	tree: "BTree"
};
const isDisplayGrid = ref<boolean>(false);
const curExample = ref(exampleMap.ll);
const rows = ref(3);
const cols = ref(3);
const isDirected = ref<boolean>(false);
const isMatrixForm = ref<boolean>(false);
const isWeighted = ref<boolean>(false);
const exampleTypeCSSClass = computed(() => curExample.value === exampleMap.ll ? "clr-purple" : "clr-orange");

function createExample() {
	switch(curExample.value) {
		case exampleMap.ll:
		sampleLinkedList(playground.canvas, rows.value, cols.value);
		break;
		case exampleMap.graph:
		if(isDirected.value) {
			sampleDGraph(playground.canvas, rows.value, cols.value, isWeighted.value);
		} else {
			if(isMatrixForm.value) {
				sampleUEdgeMatrix(playground.canvas, rows.value, cols.value, isWeighted.value);
			} else {
				sampleUGraph(playground.canvas, rows.value, cols.value, isWeighted.value);
			}
		}
		break;
		case exampleMap.tree:
		sampleDBTree(playground.canvas, rows.value, isWeighted.value, isDirected.value);
		break;
	}
}

watch(isDisplayGrid, cur => {
	playground.canvas.setIsDisplayGrid(cur);
})

</script>

<template>
<div v-if="showToolBar" id="btn-container">
	<div id="menu-btn" @click.self="() => setIsMenuOpen(!isMenuOpen)">
		<div :class="['icon', isMenuOpen ? 'active' : '']">
			<div></div>
		</div>
		<section id="menu-section" class="floating-panel sub-sections-container" v-if="isMenuOpen">
			<div>
				<div class="checkbox-container">
					<input type="checkbox" v-model="isRetainTool" />
					<label>Retain tool</label>
				</div>

				<div class="checkbox-container">
					<input type="checkbox" v-model="isDisplayGrid" />
					<label>Show grid</label>
				</div>
			</div>

			<div>
				<span>Animation speed: </span>
				<Range :min="10" :dir="'rtl'" :max="1000" :step="1" :value="DELAY" class="speed"
					@input="(e: any) => setDelay(Number(e.target.value))"
				/>
			</div>

			<div class="examples">
				<div>Examples: </div>
				<div class="custom-select-container">
					<Select :options="exampleMap" :value="curExample" @change="v => curExample = v" />
				</div>
				<div class="input-rows" v-if="curExample !== exampleMap.tree">
					<div class="input-container">
						<span>Rows</span>
						<input placeholder="rows" type="number" v-model="rows" />
					</div>
					<div class="input-container">
						<span>Cols</span>
						<input placeholder="cols" type="number" v-model="cols" />
					</div>
				</div>

				<div v-if="curExample === exampleMap.graph">
					<div class="checkbox-container">
						<input type="checkbox" v-model="isDirected" />
						<label>directed</label>
					</div>
					<div class="checkbox-container">
						<input type="checkbox" v-model="isWeighted" />
						<label>weighted</label>
					</div>
					<div class="checkbox-container" v-if="!isDirected">
						<input type="checkbox" v-model="isMatrixForm" />
						<label>adj-matrix form</label>
					</div>
				</div>

				<div v-else-if="curExample === exampleMap.tree">
					<div class="input-container">
						<span>Depth</span>
						<input placeholder="depth" type="number" v-model="rows" />
					</div>
					<div class="checkbox-container">
						<input type="checkbox" v-model="isDirected" />
						<label>directed</label>
					</div>
					<div class="checkbox-container">
						<input type="checkbox" v-model="isWeighted" />
						<label>weighted</label>
					</div>
				</div>

				<button :class="['btn', 'btn-nobg', exampleTypeCSSClass]" @click="createExample">Create</button>
			</div>
		</section>
	</div>

	<div id="mem-alloc-btn" v-if="!isMemAllocShow" @click="setIsMemAllocShow(true)">
		<img :src="RamIcon" alt="">
	</div>

	<div
		id="selected-item-btn"
		v-if="!isSelectedItemShow && focusedElement.constructor.name in componentMap"
		@click="setIsSelectedItemShow(true)"
	>
		<img :src="ToolIcon" alt="">
	</div>
</div>

</template>

<style scoped>
@import "@css/common.css";

#btn-container{
	display: flex;
	flex-direction: column;
	position: absolute;
	top: 0.5rem;
	left: 0.5rem;
	--btn-size: 2rem;
	min-width: max-content;
	min-height: max-content;
	z-index: 15;
}

#btn-container > *{
	margin-bottom: 0.5rem;
	border-radius: 5px;
	cursor: pointer;
}

#menu-section{
	left: calc(var(--btn-size) + 0.2rem);
	padding: 0.5rem;
	width: 10rem;
	min-height: 20rem;
	cursor: default;
	font-size: 0.9rem;
	overflow: hidden;
}

#menu-section div {
	margin-bottom: 0.5rem;
}

.speed{
	margin-top: 0.5rem;
	width: max-content;
}

.icon.active{
	outline: 2px solid white;
	border-radius: 4px;
}

.icon{
	display: flex;
	justify-content: center;
	align-items: center;
	pointer-events: none;
	width: var(--btn-size);
	height: var(--btn-size);
	position: absolute;
}

.icon > div, .icon::before, .icon::after{
	position: absolute;
	width: 70%;
	height: 3px;
	background-color: white;
	border-radius: 5px;
}

.icon::before, .icon::after{
	content: "";
	display: block;
}

.icon::before{
	top: 26%;
}

.icon::after{
	bottom: 26%;
}

#mem-alloc-btn, #selected-item-btn, #menu-btn{
	min-width: var(--btn-size);
	min-height: var(--btn-size);
	width: var(--btn-size);
	height: var(--btn-size);
	background-color: #333333;
}

#mem-alloc-btn:hover, #selected-item-btn:hover, #menu-btn:hover{
	background-color: #555555;
}

#mem-alloc-btn img, #selected-item-btn img{
	width: 100%;
	height: 100%;
}

#mem-alloc-btn, #selected-item-btn{
	padding: 0.2rem;
}

.examples button{
	margin-bottom: 0.5rem;
	width: 100%;
	height: 1.5rem;
	font-size: 0.8rem;
}

.custom-select{
	width: 100%;
	margin: 0 0;
}

.input-rows{
	display: flex;
	flex-direction: column;
	align-items: center;
}

.input-container{
	width: 100%;
	display: flex;
	flex-direction: row;
	align-items: center;
}

.input-container span{
	display: inline-block;
	width: 3rem;
}

.input-container input[type="number"]{
	width: 3rem;
	height: 1.5rem;
	font-size: 0.9rem;
}

.checkbox-container{
	font-family: Arial, Helvetica, sans-serif;
	font-size: 0.9rem;
	min-width: 100%;
	justify-content: start;
}

</style>
