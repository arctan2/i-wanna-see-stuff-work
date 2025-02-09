<script setup lang="ts">

import { ref } from 'vue';
import { ElementLLNode } from '../../linked-list/el-node';
import { playground } from '../../handler/playground-handler';
import { useFocusedElement, unfocusElement } from '../../global';

const focusedElement = useFocusedElement<ElementLLNode>();
const toFindValue = ref('');

function setNodeValue(value: string) {
	focusedElement.value.value.v.setStr(value);
	focusedElement.value.draw(playground.canvas.ctx);
}

function deleteNode() {
	const el = focusedElement.value;
	unfocusElement();
	el.deleteLLNode(playground.canvas);
}

async function next() {
	if(focusedElement.value === null) return;
	if(focusedElement.value.next === null) {
		unfocusElement();
		playground.canvas.redraw();
		return;
	}
	focusedElement.value = focusedElement.value.next;
	await focusedElement.value.scrollTo(playground.canvas);
	playground.canvas.redraw();
}

function deleteAll() {
	const el = focusedElement.value;
	unfocusElement();
	el.deleteAllReachable(playground.canvas);
}

function find() {
	const el = focusedElement.value;
	unfocusElement();
	el.find(toFindValue.value, playground.canvas);
}

</script>

<template>
<div class="tool-node">
	<h1>LL-Node</h1>
	<div class="sub-sections-container">
		<div>
			<input
				placeholder="value"
				type="text"
				spellcheck="false"
				:value="focusedElement.value.v.chars"
				@input="setNodeValue(($event.target as any).value)"
			/>
		</div>

		<div class="buttons">
			<button class="btn btn-nobg clr-red" @click="deleteNode()">delete</button>
			<button class="btn btn-nobg clr-red" @click="deleteAll()">delete all</button>
			<button class="btn btn-nobg clr-lblue" @click="next()">next</button>
		</div>

		<div class="find">
			<h2>Find node</h2>
			<input spellcheck="false" placeholder="value" type="text" v-model="toFindValue" />
			<button class="btn btn-nobg" @click="find()">find</button>
		</div>
	</div>
</div>
</template>

<style scoped>
@import "@css/common.css";

.tool-node {
	color: white;
}

.tool-node > h1{
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

.find button{
	margin-top: 0.5rem;
}

.find h2{
	font-size: 1.2rem;
	margin-bottom: 0.5rem;
}

</style>
