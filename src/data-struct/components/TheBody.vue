<script lang="ts" setup>
import ToolBarSection from "./tool-bar.vue";
import PlaygroundSection from "./playground-section.vue";
import SelectedItem from "./selected-item.vue";
import SettingsMenu from "./settings-menu.vue";
import Algorithm from "./algorithm.vue";
import MemoryAlloc from "./memory-alloc/memory-alloc.vue";
import Tutorial from "./tutorial.vue";
import { isMemAllocShow } from "./refs";
import { isTutorialMode } from "./tutorial";

</script>

<template>
<div id="pg-body">
	<ToolBarSection />
	<MemoryAlloc v-if="isMemAllocShow" />
	<SettingsMenu />
	<SelectedItem />
	<PlaygroundSection />
	<Algorithm />
	<Tutorial v-if="isTutorialMode" />
</div>
</template>

<style scoped>
#pg-body{
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: row;
	position: relative;
	align-items: center;
	justify-content: center;
}

</style>
