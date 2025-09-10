import { Ref, shallowRef, reactive, readonly, Component, ref } from "vue";
import { ElementHandler, panHandler } from "./handler/element-handler";
import { ToolLLNode } from "./linked-list/tool-node";
import { ToolGNode } from "./graph/tool-node.ts";
import { ToolUEdge } from "./graph/tool-u-edge.ts";
import { ToolDEdge } from "./graph/tool-d-edge.ts";
import { ToolAdjMatrix } from "./graph/tool-adjmatrix.ts";
import { ToolBtreeNode } from "./btree/tool-btree-node.ts";
import { ToolBptreeNode } from "./bptree/tool-bptree-node.ts";
import { ToolLLRbtreeNode } from "./llrbtree/tool-llrbtree-node.ts";
import { ToolTrieNode } from "./trie/tool-trie-node.ts";
import { ToolHeapBuffer } from "./heap/tool-heap-buffer.ts";
import { ToolArrayBuf } from "./array/tool-array.ts";

import IconLLNode from "./assets/vue-icon-wrappers/ll-node.vue";
import IconDEdge from "./assets/vue-icon-wrappers/d-edge.vue";
import IconUEdge from "./assets/vue-icon-wrappers/u-edge.vue";
import IconGNode from "./assets/vue-icon-wrappers/g-node.vue";
import IconMatrix from "./assets/vue-icon-wrappers/matrix.vue";
import IconBtreeNode from "./assets/vue-icon-wrappers/btree-node-icon.vue";
import IconBptreeNode from "./assets/vue-icon-wrappers/bptree-node-icon.vue";
import IconLLRbtreeNode from "./assets/vue-icon-wrappers/llrbtree-node.vue";
import IconTrieNode from "./assets/vue-icon-wrappers/trie-node.vue";
import IconHeapBuffer from "./assets/vue-icon-wrappers/heap-buffer.vue";
import IconArrayBuf from "./assets/vue-icon-wrappers/array.vue";

export const focusedElement = shallowRef<ElementHandler>(panHandler);
export let DELAY = 200;
const _errorPopup = reactive({
	text: ""
})

export const curToolIdx = shallowRef<number>(-1);
export const isRetainTool = shallowRef<boolean>(false);
export const isAutoplay = shallowRef<boolean>(true);

export const isAutoRearrangeBtree = ref<boolean>(false);

export const errorPopup = readonly(_errorPopup);

const _infoPopup = reactive({
	text: ""
})

export const infoPopup = readonly(_infoPopup);

export function setDelay(d: number) {
	if(d < 1) return;
	DELAY = d;
}

export function setErrorPopupText(text: string) {
	_errorPopup.text = text;
}

export function setInfoPopupText(text: string) {
	_infoPopup.text = text;
}

export function useFocusedElement<T>() {
	return focusedElement as Ref<T>;
}

export function focusElement(el: ElementHandler) {
	if(focusedElement.value && focusedElement.value !== el) {
		focusedElement.value.unfocus();
	}
	focusedElement.value = el;
	el.focus();
}

export function unfocusElement() {
	if(focusedElement.value) {
		focusedElement.value.unfocus();
	}

	focusedElement.value = panHandler;
}

let disappearingInfoPopUpTimeout: NodeJS.Timeout;
export function disappearingInfoPopUp(text: string, ms: number) {
	clearTimeout(disappearingInfoPopUpTimeout);
	setInfoPopupText(text);
	disappearingInfoPopUpTimeout = setTimeout(() => setInfoPopupText(""), ms);
}

export const disablePointerEvents = shallowRef(false);

export interface ToolType {
	name: string,
	toolClass: any,
	icon: Component
}

export const ToolList: ToolType[] = [
	{ name: "array", toolClass: ToolArrayBuf, icon: IconArrayBuf },
	{ name: "linked list", toolClass: ToolLLNode, icon: IconLLNode },
	{ name: "graph node", toolClass: ToolGNode, icon: IconGNode },
	{ name: "undirected edge", toolClass: ToolUEdge, icon: IconUEdge },
	{ name: "directed edge", toolClass: ToolDEdge, icon: IconDEdge },
	{ name: "adjacency matrix", toolClass: ToolAdjMatrix, icon: IconMatrix },
	{ name: "left leaning rbtree", toolClass: ToolLLRbtreeNode, icon: IconLLRbtreeNode },
	{ name: "btree", toolClass: ToolBtreeNode, icon: IconBtreeNode },
	{ name: "b+tree", toolClass: ToolBptreeNode, icon: IconBptreeNode },
	{ name: "trie", toolClass: ToolTrieNode, icon: IconTrieNode },
	{ name: "heap buffer", toolClass: ToolHeapBuffer, icon: IconHeapBuffer },
];

