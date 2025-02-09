<script setup lang="ts">
import { ref, shallowReactive, watch } from 'vue';
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
const inserterState = shallowReactive<{node: ElementBtreeNode | null, curKey: number}>({
	node: null,
	curKey: 0
})

function validateInputs() {
	if(toInsertKey.value === "") {
		return;
	}

	if(+toInsertKey.value <= -999999) {
		toInsertKey.value = -999999;
		input();
	}

	if(+toInsertKey.value >= 999999) {
		toInsertKey.value = 999999;
		input();
	}
}

function input() {
	if(toInsertKey.value === "") {
		return;
	}
	if(toInsertKey.value >= -999999 && toInsertKey.value < 999999) {
		toInsertKey.value = Math.floor(toInsertKey.value);
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

watch(algorithmState, (state) => {
	if(!state.isDone) {
		return;
	}

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
	InsertBtree.play(playground.canvas);
});

function iterInsert() {
	inserterState.curKey = from.value;
	inserterState.node = focusedElement.value;

	InsertBtree.init(focusedElement.value, inserterState.curKey);
	algorithmState.setAlgorithm(InsertBtree);
	InsertBtree.play(playground.canvas);
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
				@input="input"
				spellcheck="false"
				placeholder="key"
				type="number"
				max="999999"
				min="-999999"
				v-model="toInsertKey"
			/>
			<button class="btn btn-nobg" @click="insertKey()">insert</button>
		</div>

		<div class="insert-key">
			<h2>Insert Keys</h2>
			<div>
				<span>from: </span>
				<input
					@blur="validateInputs"
					@input="from = Math.floor(from)"
					spellcheck="false"
					placeholder="key"
					type="number"
					max="999999"
					min="-999999"
					v-model="from"
				/>
			</div>
			<div>
				<span>to: </span>
				<input
					@blur="validateInputs"
					@input="to = Math.floor(to)"
					spellcheck="false"
					placeholder="key"
					type="number"
					max="999999"
					min="-999999"
					v-model="to"
				/>
			</div>

			<div>
				<span>step: </span>
				<input
					@blur="validateInputs"
					@input="step = Math.floor(step)"
					spellcheck="false"
					placeholder="key"
					type="number"
					max="999999"
					min="-999999"
					v-model="step"
				/>
			</div>
			<button class="btn btn-nobg" @click="iterInsert()">insert</button>
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
	--bg: rgb(56, 48, 64);
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

.insert-key button{
	margin-top: 0.5rem;
}

.insert-key h2{
	font-size: 1.2rem;
	margin-bottom: 0.5rem;
}

</style>
