<script setup lang="ts">
import { ref } from 'vue';
import TutorialBtns from "./tutorial-btns.vue";
import { isTutorialMode } from './tutorial';
import { setIsMemAllocShow } from './refs';
import YoutubeLogo from "../assets/icons/youtube_logo.png";

const step = ref<number>(0);
const TOTAL_STEPS = 5;
let elementsZIdxs: Map<HTMLDivElement, string> = new Map;
let elementsOpacity: Map<any, any> = new Map;

enum Steps {
	Welcome = 0,
	Why,
	ToolBar,
	MemAllocBtn,
	MemAlloc,
	Final
}

function selectElements(...ids: Array<string>) {
	elementsZIdxs.clear();
	for(const id of ids) {
		const el = document.getElementById(id) as HTMLDivElement;
		const children = (el.parentElement as any).children;
		for(const child of children) {
			if(child !== el && !child.classList.contains("modal-container")) {
				elementsOpacity.set(child, child.style.opacity)
				child.style.opacity = 0.1;
			}
		}
		elementsZIdxs.set(el, el.style.zIndex);
		el.style.zIndex = "200";
	}
}

function initStep() {
	if(step.value === Steps.ToolBar) {
		selectElements("tool-bar-section");
	} else if(step.value === Steps.MemAllocBtn) {
		selectElements("btn-container", "mem-alloc-btn");
	} else if(step.value === Steps.MemAlloc) {
		setIsMemAllocShow(true);

		// hacky
		setTimeout(() => {
			selectElements("memory-alloc");
		}, 10)
	}
}

function uninitStep() {
	for(const [el, zidx] of elementsZIdxs.entries()) {
		el.style.zIndex = zidx;
	}

	for(const [el, o] of elementsOpacity.entries()) {
		el.style.opacity = o;
	}

	if(step.value === Steps.MemAlloc) {
		setIsMemAllocShow(false);
	}
}

function goNext() {
	uninitStep();

	step.value++;
	if(step.value > TOTAL_STEPS) {
		onSkipIntro();
		return;
	}

	initStep();
}

function onSkipIntro() {
	uninitStep();
	isTutorialMode.value = false;
}

</script>

<template>
<div class="modal-container" v-if="step === Steps.Welcome">
	<div class="modal">
		<h2>Hello!</h2>
		<div class="modal-content">Welcome to my interactive data structures and algorithms visualization.</div>
		<a class="youtube-logo-container" href="https://youtu.be/VzPrvCWdJyM" target="_blank">
			<div><img :src="YoutubeLogo" /></div>
			<div>Check out the youtube video presentation on this project here</div>
		</a>
		<TutorialBtns :on-continue="goNext" :on-skip-intro="onSkipIntro" :step="step" :total-steps="TOTAL_STEPS" />
	</div>
</div>

<div class="modal-container" v-else-if="step === Steps.Why">
	<div class="modal">
		<h2>What makes this different?</h2>
		<div class="modal-content">
			The main thing which make this standout from other DSA visualization projects is the presence of 
			the interactive heap allocation state visualization of the elements you see on the screen.
		</div>
		<TutorialBtns :on-continue="goNext" :on-skip-intro="onSkipIntro" :step="step" :total-steps="TOTAL_STEPS" />
	</div>
</div>

<div class="modal-container top-bar" v-else-if="step === Steps.ToolBar">
	<div class="modal">
		<h2>Tool bar</h2>
		<div class="modal-content">
			The tool bar contains all the data structures which you can choose and place on the screen.
		</div>
		<TutorialBtns :on-continue="goNext" :on-skip-intro="onSkipIntro" :step="step" :total-steps="TOTAL_STEPS" />
	</div>
</div>

<div class="modal-container mem-alloc-btn" v-else-if="step === Steps.MemAllocBtn">
	<div class="modal">
		<h2>Memory Allocation</h2>
		<div class="modal-content">
			This is the fun stuff...
		</div>
		<TutorialBtns :on-continue="goNext" :on-skip-intro="onSkipIntro" :step="step" :total-steps="TOTAL_STEPS" />
	</div>
</div>

<div class="modal-container mem-alloc" v-else-if="step === Steps.MemAlloc">
	<div class="modal">
		<h2>Memory Allocation</h2>
		<div class="modal-content">
			This is the dynamic heap memory allocation state which gets updated when you place a element on the screen from the tool bar.
		</div>
		<TutorialBtns :on-continue="goNext" :on-skip-intro="onSkipIntro" :step="step" :total-steps="TOTAL_STEPS" />
	</div>
</div>

<div class="modal-container" v-else-if="step === Steps.Final">
	<div class="modal">
		<h2>That's it!</h2>
		<div class="modal-content">
			Now you know the basics of the project. You're now good to go to visualize.
		</div>
		<TutorialBtns :on-continue="goNext" :on-skip-intro="onSkipIntro" :step="step" :total-steps="TOTAL_STEPS" />
	</div>
</div>

</template>

<style scoped>
@import "@css/common.css";

.modal-container{
	display: flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.8);
	z-index: 1000;
}

.modal{
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background-color: rgb(23, 23, 23);
	border-radius: 4px;
	padding: 1rem;
	color: white;
	max-width: 60%;
	border: 1px solid rgb(80, 80, 80);
}

.modal h2{
	font-size: 1.75rem;
	margin-bottom: 1rem;
	font-family: monospace;
	color: #ff0055;
}

.modal-content{
	text-align: center;
	font-size: 1rem;
	font-family: monospace;
	margin-bottom: 2rem;
	width: 100%;
}

.top-bar, .mem-alloc-btn, .mem-alloc{
	z-index: 100;
}

.top-bar .modal{
	position: absolute;
	top: 4rem;
}

.mem-alloc-btn .modal {
	position: absolute;
	left: 1%;
	top: 6rem;
}

.mem-alloc .modal {
	position: absolute;
	bottom: 45%;
}

.youtube-logo-container{
	display: flex;
	flex-direction: row;
	align-items: center;
	width: 100%;
	max-width: max-content;
	font-family: monospace;
	border: 2px solid red;
	border-radius: 6px;
	padding: 0.5rem;
	margin-bottom: 1rem;
	cursor: pointer;
	user-select: none;
	transition: all 0.2s;
	color: white;
	text-decoration: none;
	box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
	background-color: rgba(255, 0, 0, 0.2);
}

.youtube-logo-container:hover{
	background-color: rgba(255, 0, 0, 0.3);
	box-shadow: 0 0 15px rgba(255, 0, 0, 0.8);
}

.youtube-logo-container > div{
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
}

.youtube-logo-container > div:first-child{
	margin-right: 1rem;
}

.youtube-logo-container div img{
	width: 3rem;
	height: 3rem;
	object-fit: contain;
}

@media (max-width: 600px) {
	.modal{
		min-width: 96%;
	}

	.modal h2{
		font-size: 1.5rem;
	}

	.modal-content{
		font-size: 0.8rem;
	}
}

</style>
