<script setup lang="ts">
import { disablePointerEvents, ToolList, curToolIdx } from "../global";
import { playground } from "../handler/playground-handler";
import { showToolBar } from "./refs";

</script>

<template>
<section
	v-if="showToolBar"
	id="tool-bar-section"
	:class="['floating-panel', 'scroll-bar', disablePointerEvents ? 'pointer-events-none' : '']"
>
	<div class="tools-list">
		<div
			v-for="(tool, idx) in ToolList"
			@click="playground.setTool(idx === curToolIdx ? -1 : idx)"
			:class="[idx === curToolIdx ? 'selected' : '']"
		>
			<component :is="tool.icon" :class="[idx === curToolIdx ? 'selected' : '']"></component>
		</div>
	</div>
</section>
</template>

<style scoped>
@import "@css/common.css";

#tool-bar-section{
	position: absolute;
	width: 100%;
	height: 2.5rem;
	max-width: 50%;
	min-width: 2rem;
	padding: 0.3rem;
	top: 0.5rem;
	left: 50%;
	transform: translateX(-50%);
	z-index: 10;
	overflow-x: auto;
	overflow-y: hidden;
}

.scroll-bar::-webkit-scrollbar{
	height: 5px;
}

.tools-list{
	display: flex;
	width: 100%;
	height: 100%;
}

.tools-list div{
	height: 100%;
	color: black;
	cursor: pointer;
	min-width: 3rem;
	padding: 0.2rem;
	border-radius: 4px;
}

.tools-list div:hover{
	background-color: rgba(80, 80, 80);
	transition: background-color 0.3s;
}

.tools-list div > *{
	width: 100%;
	height: 100%;
	--stroke-clr: #444444;
	pointer-events: none;
}

.tools-list div.selected{
	background-color: #eeeeee;
}

</style>
