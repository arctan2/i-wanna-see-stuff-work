<script setup lang="ts">
import { CAP, ToolArrayBuf, MAX } from "../../array/tool-array";
import { curToolIdx, ToolList } from "../../global";

function validateInputs() {
	if(+CAP.value <= 1) {
		CAP.value = 1;
	}

	if(+CAP.value >= MAX) {
		CAP.value = MAX;
	}

	input();
}

function input() {
	if(1 <= CAP.value && CAP.value < MAX) {
		CAP.value = Math.floor(CAP.value);
		ToolArrayBuf.setTool(CAP.value);
	}
}

</script>

<template>
	<div v-if="ToolList[curToolIdx]?.name === 'array'" class="btree-array floating-panel">
		<span>Capacity: </span>
		<input
			@focusout="validateInputs"
			@input="input"
			type="number"
			step="1"
			min="1"
			:max="MAX"
			v-model="CAP"
		/>
	</div>
</template>

<style scoped>
@import "@css/common.css";

.btree-array{
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
