<script setup lang="ts">
import { Ref, ref } from 'vue';
import { playground } from '../../handler/playground-handler';
import { useFocusedElement, unfocusElement } from '../../global';
import { ElementBptreeNode } from '../../bptree/el-bptree-node';
import InsertBptree from "../../bptree/insert-bptree.ts"
import DeleteBptree from "../../bptree/delete-bptree.ts"
import SearchBptree from "../../bptree/search-bptree.ts"
import { algorithmState } from '../refs';
import { randInt } from '../../utils.ts';

const focusedElement = useFocusedElement<ElementBptreeNode>();
const toInsertKey = ref<number | "">("");
const toDeleteKey = ref<number | "">("");
const toSearchKey = ref<number | "">("");
const from = ref<number | "">(1);
const to = ref<number | "">(8);
const step = ref<number | "">(1);
const isRandomize = ref<boolean>(false);
const inserterState: {node: ElementBptreeNode | null, curKey: number, insertedKeys: Set<number>} = {
	node: null,
	curKey: 0,
	insertedKeys: new Set
}

class ValidatorObj {
	obj: Ref<number | "">;
	min: number;
	max: number;

	constructor(obj: Ref<number | "">, min: number, max: number) {
		this.obj = obj;
		this.min = min;
		this.max = max;
	}
}

function validateInputs() {
	const validatorObjects = [
		new ValidatorObj(toInsertKey, -999999, 999999),
		new ValidatorObj(from, -999999, 999999),
		new ValidatorObj(to, -999999, 999999),
		new ValidatorObj(step, -100, 100),
		new ValidatorObj(toDeleteKey, -999999, 999999),
		new ValidatorObj(toSearchKey, -999999, 999999),
	];

	for(const { obj, min, max } of validatorObjects) {
		if(obj.value !== "") {
			if(Number(obj.value) <= min) {
				obj.value = min;
			}

			if(Number(obj.value) >= max) {
				obj.value = max;
			}

			obj.value = Math.floor(obj.value);
		}
	}
}

function insertKey() {
	if(toInsertKey.value === "") {
		return;
	}

	InsertBptree.init(playground.canvas, focusedElement.value, toInsertKey.value);
	algorithmState.setAlgorithm(InsertBptree);
	InsertBptree.tryPlay(playground.canvas);

	unfocusElement();
}

function deleteKey() {
	if(toDeleteKey.value === "") {
		return;
	}

	DeleteBptree.init(playground.canvas, focusedElement.value, toDeleteKey.value);
	algorithmState.setAlgorithm(DeleteBptree);
	DeleteBptree.tryPlay(playground.canvas);

	unfocusElement();
}

function searchKey() {
	if(toSearchKey.value === "") {
		return;
	}

	SearchBptree.init(playground.canvas, focusedElement.value, toSearchKey.value);
	algorithmState.setAlgorithm(SearchBptree);
	SearchBptree.tryPlay(playground.canvas);

	unfocusElement();
}

async function iter() {
	if(from.value === "" || to.value === "" || step.value === "") return;

	while(inserterState.node!.parentNode !== null) {
		inserterState.node = inserterState.node!.parentNode;
	}

	if(inserterState.node === null) {
		return;
	}

	if(inserterState.curKey >= to.value) {
		InsertBptree.forceStop(playground.canvas);
		return;
	}

	if(isRandomize.value) {
		while(true) {
			const v = randInt(from.value, to.value);
			if(inserterState.insertedKeys.has(v)) continue;
			inserterState.insertedKeys.add(v);
			InsertBptree.init(playground.canvas, inserterState.node, v, iter);
			break;
		}
	} else {
		InsertBptree.init(playground.canvas, inserterState.node, inserterState.curKey, iter);
	}

	algorithmState.setAlgorithm(InsertBptree);
	InsertBptree.tryPlay(playground.canvas);

	inserterState.curKey += step.value;
}

function iterInsert() {
	if(from.value === "" || to.value === "" || step.value === "") return;
	if(isRandomize.value) {
		inserterState.insertedKeys = new Set();
	}

	inserterState.curKey = from.value;
	inserterState.node = focusedElement.value;
	iter();
	unfocusElement();
}

</script>

<template>
<div class="tool-btree-node">
	<h1>B+ tree Node</h1>

	<div class="sub-sections-container scroll-bar">
		<div>
			<button class="btn btn-nobg clr-lblue" @click="focusedElement.rearrangeTree(playground.canvas)">rearrange</button>
		</div>
		<template v-if="focusedElement.parentNode === null">
		<div class="insert-key">
			<h2>Insert Key</h2>
			<input
				@blur="validateInputs"
				spellcheck="false"
				placeholder="key"
				type="number"
				max="999999"
				min="-999999"
				v-model="toInsertKey"
				style="width: 100%;"
			/>
			<button class="btn btn-nobg clr-green" @click="insertKey()">insert</button>
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

			<button class="btn btn-nobg clr-yellow" @click="iterInsert()">iter</button>
		</div>

		<div class="delete-key">
			<h2>Delete Key</h2>
			<input
				@blur="validateInputs"
				spellcheck="false"
				placeholder="key"
				type="number"
				max="999999"
				min="-999999"
				v-model="toDeleteKey"
				style="width: 100%;"
			/>
			<button class="btn btn-nobg clr-red" @click="deleteKey()">delete</button>
		</div>

		<div class="search-key">
			<h2>Search Key</h2>
			<input
				@blur="validateInputs"
				spellcheck="false"
				placeholder="key"
				type="number"
				max="999999"
				min="-999999"
				v-model="toSearchKey"
				style="width: 100%;"
			/>
			<button class="btn btn-nobg clr-lblue" @click="searchKey()">search</button>
		</div>

		</template>
	</div>
</div>
</template>

<style scoped>
@import "@css/common.css";

.tool-btree-node {
	color: white;
}

.tool-btree-node > h1{
	margin-bottom: 1rem;
	font-size: 1.75rem;
}

.sub-sections-container {
	height: 25rem;
	overflow-y: scroll;
}

.sub-sections-container > div{
	--bg: rgb(48, 64, 50);
}

.buttons{
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 0.5rem 0.5rem;
}

.buttons button{
	min-width: 4.5rem;
}

.sub-sections-container > div button:not(:first-child) {
	margin-top: 0.5rem;
}

.sub-sections-container > div h2 {
	font-size: 1.2rem;
	margin-bottom: 0.5rem;
}

.from-to {
	display: flex;
	flex-direction: column;
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
	margin-top: 0.5rem;
}

</style>
