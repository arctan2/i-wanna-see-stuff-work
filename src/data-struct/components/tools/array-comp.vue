<script setup lang="ts">

import { ref } from 'vue';
import { ElementArrayBuf } from '../../array/el-array';
import { playground } from '../../handler/playground-handler';
import { useFocusedElement, unfocusElement } from '../../global';
import { ValidatorObj } from './util';
import InsertArrayBuf from "../../array/insert-array";
import DeleteArrayBuf from "../../array/delete-array";
import { algorithmState } from '../refs';
import { randInt } from '../../utils';
import Select from '../../../common-components/select.vue';

import BubbleSort from '../../array/sorting/bubble-sort';
import InsertionSort from '../../array/sorting/insertion-sort';
import QuickSort from '../../array/sorting/quick-sort';
import MergeSort from '../../array/sorting/merge-sort';
import SelectionSort from '../../array/sorting/selection-sort';

const focusedElement = useFocusedElement<ElementArrayBuf>();
const toInsertKey = ref<number | "">("");
const toInsertPosition = ref<number | "">("");
const errMsg = ref<string>("");

enum Sorters {
	BubbleSort = "Bubble Sort",
	InsertionSort = "Insertion Sort",
	MergeSort = "Merge Sort",
	QuickSort = "Quick Sort",
	SelectionSort = "Selection Sort"
}

const from = ref<number | "">(10);
const to = ref<number | "">(100);
const step = ref<number | "">(10);
const isRandomize = ref<boolean>(false);
const inserterState: {arr: ElementArrayBuf | null, curKey: number, insertedKeys: Set<number>} = {
	arr: null,
	curKey: 0,
	insertedKeys: new Set
}
const curSorter = ref<string>(Sorters.BubbleSort);

function validateInputs() {
	const validatorObjects = [
		new ValidatorObj(toInsertKey, -999999, 999999),
	];

	for(const o of validatorObjects) {
		o.validate();
	}
}

function insertKey() {
	errMsg.value = "";

	if(toInsertKey.value === "" || toInsertPosition.value === "") {
		return;
	}

	validateInputs();

	if(Number.isNaN(Number(toInsertPosition.value))) {
		errMsg.value = "Invalid index";
		return;
	}

	if(focusedElement.value.arr.v.arr.length === focusedElement.value.arr.v.cap) {
		errMsg.value = "Array is full";
		return;
	}

	if(toInsertPosition.value > focusedElement.value.arr.v.arr.length || toInsertPosition.value < 0) {
		errMsg.value = "Index out of bounds";
		return;
	}

	InsertArrayBuf.init(playground.canvas, focusedElement.value, toInsertPosition.value, toInsertKey.value);
	algorithmState.setAlgorithm(InsertArrayBuf);
	InsertArrayBuf.tryPlay(playground.canvas);

	unfocusElement();
}

function deleteKey() {
	DeleteArrayBuf.init(playground.canvas, focusedElement.value, focusedElement.value.selectedCellIdx.value);
	algorithmState.setAlgorithm(DeleteArrayBuf);
	DeleteArrayBuf.tryPlay(playground.canvas);

	unfocusElement();
}

async function iter() {
	if(from.value === "" || to.value === "" || step.value === "") return;

	if(step.value === 0) {
		step.value = from.value <= to.value ? 1 : -1;
	} 

	if(inserterState.arr === null) {
		return;
	}

	if((step.value > 0 && inserterState.curKey >= to.value) || (step.value < 0 && inserterState.curKey <= to.value)) {
		InsertArrayBuf.forceStop(playground.canvas);
		return;
	}

	if(inserterState.arr.arr.v.arr.length === inserterState.arr.arr.v.cap) return;

	if(isRandomize.value) {
		while(true) {
			const v = randInt(from.value, to.value);
			if(inserterState.insertedKeys.has(v)) continue;
			inserterState.insertedKeys.add(v);
			InsertArrayBuf.init(playground.canvas, inserterState.arr, inserterState.arr.arr.v.arr.length, v, iter);
			break;
		}
	} else {
		InsertArrayBuf.init(playground.canvas, inserterState.arr, inserterState.arr.arr.v.arr.length, inserterState.curKey, iter);
	}

	algorithmState.setAlgorithm(InsertArrayBuf);
	InsertArrayBuf.tryPlay(playground.canvas);

	inserterState.curKey += step.value;
}

function iterInsert() {
	if(from.value === "" || to.value === "" || step.value === "") return;
	if(isRandomize.value) {
		inserterState.insertedKeys = new Set();
	}

	inserterState.curKey = from.value;
	inserterState.arr = focusedElement.value;
	iter();
	unfocusElement();
}

