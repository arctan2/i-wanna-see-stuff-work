<script setup lang="ts">
import { Ref, ref } from 'vue';
import { playground } from '../../handler/playground-handler';
import { useFocusedElement, unfocusElement } from '../../global';
import { ElementBtreeNode } from '../../btree/el-btree-node';
import InsertBtree from "../../btree/insert-btree.ts"
import { algorithmState } from '../refs';

const focusedElement = useFocusedElement<ElementBtreeNode>();
const toInsertKey = ref<number | "">("");
const from = ref<number>(1);
const to = ref<number>(8);
const step = ref<number>(1);
const inserterState: {node: ElementBtreeNode | null, curKey: number} = {
	node: null,
	curKey: 0
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
		new ValidatorObj(step, -100, 100)
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

	InsertBtree.init(focusedElement.value, toInsertKey.value);
	algorithmState.setAlgorithm(InsertBtree);
	InsertBtree.play(playground.canvas);
	unfocusElement();
}

function iter() {
	if(inserterState.curKey >= to.value) {
		algorithmState.forceStopAlgorithm();
		return;
	}

	while(inserterState.node!.parentNode !== null) {
		inserterState.node = inserterState.node!.parentNode;
	}

	inserterState.curKey += step.value;

	if(inserterState.node === null) {
		return;
	}

	InsertBtree.init(inserterState.node, inserterState.curKey);
	algorithmState.setAlgorithm(InsertBtree);
	InsertBtree.play(playground.canvas, iter);
}

function iterInsert() {
	inserterState.curKey = from.value;
	inserterState.node = focusedElement.value;

	InsertBtree.init(focusedElement.value, inserterState.curKey);
	algorithmState.setAlgorithm(InsertBtree);
	InsertBtree.play(playground.canvas, iter);
	unfocusElement();
}

</script>

<template v-if="focusedElement.parentNode === null">
<div class="tool-btree-node">
	<h1>B-tree Node</h1>
	<div class="sub-sections-container">
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
						placeholder="key"
						type="number"
						max="999999"
						min="-999999"
						v-model="from"
					/>
					<input
						@blur="validateInputs"
						spellcheck="false"
						placeholder="key"
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
					placeholder="key"
					type="number"
					max="999999"
					min="-999999"
					v-model="step"
				/>
			</div>
			<button class="btn btn-nobg clr-yellow" @click="iterInsert()">iter</button>
		</div>
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

.sub-sections-container > div{
	--bg: rgb(48, 58, 64);
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

.insert-key button, .insert-keys button {
	margin-top: 0.5rem;
}

.insert-key h2, .insert-keys h2{
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

</style>
