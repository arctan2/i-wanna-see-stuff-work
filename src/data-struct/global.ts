import { Ref, shallowRef, reactive, readonly, Component } from "vue";
import { ElementHandler, panHandler } from "./handler/element-handler";
import { ToolLLNode } from "./linked-list/tool-node";
import { ToolGNode } from "./graph/tool-node.ts";
import { ToolUEdge } from "./graph/tool-u-edge.ts";
import { ToolDEdge } from "./graph/tool-d-edge.ts";
import { ToolAdjMatrix } from "./graph/tool-adjmatrix.ts";
import IconLLNode from "./assets/vue-icon-wrappers/ll-node.vue";
import IconDEdge from "./assets/vue-icon-wrappers/d-edge.vue";
import IconUEdge from "./assets/vue-icon-wrappers/u-edge.vue";
import IconGNode from "./assets/vue-icon-wrappers/g-node.vue";
import IconMatrix from "./assets/vue-icon-wrappers/matrix.vue";

export const focusedElement = shallowRef<ElementHandler>(panHandler);
export let DELAY = 200;
const _errorPopup = reactive({
	text: ""
})

export const curToolIdx = shallowRef<number>(-1);
export const isRetainTool = shallowRef<boolean>(false);

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

export const disablePointerEvents = shallowRef(false);

export interface ToolType {
	name: string,
	toolClass: any,
	icon: Component
}

export const ToolList: ToolType[] = [
	{ name: "ll-node", toolClass: ToolLLNode, icon: IconLLNode },
	{ name: "g-node", toolClass: ToolGNode, icon: IconGNode },
	{ name: "u-edge", toolClass: ToolUEdge, icon: IconUEdge },
	{ name: "d-edge", toolClass: ToolDEdge, icon: IconDEdge },
	{ name: "adj-mat", toolClass: ToolAdjMatrix, icon: IconMatrix },
];

