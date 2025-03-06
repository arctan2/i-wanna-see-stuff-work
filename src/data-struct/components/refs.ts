import { readonly, ref, shallowReactive } from "vue";
import { AlgorithmHandler } from "../algorithm-handler";
import { unfocusElement } from "../global";
import { playground } from "../handler/playground-handler";

const _isMenuOpen = ref<boolean>(false);
const _showToolBar = ref<boolean>(true);
const _isMemAllocShow = ref<boolean>(false);
const _isSelectedItemShow = ref<boolean>(true);

class AlgorithmState {
	alg: null | AlgorithmHandler = null;
	isDone: boolean = true;

	setAlgorithm(handler: AlgorithmHandler) {
		this.alg = handler;
		this.isDone = false;
		setShowToolBar(false);
	}

	forceStopAlgorithm() {
		this.alg = null;
		this.isDone = true;
		setShowToolBar(true);
	}

	algorithmDone() {
		this.isDone = true;
		setShowToolBar(true);
	}
};

export const algorithmState = shallowReactive<AlgorithmState>(new AlgorithmState);

export function setIsMenuOpen(v: boolean) {
	if(v) unfocusElement();
	playground.canvas.redraw();
	_isMenuOpen.value = v;
}

export function setShowToolBar(v: boolean) {
	_showToolBar.value = v;
}

export function setIsMemAllocShow(v: boolean) {
	_isMemAllocShow.value = v;
}

export function setIsSelectedItemShow(v: boolean) {
	_isSelectedItemShow.value = v;
}

export const showToolBar = readonly(_showToolBar);
export const isMenuOpen = readonly(_isMenuOpen);
export const isMemAllocShow = readonly(_isMemAllocShow);
export const isSelectedItemShow = readonly(_isSelectedItemShow);

