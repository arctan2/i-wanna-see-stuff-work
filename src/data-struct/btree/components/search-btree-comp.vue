<script setup lang="ts">
import { algorithmState } from "../../components/refs";
import { playground } from "../../handler/playground-handler";
import SearchBtree from "../search-btree";

function done() {
	SearchBtree.cleanup(playground.canvas);
	algorithmState.forceStopAlgorithm();
}

</script>

<template>
<div class="search-btree" v-if="algorithmState.isDone">
	<h1>Search</h1>

	<br/>
	<button class="btn btn-nobg" @click="done">done</button>
</div>
</template>

<style scoped>
@import "@css/common.css";

.search-btree{
	display: flex;
	flex-direction: column;
	width: 100%;
	max-width: 11rem;
	height: 20%;
	position: absolute;
	left: 1rem;
	top: 5rem;
	border-radius: 4px;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
	background-color: rgb(50, 50, 50);
	color: white;
	padding: 1rem;
	z-index: 50;
}

h1{
	font-size: 1.5rem;
}

h2{
	font-size: 1.2rem;
	margin-top: 1rem;
	text-align: center;
}

@media only screen and (max-width: 550px) {
	.search-btree{
		display: flex;
		flex-direction: column;
		max-width: 90%;
		height: 20%;
		position: absolute;
		top: auto;
		left: auto;
		bottom: 1rem;
		border-radius: 4px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
		color: white;
		padding: 1rem;
	}
}

</style>
