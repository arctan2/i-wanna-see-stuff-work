<script setup lang="ts">
import { MAX_CHILDREN, ToolBtreeNode } from "../btree/tool-btree-node";
import { curToolIdx, ToolList } from "../global";

function validateInputs() {
	if(+MAX_CHILDREN.value <= 4) {
		MAX_CHILDREN.value = 4;
		input();
	}

	if(+MAX_CHILDREN.value >= 128) {
		MAX_CHILDREN.value = 128;
		input();
	}
}

function input() {
	if(MAX_CHILDREN.value >= 4 && MAX_CHILDREN.value < 128) {
		MAX_CHILDREN.value = Math.floor(MAX_CHILDREN.value);
		ToolBtreeNode.setTool();
	}
}

</script>

<template>
	<div v-if="ToolList[curToolIdx]?.name === 'btree-node'" class="btree-node floating-panel">
		<span>M: </span>
		<input
			@focusout="validateInputs"
			@input="input"
			type="number"
			min="4"
			max="128"
			v-model="MAX_CHILDREN"
		/>
	</div>
</template>

<style scoped>
@import "@css/common.css";

.btree-node{
	position: absolute;
	top: 14%;
	left: 50%;
	transform: translateX(-50%);
	padding: 0.5rem;
	border: 2px solid #0095ff;
	z-index: 10;
}

input{
	width: 4rem;
}
</style>
