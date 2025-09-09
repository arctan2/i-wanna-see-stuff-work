<script setup lang="ts">
import { ShallowRef, onBeforeUpdate, onMounted, watch } from 'vue';
import allocator from '../../memory-allocator/allocator';
import { scrollIntoViewAndWait } from '../utils';
import { focusedElement } from '../../global';
import { ElementHandler } from '../../handler/element-handler';

const props = defineProps<{
	showAddressOnHover: boolean,
	parentDiv: Element | null,
	addressType: "hex" | "decimal"
}>();

let pointerMap: { [_:string]: Element } = {};

async function derefPtr(ptr: string) {
	if(props.parentDiv === null) {
		return;
	}

	const el = pointerMap[ptr];
	await scrollIntoViewAndWait(props.parentDiv, el);

	if(ptr === (focusedElement.value as any).ptr?.toString()) {
		return;
	}
	el.classList.add("deref-highlight");
	el.addEventListener("transitionend", () => el.classList.remove("deref-highlight"), { once: true });
}

function handleWatcher(cur: ShallowRef<ElementHandler>, prev: ShallowRef<ElementHandler>) {
	if(props.parentDiv === null) {
		return;
	}

	const curPtr = (cur as any)?.ptr?.toString();
	const curEl = pointerMap[curPtr];

	const prevPtr = (prev as any)?.ptr?.toString();
	const prevEl = pointerMap[prevPtr];

	if(prevEl) {
		prevEl.classList.remove("focus-highlight");
	}

	if(curEl) {
		scrollIntoViewAndWait(props.parentDiv, curEl);
		curEl.classList.add("focus-highlight");
	}
}

watch(focusedElement, handleWatcher);

function refMapper(ptr: string, el: Element) {
	if(el) {
		pointerMap[ptr] = el;
	}
}

onBeforeUpdate(() => {
	pointerMap = {};
})

onMounted(() => {
	handleWatcher(focusedElement.value as any, focusedElement.value as any);
})

</script>

<template>
<div class="simplified-container text-wrap">
	<span 
		v-for="(block) in allocator.allocated.iter()"
		:class="['simplified', block.v.constructor.name, block.freeBlock ? 'freed' : '']"
		:ref="((el: Element) => { refMapper(block.toString(), el) }) as any"
	>
		<span class="address" v-if="props.showAddressOnHover">{{" " + ((props.addressType === "hex") ? block.toString() : block.start) + " "}}</span>
		<template v-for="b in block.v.toDisplayableBlocks()">
			<span v-if="typeof b === 'string'">{{b}}</span>
			<span v-else style="cursor: pointer;" @click="derefPtr(b.ptr)">{{ b.ptr }}</span>
		</template>
	</span>
</div>
</template>

<style scoped>
.Chars.simplified{
	background-color: var(--chars);
	color: white;
}

.Str.simplified{
	background-color: var(--str);
	color: black;
}

.ElementArrayBuf.simplified{
	background-color: var(--array-buf);
	color: white;
}

.ElementLLNode.simplified{
	background-color: var(--lnode);
	color: white;
}

.ElementGNode.simplified{
	background-color: var(--gnode);
	color: white;
}

.ElementBtreeNode.simplified{
	background-color: var(--btree-node);
	color: white;
}

.ElementBptreeNode.simplified{
	background-color: var(--bptree-node);
	color: black;
}

.ElementLLRbtreeNode.simplified{
	background-color: var(--llrbtree-node);
	color: white;
}

.ElementTrieNode.simplified{
	background-color: var(--trie-node);
	color: black;
}

.ElementHeapBuffer.simplified{
	background-color: var(--heap-buffer);
	color: black;
}

.Null.simplified{
	background-color: var(--null);
	color: black;
}

.MapList.simplified, .List.simplified{
	background-color: var(--list);
	color: white;
}

.MapListMap.simplified, .Arr.simplified{
	background-color: var(--list-map);
	color: white;
}

.ElementDEdge.simplified, .ElementUEdge.simplified{
	background-color: var(--edge);
	color: black;
}

.ElementAdjMatrix.simplified{
	background-color: var(--adj-mat);
	color: black;
}

.text-wrap{
	font-family: monospace;
	text-wrap: wrap;
	word-break: break-all;
	line-break: anywhere;
	white-space-collapse: break-spaces;
}

.simplified-container{
	height: max-content;
	padding-bottom: 0.5rem;
}

.simplified{
	display: inline;
	position: relative;
	border-radius: 5px;
	font-size: 0.8rem;
	line-height: 1.3em;
}

.address{
	display: none;
	opacity: 0;
	position: absolute;
	white-space: pre;
	pointer-events: none;
	border-radius: 5px;
	transition: all 0.2s;
	z-index: 200;
}

.simplified:hover{
	z-index: 200;
}

.simplified:hover .address{
	display: inline-block;
	opacity: 1 !important;
	background-color: white;
	color: black;
	transform: scale(1.1);
}

.simplified.freed{
	background-color: rgba(80, 80, 80, 0.4);
	color: rgba(150, 150, 150, 0.4);
}

.simplified.deref-highlight{
	background-color: white;
	color: black;
	box-shadow: 0 0 10px white;
	transition: all 1s;
}

.simplified.focus-highlight{
	animation-name: highlight-anim;
	animation-duration: 1s;
	animation-iteration-count: infinite;
	animation-fill-mode: forwards;
	animation-direction: alternate;
}

@keyframes highlight-anim {
	0%{
		background-color: white;
		color: black;
		box-shadow: 0 0 10px white;
	}
	100%{
		background-color: yellow;
		color: black;
		box-shadow: 0 0 10px black;
	}
}
</style>
