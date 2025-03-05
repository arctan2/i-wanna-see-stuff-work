<script lang="ts" setup>
import SwitchBtn from "./switch-btn.vue";

const props = defineProps<{
	offText: string;
	onText: string;
	onClick: () => void
	state: boolean
}>()

</script>

<template>
	<div class="mode-container">
		<div :style="{ color: !props.state ? 'white' : '#444444' }">{{ props.offText }}</div>
		<SwitchBtn :onClick="props.onClick" :state="props.state" />
		<div :style="{ color: props.state ? 'white' : '#444444' }">{{ props.onText }}</div>
	</div>
</template>

<style scoped>

.mode-container{
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-around;
	font-family: monospace;
	padding: 0.3rem;
	color: white;
}


</style>
