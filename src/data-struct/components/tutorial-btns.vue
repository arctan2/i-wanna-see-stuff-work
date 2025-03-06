<script setup lang="ts">
const props = defineProps<{
	onContinue: () => void,
	onSkipIntro: () => void,
	step: number,
	totalSteps: number
}>();

</script>

<template>
	<div class="modal-btns">
		<button class="btn skip-intro" @click="props.onSkipIntro">skip intro</button>
		<button class="btn btn-nobg clr-green continue" @click="props.onContinue">
			<pre>{{props.step}}/{{props.totalSteps}} </pre>
			continue
			<i class="arrow"></i>
		</button>
	</div>
</template>

<style scoped>
.modal-btns{
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	width: 100%;
}

.skip-intro{
	background: none;
	color: #00a6ff;
	position: relative;
}

.continue{
	display: inline-flex;
	flex-direction: row;
	align-items: center;
	position: relative;
}

.continue:hover .arrow {
	border: solid black;
	border-width: 0 4px 4px 0;
}

.arrow {
	border: solid #00ff6e;
	border-width: 0 4px 4px 0;
	display: inline-block;
	padding: 4px;
	transform: rotate(-45deg);
	margin-left: 0.2rem;
	transition: all 0.2s;
}
</style>
