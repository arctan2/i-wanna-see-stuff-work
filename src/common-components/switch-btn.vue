<script lang="ts" setup>
const props = defineProps<{
	onClick: () => void
	state: boolean
}>()

</script>

<template>
	<div :class="['switch', props.state ? 'on' : 'off']" @click="props.onClick"></div>
</template>

<style scoped>
.switch{
	width: 2rem;
	height: 1rem;
	border-radius: 50px;
	margin: 0 0.5rem;
	cursor: pointer;
}

.switch.on{
	background-color: rgb(40, 40, 40);
}

.switch.off{
	background-color: rgb(40, 40, 40);
}

.switch::before{
	content: "";
	display: block;
	width: 1rem;
	height: 100%;
	background-color: white;
	border-radius: 7px;
	transition: transform 0.2s;
}

.switch.on::before{
	transform: translateX(100%);
}

</style>
