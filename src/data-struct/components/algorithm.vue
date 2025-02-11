<script lang="ts" setup>
import { algorithmState } from "./refs";
import { disablePointerEvents, isAutoplay } from "../global";
import { ref, watch } from "vue";
import { playground } from "../handler/playground-handler";
import { setDelay, DELAY } from "../global";
import Range from "../../common-components/range.vue";

import Dfs from "../graph/algorithms/dfs";
import DfsComp from "../graph/algorithms/components/dfs.vue";

import Bfs from "../graph/algorithms/bfs";
import BfsComp from "../graph/algorithms/components/bfs.vue";

import Dijkstra from "../graph/algorithms/dijkstra";
import DijkstraComp from "../graph/algorithms/components/dijkstra.vue";

import Prims from "../graph/algorithms/prims";
import PrimsComp from "../graph/algorithms/components/prims.vue";

import Kruskal from "../graph/algorithms/kruskal";
import KruskalComp from "../graph/algorithms/components/kruskal.vue";

import BellmanFord from "../graph/algorithms/bellman-ford";
import BellmanFordComp from "../graph/algorithms/components/bellman-ford.vue";

import Astar from "../graph/algorithms/astar";
import AstarComp from "../graph/algorithms/components/astar.vue";

import { DijkstraAdjMatrix, BfsAdjMatrix, DfsAdjMatrix, AstarAdjMatrix, Maze } from "../graph/algorithms/adjmatrix.ts";

import InsertBtree from "../btree/insert-btree.ts";

type ComponentMap = { [_:string]: any };

const componentMap: ComponentMap = {
	[Dfs.constructor.name]: DfsComp,
	[Bfs.constructor.name]: BfsComp,
	[Dijkstra.constructor.name]: DijkstraComp,
	[Prims.constructor.name]: PrimsComp,
	[Kruskal.constructor.name]: KruskalComp,
	[BellmanFord.constructor.name]: BellmanFordComp,
	[Astar.constructor.name]: AstarComp,
	[DijkstraAdjMatrix.constructor.name]: null,
	[BfsAdjMatrix.constructor.name]: null,
	[DfsAdjMatrix.constructor.name]: null,
	[AstarAdjMatrix.constructor.name]: null,
	[Maze.constructor.name]: null,
	[InsertBtree.constructor.name]: null,
};

const isPlaying = ref(isAutoplay.value);

function togglePlay() {
	isPlaying.value = !isPlaying.value;

	if(isPlaying.value) {
		algorithmState.alg?.play(playground.canvas);
	} else {
		algorithmState.alg?.pause();
	}
}

watch(algorithmState, (newVal) => {
	if(newVal.isDone) {
		isPlaying.value = isAutoplay.value;
	}
})

function stop() {
	algorithmState.alg?.forceStop(playground.canvas);
}

</script>

<template>
	<div
		:class="['play-pause-next-container', disablePointerEvents ? 'pointer-events-none' : '']"
		v-if="!algorithmState.isDone && algorithmState.alg && algorithmState.alg.constructor.name in componentMap"
	>
		<div class="stop-btn" @click="stop"></div>
		<div class="play-pause-btns">
			<button class="play-btn" v-if="!isPlaying" @click="togglePlay"></button>
			<button class="pause-btn" v-else @click="togglePlay"></button>
		</div>
		<button class="next-btn" :disabled="isPlaying" @click="algorithmState.alg.next(playground.canvas)">
			<div></div>
		</button>
		<div class="speed-container">
			<Range :min="10" :dir="'rtl'" :max="1000" :step="1" :value="DELAY"
				@input="(e: any) => setDelay(Number(e.target.value))"
			/>
		</div>
	</div>

	<component
		:class="[disablePointerEvents ? 'pointer-events-none' : '']"
		v-if="algorithmState.alg && algorithmState.alg.constructor.name in componentMap"
		:is="componentMap[algorithmState.alg.constructor.name]"
	></component>
</template>

<style scoped>
@import "@css/common.css";

*{
	--aqua: rgb(3, 252, 161);
	--element-height: 1.3rem;
}

.additional-info{
	position: absolute;
}

.play-pause-next-container{
	display: flex;
	width: max-content;
	height: max-content;
	position: absolute;
	top: 1%;
	background-color: #303030;
	border-radius: 4px;
	padding: 0.5rem;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
	z-index: 100;
}

.play-pause-next-container > *{
	margin-right: 1rem;
}

.stop-btn{
	width: var(--element-height);
	height: var(--element-height);
	background-color: red;
	border-radius: 4px;
	cursor: pointer;
}

.play-pause-btns{
	width: var(--element-height);
	height: var(--element-height);
	display: inline-block;
}

.play-pause-btns button{
	display: flex;
	position: relative;
	width: 100%;
	height: 100%;
	border: none;
	outline: none;
	cursor: pointer;
	border-radius: 2px;
}

.play-btn{
	background: var(--aqua);
	clip-path: polygon(100% 50%, 0% 0, 0% 100%);
}

.pause-btn{
	background-color: transparent;
}

.pause-btn::after, .pause-btn::before{
	content: "";
	background-color: var(--aqua);
	width: 20%;
	height: 100%;
	position: absolute;
}

.pause-btn::after{
	right: 10%;
}

.pause-btn::before{
	left: 10%;
}

.next-btn{
	--div-color: var(--aqua);
	width: var(--element-height);
	height: var(--element-height);
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	border: none;
	outline: none;
	cursor: pointer;
	background-color: transparent;
	padding: 0;
}

.next-btn > div{
	width: 100%;
	height: 100%;
	background: var(--div-color);
	-webkit-clip-path: polygon(40% 0, 100% 50%, 40% 100%, 0 100%, 60% 50%, 0 0);
	clip-path: polygon(40% 0, 100% 50%, 40% 100%, 0 100%, 60% 50%, 0 0);
	border-radius: 10px;
	transition: 0.5s all;
}

.next-btn:hover{
	background-color: transparent;
}

.next-btn:disabled{
	--div-color: grey;
	pointer-events: none;
}

.speed-container{
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.speed-container span{
	font-size: 0.8rem;
}
</style>