function setCurSorter(s: string) {
	curSorter.value = s;
}

function sort() {
	const sorterMap: {[_:string]: any} = {
		[Sorters.BubbleSort]: BubbleSort,
		[Sorters.InsertionSort]: InsertionSort,
		[Sorters.MergeSort]: MergeSort,
		[Sorters.QuickSort]: QuickSort,
		[Sorters.SelectionSort]: SelectionSort,
	}
	const sorter = sorterMap[curSorter.value];

	sorter.init(playground.canvas, focusedElement.value);
	algorithmState.setAlgorithm(sorter);
	sorter.tryPlay(playground.canvas);
	unfocusElement();
}

function freeArray() {
	const arr = focusedElement.value;
	unfocusElement();
	arr.remove(playground.canvas);
	playground.canvas.redraw();
}

</script>

<template>
<div class="tool-array">
	<h1>LL-Node</h1>
	<div class="sub-sections-container">
		<div class="input-section">
			<h2>Insert</h2>
			<input spellcheck="false" placeholder="index" type="number" v-model="toInsertPosition" />
			<input spellcheck="false" placeholder="number" type="number" v-model="toInsertKey" />
			<div v-if="errMsg !== ''" class="err-msg">{{ errMsg }}</div>
			<button class="btn btn-nobg" @click="insertKey()">insert</button>
		</div>

		<div class="insert-keys">
			<h2>Insert Iter</h2>
			<div class="from-to">
				<div>
					<div>from</div>
					<div>to</div>
				</div>
				<div>
					<input
						@blur="validateInputs"
						spellcheck="false"
						placeholder="from"
						type="number"
						max="999999"
						min="-999999"
						v-model="from"
					/>
					<input
						@blur="validateInputs"
						spellcheck="false"
						placeholder="to"
						type="number"
						max="999999"
						min="-999999"
						v-model="to"
					/>
				</div>
			</div>

			<div>
				<span style="font-family: monospace;">step: </span>
				<input
					@blur="validateInputs"
					spellcheck="false"
					placeholder="step"
					type="number"
					max="999999"
					min="-999999"
					v-model="step"
				/>
			</div>

			<div class="checkbox-container">
				<input type="checkbox" v-model="isRandomize" />
				<label>Random</label>
			</div>

			<button class="btn btn-nobg clr-yellow" @click="iterInsert">iter</button>
		</div>

		<div>
			<button class="btn btn-nobg clr-orange" @click="focusedElement.shuffle(playground.canvas)">shuffle</button>
			<button class="btn btn-nobg clr-orange" @click="focusedElement.randomize(playground.canvas)">randomize</button>
			<button class="btn btn-nobg clr-orange" @click="focusedElement.randomFill(playground.canvas)">fill random</button>
		</div>

		<div>
			<Select
				:onChange="setCurSorter"
				:value="curSorter"
				:options="Sorters"
			/>
			<button class="btn btn-nobg clr-lblue" @click="sort">Sort</button>
		</div>

		<div class="buttons">
			<button class="btn btn-nobg clr-red" @click="freeArray">free</button>
			<button class="btn btn-nobg clr-red" @click="deleteKey" v-if="focusedElement.selectedCellIdx.value !== -1">
				delete
			</button>
		</div>
	</div>
</div>
</template>

<style scoped>
@import "@css/common.css";

.tool-array {
	color: white;
}

.tool-array > h1{
	margin-bottom: 1rem;
	font-size: 1.75rem;
}

.sub-sections-container > div{
	--bg: rgb(56, 48, 64);
}

.sub-sections-container > div h2 {
	font-size: 1.2rem;
	margin-bottom: 0.5rem;
}

.sub-sections-container > div button:not(:first-child), .sub-sections-container > div .checkbox-container:not(:first-child) {
	margin-top: 0.5rem;
}

.sub-sections-container > .buttons{
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 0.5rem 0.5rem;
}

.sub-sections-container > .buttons > button:not(:first-child){
	margin: 0;
}

input{
	margin: 0.5rem 0;
}

.err-msg{
	font-size: 0.9rem;
	color: rgb(255, 100, 100);
}

.from-to > div {
	display: flex;
	flex-direction: row;
	width: 100%;
	justify-content: space-around;
	font-family: monospace;
	margin-bottom: 0.3rem;
}

.from-to > div > * {
	max-width: 48%;
	min-width: 48%;
}

.from-to > div > div{
	text-align: center;
}

.checkbox-container{
	font-size: 0.9rem;
	min-width: 100%;
	justify-content: start;
}

</style>
