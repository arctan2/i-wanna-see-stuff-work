<script setup lang="ts">
import { ShallowRef, onBeforeUpdate, onMounted, ref, watch } from "vue";
import allocator from "../../memory-allocator/allocator";
import { numberToHex } from "../../utils";
import { computed } from "@vue/reactivity";
import { createDebouncer, scrollIntoViewAndWait } from "../utils";
import { focusedElement } from "../../global";
import { ElementHandler } from "../../handler/element-handler";

const props = defineProps<{
	byteAlign: "auto" | number,
	parentDiv: Element | null
}>();

const bytesContainer = ref<null | HTMLDivElement>(null);
const incBy = ref<number>(0);
const countOfRows = ref<number>(0);
const bytes = computed<Array<string>>(() => {
	const b: Array<string> = ["0x00000000"];
	let count = props.byteAlign === "auto" ? incBy.value : props.byteAlign;
	for(let i = 1; i < countOfRows.value; i++, count += incBy.value) {
		b.push(`0x${numberToHex(count)}`)
	}
	return b;
});
const style = computed(() => {
	if(props.byteAlign === "auto") {
		return {};
	}
	const w = `${props.byteAlign * 3.7}ch`;
	return { maxWidth: w, width: w, minWidth: w };
})
let pointerMap: { [_:string]: Element } = {};

function refMapper(ptr: string, el: Element) {
	pointerMap[ptr] = el;
}

onBeforeUpdate(() => {
	pointerMap = {};
})

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

const debouncedCalcBytesInc = createDebouncer(calcBytesInc, 100);

watch([allocator.allocated, props], calcBytesInc, { flush: "post" })

onMounted(() => {
	window.addEventListener("resize", debouncedCalcBytesInc);

	calcBytesInc();
	handleWatcher(focusedElement.value as any, focusedElement.value as any);

	return () => {
		window.removeEventListener("resize", debouncedCalcBytesInc);
	}
})

function calcBytesInc() {
	const container = bytesContainer.value;
	if(container === null) {
		return;
	}
	const firstBlock = container.children[0];
	if(firstBlock === undefined) {
		return;
	}
	const firstByte = firstBlock.children[0];
	if(firstByte === undefined) {
		return;
	}

	const containerHeight = container.scrollHeight;
	const containerWidth = container.clientWidth;
	const firstByteHeight = firstByte.clientHeight;
	const firstByteWidth = firstByte.clientWidth;

	incBy.value = Math.floor(containerWidth / firstByteWidth);
	countOfRows.value = Math.floor(containerHeight / firstByteHeight);
}

</script>

<template>
<div id="bytes-label-container">
	<span v-for="(byte, idx) in bytes" :key="idx">
		<span>{{byte + " "}}</span>
	</span>
</div>

<div ref="bytesContainer" id="bytes-container" :style="style">
	<span
		v-for="(block, idx) in allocator.allocated.iter()" :key="idx"
		:class="['bytes', block.v.constructor.name, block.freeBlock ? 'freed' : '']"
		:ref="((el: Element) => { refMapper(block.toString(), el) }) as any"
	>
		<span v-for="b in block.v.toBytes()">{{b + " "}}</span>
	</span>
</div>
</template>

<style scoped>
.Chars.bytes{
	color: var(--chars);
}

.Str.bytes{
	color: var(--str);
}

.ElementLLNode.bytes{
	color: var(--lnode);
}

.Null.bytes{
	color: var(--null);
}

.ElementGNode.bytes{
	color: var(--gnode);
}

.ElementBtreeNode.bytes{
	color: var(--btree-node);
}

.ElementBptreeNode.bytes{
	color: var(--bptree-node);
}

.ElementLLRbtreeNode.bytes{
	color: var(--llrbtree-node);
}

.MapList.bytes, .List.bytes{
	color: var(--list);
}

.MapListMap.bytes, .Arr.bytes{
	color: var(--list-map);
}

.ElementDEdge.bytes, .ElementUEdge.bytes{
	color: var(--edge);
}

.ElementAdjMatrix.bytes{
	color: var(--adj-mat);
}

.bytes.freed{
	color: rgb(80, 80, 80);
}

.bytes {
	color: white;
	transition: color 1s;
}

.bytes > span {
	display: inline-block;
	white-space: pre;
	font-size: 1rem;
}

#bytes-label-container{
	flex-basis: 2ch;
	width: 20ch;
}

#bytes-label-container > span{
	display: inline-block;
	color: white;
	font-size: 1rem;
	white-space: pre;
}

#bytes-container, #bytes-label-container{
	height: max-content;
	font-family: monospace;
}

.bytes.focus-highlight{
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
