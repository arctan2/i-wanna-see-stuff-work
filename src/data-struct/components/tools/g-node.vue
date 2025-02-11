<script setup lang="ts">
import { ElementGNode } from '../../graph/el-node';
import { playground } from '../../handler/playground-handler';
import { useFocusedElement, unfocusElement } from '../../global';
import Select from "../../../common-components/select.vue";
import { ref } from 'vue';
import { algorithmState } from '../refs';
import dfs from '../../graph/algorithms/dfs';
import bfs from '../../graph/algorithms/bfs';
import { setToolDijkstra } from '../../graph/tool-dijkstra';
import prims from '../../graph/algorithms/prims';
import kruskal from '../../graph/algorithms/kruskal';
import { setToolBellmanFord } from '../../graph/tool-bellman-ford';
import { Heuristics } from "../../graph/algorithms/heuristics";
import { setToolAstar } from '../../graph/tool-astar';
import astar from '../../graph/algorithms/astar';

enum GraphAlgorithms {
	Dfs = "Dfs",
	Bfs = "Bfs",
	Dijkstra = "Dijkstra",
	Prims = "Prims",
	Kruskal = "Kruskal",
	BellmanFord = "Bellman-Ford",
	Astar = "A*",
}

const focusedElement = useFocusedElement<ElementGNode>();

const currentAlg = ref(GraphAlgorithms.Astar);

const curHeuristics = ref(astar.curHeuristics);

function setNodeValue(value: string) {
	focusedElement.value.value.v.setStr(value);
	focusedElement.value.draw(playground.canvas.ctx);
}

async function deleteNode() {
	const el = focusedElement.value;
	unfocusElement();
	await el.deleteNode(playground.canvas);
	playground.canvas.redraw();
}

function onChange(value: GraphAlgorithms) {
	currentAlg.value = value;
}

function onChangeHeuristics(value: Heuristics) {
	curHeuristics.value = value;
}

function run() {
	switch(currentAlg.value) {
		case GraphAlgorithms.Dfs:
			dfs.init(playground.canvas, focusedElement.value);
			algorithmState.setAlgorithm(dfs);
			dfs.tryPlay(playground.canvas);
			break;
		case GraphAlgorithms.Bfs:
			bfs.init(playground.canvas, focusedElement.value);
			algorithmState.setAlgorithm(bfs);
			bfs.tryPlay(playground.canvas);
			break;
		case GraphAlgorithms.Dijkstra:
			setToolDijkstra(playground, focusedElement.value);
			break;
		case GraphAlgorithms.Prims:
			prims.init(playground.canvas, focusedElement.value);
			algorithmState.setAlgorithm(prims);
			prims.tryPlay(playground.canvas);
			break;
		case GraphAlgorithms.Kruskal:
			kruskal.init(playground.canvas, focusedElement.value);
			algorithmState.setAlgorithm(kruskal);
			kruskal.tryPlay(playground.canvas);
			break;
		case GraphAlgorithms.BellmanFord:
			setToolBellmanFord(playground, focusedElement.value);
			break;
		case GraphAlgorithms.Astar:
			setToolAstar(playground, focusedElement.value, curHeuristics.value);
			break;
	}

	unfocusElement();
	playground.canvas.redraw();
}

</script>

<template>
<div class="tool-node">
	<h1>Graph Node</h1>
	<div class="sub-sections-container">
		<div>
			<input
				placeholder="value"
				type="text"
				spellcheck="false"
				:value="focusedElement.value.v.chars"
				@input="setNodeValue(($event.target as any).value)"
			/>
		</div>

		<div class="buttons">
			<button class="btn btn-nobg clr-red" @click="deleteNode()">delete</button>
		</div>

		<div>
			<div class="custom-select-container algorithms">
				<Select
					:options="GraphAlgorithms"
					:onChange="(value) => onChange(value as GraphAlgorithms)"
					:value="currentAlg"
				/>
			</div>

			<br>

			<div v-if="currentAlg === GraphAlgorithms.Astar" class="custom-select-container algorithms">
				<Select
					:options="Heuristics"
					:onChange="(value) => onChangeHeuristics(value as Heuristics)"
					:value="curHeuristics"
				/>
			</div>

			<div style="margin-top: 1rem">
				<button class="btn btn-nobg" @click="run()">run</button>
			</div>
		</div>
	</div>
</div>
</template>

<style scoped>
@import "@css/common.css";

.tool-node {
	color: white;
}

.sub-sections-container > div{
	--bg: rgb(64, 55, 48);
}

.algorithms {
	width: 100%;
}

.algorithms select {
	width: 100%;
}

.tool-node > h1{
	margin-bottom: 1rem;
	font-size: 1.75rem;
}

.buttons{
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 0.5rem 0.5rem;
}

.buttons button{
	min-width: 4.5rem;
}

</style>
