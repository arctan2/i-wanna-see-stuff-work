<script lang="ts" setup>
import { computed } from "vue";
import { focusedElement, disablePointerEvents } from "../global";

import { isSelectedItemShow, setIsSelectedItemShow } from "./refs";
import { componentMap } from "./tool-component-map";

const className = computed(() => {
	return ['selected-item floating-panel scroll-bar', disablePointerEvents.value ? 'pointer-events-none' : '']
});

</script>

<template>
<div :class="className" v-if="focusedElement.constructor.name in componentMap && isSelectedItemShow">
	<div id="pane-btns">
		<div style="" class="close-btn" @click="setIsSelectedItemShow(false)">x</div>
	</div>
	<component :is="componentMap[focusedElement.constructor.name]"></component>
</div>
</template>

<style scoped>
@import "@css/common.css";

.selected-item{
	left: 1%;
	top: 15%;
	z-index: 20;
	width: 12rem;
	height: 80%;
	max-height: 30rem;
	overflow: auto;
	padding: 0.5rem;
	padding-top: 1rem;
	font-family: Arial, Helvetica, sans-serif;
}

#pane-btns{
	position: absolute;
	right: 0;
	top: 0;
	transform: translateY(0);
}
</style>
