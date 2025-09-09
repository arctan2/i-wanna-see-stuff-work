<script setup lang="ts">
import { ToolBptreeNode } from "../../bptree/tool-bptree-node";
import { MAX_CHILDREN, ToolBtreeNode } from "../../btree/tool-btree-node";
import { curToolIdx, disappearingInfoPopUp, ToolList } from "../../global";

function validateInputs() {
	if(+MAX_CHILDREN.value <= 4) {
		MAX_CHILDREN.value = 4;
	}

	if(+MAX_CHILDREN.value >= 128) {
		MAX_CHILDREN.value = 128;
	}

	if(MAX_CHILDREN.value % 2 !== 0) {
		disappearingInfoPopUp(`M should be a even number. So changing M from ${MAX_CHILDREN.value} to ${MAX_CHILDREN.value + 1}`, 5000);
		MAX_CHILDREN.value += 1;
	}

	input();
}

function input() {
	if(MAX_CHILDREN.value >= 4 && MAX_CHILDREN.value < 128) {
		MAX_CHILDREN.value = Math.floor(MAX_CHILDREN.value);
		ToolBtreeNode.setTool(MAX_CHILDREN.value);
		ToolBptreeNode.setTool(MAX_CHILDREN.value);
	}
}

</script>

<template>
	<div v-if="ToolList[curToolIdx]?.name === 'btree' || ToolList[curToolIdx]?.name === 'b+tree'" class="btree-node floating-panel">
		<span>M: </span>
		<input
			@focusout="validateInputs"
			@input="input"
			type="number"
			step="2"
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
