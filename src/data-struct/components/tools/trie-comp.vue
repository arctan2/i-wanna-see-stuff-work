<script setup lang="ts">
import { ref } from 'vue';
import { playground } from '../../handler/playground-handler';
import { useFocusedElement, unfocusElement, isAutoRearrangeBtree } from '../../global';
import { ElementTrieNode } from '../../trie/el-trie-node';
import InsertTrie from "../../trie/insert-trie.ts"
import DeleteTrie from "../../trie/delete-trie.ts"
import SearchTrie from "../../trie/search-trie.ts"
import { algorithmState } from '../refs';

const focusedElement = useFocusedElement<ElementTrieNode>();
const toInsertString = ref<string>("");
const toSearchString = ref<string>("");

function insertString() {
	if(toInsertString.value === "") {
		return;
	}

	InsertTrie.init(playground.canvas, focusedElement.value, toInsertString.value);
	algorithmState.setAlgorithm(InsertTrie);
	InsertTrie.tryPlay(playground.canvas);

	unfocusElement();
}

function deleteString() {
	DeleteTrie.init(playground.canvas, focusedElement.value, focusedElement.value.word);
	algorithmState.setAlgorithm(DeleteTrie);
	DeleteTrie.tryPlay(playground.canvas);

	unfocusElement();
}

function searchString() {
	if(toSearchString.value === "") {
		return;
	}

	SearchTrie.init(playground.canvas, focusedElement.value, toSearchString.value);
	algorithmState.setAlgorithm(SearchTrie);
	SearchTrie.tryPlay(playground.canvas);

	unfocusElement();
}

</script>

<template>
<div class="tool-node">
	<h1>Trie Node</h1>

	<div class="sub-sections-container scroll-bar">
		<div>
			<div class="checkbox-container">
				<input type="checkbox" v-model="isAutoRearrangeBtree" />
				<label>Auto rearrange</label>
			</div>
		</div>
		<template v-if="focusedElement.parentNode === null">
		<div class="insert-key">
			<h2>Insert String</h2>
			<input
				spellcheck="false"
				placeholder="string"
				type="text"
				v-model="toInsertString"
				style="width: 100%;"
			/>
			<button class="btn btn-nobg clr-green" @click="insertString()">insert</button>
		</div>

		<div class="search-key">
			<h2>Search String</h2>
			<input
				spellcheck="false"
				placeholder="string"
				type="text"
				v-model="toSearchString"
				style="width: 100%;"
			/>
			<button class="btn btn-nobg clr-lblue" @click="searchString()">search</button>
		</div>

		</template>

		<div class="delete-key" v-if="focusedElement.isWordEnd.value || (focusedElement.parentNode === null && focusedElement.isEmpty())">
			<h2>Delete String</h2>
			<button class="btn btn-nobg clr-red" @click="deleteString()">delete</button>
		</div>

	</div>
</div>
</template>

<style scoped>
@import "@css/common.css";

.tool-node {
	color: white;
}

.tool-node > h1{
	margin-bottom: 1rem;
	font-size: 1.75rem;
}

.sub-sections-container > div{
	--bg: rgb(48, 64, 50);
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

.sub-sections-container > div h2 {
	font-size: 1.2rem;
	margin-bottom: 0.5rem;
}

.from-to {
	display: flex;
	flex-direction: column;
}

.from-to > div {
	display: flex;
	flex-direction: row;
	width: 100%;
	justify-content: space-around;
	font-family: monospace;
	margin-bottom: 0.3rem;
}

.from-to > div > * {
	max-width: 48%;
	min-width: 48%;
}

.from-to > div > div{
	text-align: center;
}

.checkbox-container{
	font-size: 0.9rem;
	min-width: 100%;
	justify-content: start;
}

.sub-sections-container > div button:not(:first-child), .sub-sections-container > div .checkbox-container:not(:first-child) {
	margin-top: 0.5rem;
}


</style>
