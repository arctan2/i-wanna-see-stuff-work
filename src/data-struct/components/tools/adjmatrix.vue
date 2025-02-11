<script setup lang="ts">
import { playground } from '../../handler/playground-handler';
import { unfocusElement, useFocusedElement } from '../../global';
import Select from "../../../common-components/select.vue";
import { ref } from 'vue';
import { ElementAdjMatrix } from '../../graph/el-adjmatrix';
import { DijkstraAdjMatrix, BfsAdjMatrix, DfsAdjMatrix, AstarAdjMatrix, Maze } from '../../graph/algorithms/adjmatrix';
import { algorithmState } from '../refs';
import { Heuristics } from '../../graph/algorithms/heuristics';

enum GraphAlgorithms {
	Dfs = "Dfs",
	Bfs = "Bfs",
	Dijkstra = "Dijkstra",
	Astar = "A*",
}

const focusedElement = useFocusedElement<ElementAdjMatrix>();

const currentAlg = ref(GraphAlgorithms.Dijkstra);

const curHeuristics = ref(AstarAdjMatrix.curHeuristics);

const rows = ref(focusedElement.value.rows);
const columns = ref(focusedElement.value.columns);

function onChange(value: GraphAlgorithms) {
	currentAlg.value = value;
}

function onChangeHeuristics(value: Heuristics) {
	curHeuristics.value = value;
}

function setRows() {
	rows.value = Math.floor(rows.value);
	if(focusedElement.value.setRows) {
		focusedElement.value.setRows(rows.value);
	}
	playground.canvas.redraw();
}

function setColumns() {
	columns.value = Math.floor(columns.value);
	if(focusedElement.value.setColumns) {
		focusedElement.value.setColumns(columns.value);
	}
	playground.canvas.redraw();
}

const MAX = 10000;

function validateInputs() {
	if(+rows.value <= 2) {
		rows.value = 2;
		rowsInput();
	}

	if(+rows.value >= MAX) {
		rows.value = MAX;
		rowsInput();
	}

	if(+columns.value <= 2) {
		columns.value = 2;
		columnsInput();
	}

	if(+columns.value >= MAX) {
		columns.value = MAX;
		columnsInput();
	}
}

function columnsInput() {
	if(columns.value >= 2 && columns.value < MAX) {
		setColumns();
	}
}

function rowsInput() {
	if(rows.value >= 2 && rows.value < MAX) {
		setRows();
	}
}

function run() {
	switch(currentAlg.value) {
		case GraphAlgorithms.Dfs:
			DfsAdjMatrix.init(focusedElement.value, playground.canvas);
			algorithmState.setAlgorithm(DfsAdjMatrix);
			DfsAdjMatrix.tryPlay(playground.canvas);
			break;
		case GraphAlgorithms.Bfs:
			BfsAdjMatrix.init(focusedElement.value, playground.canvas);
			algorithmState.setAlgorithm(BfsAdjMatrix);
			BfsAdjMatrix.tryPlay(playground.canvas);
			break;
		case GraphAlgorithms.Dijkstra:
			DijkstraAdjMatrix.init(focusedElement.value, playground.canvas);
			algorithmState.setAlgorithm(DijkstraAdjMatrix);
			DijkstraAdjMatrix.tryPlay(playground.canvas);
			break;
		case GraphAlgorithms.Astar:
			AstarAdjMatrix.init(focusedElement.value, curHeuristics.value, playground.canvas);
			algorithmState.setAlgorithm(AstarAdjMatrix);
			AstarAdjMatrix.tryPlay(playground.canvas);
			break;
	}

	unfocusElement();
	playground.canvas.redraw();
}

function generateMaze() {
	Maze.init(focusedElement.value, playground.canvas);
	algorithmState.setAlgorithm(Maze);
	Maze.play(playground.canvas);

	unfocusElement();
	playground.canvas.redraw();
}

function resetMatrix() {
	focusedElement.value.resetCells(playground.canvas.ctx);
	focusedElement.value.draw(playground.canvas.ctx);
}

function clearMatrix() {
	focusedElement.value.clearCells(playground.canvas.ctx);
	focusedElement.value.draw(playground.canvas.ctx);
}

function deleteMatrix() {
	const el = focusedElement.value;
	unfocusElement();
	el.remove(playground.canvas);
	playground.canvas.removeElements(el);
	playground.canvas.redraw();
}

</script>

<template>
<div class="tool-matrix-graph">
	<h1>Matrix</h1>
	<div class="sub-sections-container">
		<div class="dims">
			<input
				@focusout="validateInputs"
				@input="rowsInput"
				placeholder="rows"
				type="number"
				v-model="rows"
			/>
			<span>x</span>
			<input
				@focusout="validateInputs"
				@input="columnsInput"
				placeholder="cols"
				type="number"
				v-model="columns"
			/>
		</div>

		<div class="buttons">
			<button class="btn btn-nobg clr-red" @click="deleteMatrix()">delete</button>
			<button class="btn btn-nobg" @click="resetMatrix()">reset</button>
			<button class="btn btn-nobg clr-blue" @click="clearMatrix()">clear</button>
			<button class="btn btn-nobg clr-yellow" @click="generateMaze()">maze</button>
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

.tool-matrix-graph {
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

.tool-matrix-graph > h1{
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

.dims{
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-around;
}

.dims span{
	font-family: monospace;
	font-size: 1.2rem;
}

.dims input[type="number"]{
	min-width: auto;
	max-width: 4rem;
}

</style>
