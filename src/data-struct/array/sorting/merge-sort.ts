import { AlgorithmHandler } from "../../algorithm-handler.ts";
import { setInfoPopupText } from "../../global.ts";
import { CanvasHandler } from "../../handler/canvas-handler.ts";
import { ElementArrayBuf } from "../el-array.ts";
import { ArrayBuf } from "../element-types/array.ts";

enum Color {
	swap = "#82f7ff",
	swapDone = "#00ff00",
	moving = "#ffffff",
	assign = "#00ff00",
	traverse = "#ffff00",
	compare = "#ff00ff",
	none = ArrayBuf.bg as any,
};

class MergeSort extends AlgorithmHandler {
	array: null | ElementArrayBuf = null;

	init(canvas: CanvasHandler, array: ElementArrayBuf, doneCallback?: () => void) {
		this.array = array;
		this.doneCallback = doneCallback;
		this.initAsyncGenerator(canvas);
		setInfoPopupText(`Merge Sort"`);
	}

	uninit(canvas: CanvasHandler) {
		this.array?.resetAllNodesStyle(canvas);
		this.array = null;
		setInfoPopupText("");
	}

	*animateCellBg(canvas: CanvasHandler, array: ElementArrayBuf, idx: number, color: string) {
		array.cellBg[idx] = color;
		array.drawCellAtIdx(canvas.ctx, idx);
		yield;
		array.cellBg[idx] = ArrayBuf.bg;
		array.drawCellAtIdx(canvas.ctx, idx);
	}

	*setColor(canvas: CanvasHandler, array: ElementArrayBuf, color: string, ...idx: number[]) {
		for(const i of idx) {
			array.cellBg[i] = color;
			array.drawCellAtIdx(canvas.ctx, i);
		}
		yield;
	}

	*merge(array: ElementArrayBuf, low: number, mid: number, high: number, canvas: CanvasHandler) {
		const arr = array.arr.v.arr;
		const n1 = mid - low + 1;
		const n2 = high - mid;

		let left = new Array<number>(n1);
		let right = new Array<number>(n2);

		for(let i = 0; i < n1; i++) {
			left[i] = arr[low + i];
		}
		for(let i = 0; i < n2; i++) {
			right[i] = arr[mid + 1 + i];
		}

		let i = 0;
		let j = 0;
		let k = low;

		while(i < n1 && j < n2) {
			let l = left[i];
			let r = right[j];
			if(l <= r) {
				arr[k] = l;
				yield* this.animateCellBg(canvas, array, k, Color.moving);
				i++;
			} else {
				arr[k] = r;
				yield* this.animateCellBg(canvas, array, k, Color.moving);
				j++;
			}
			k++;
		}

		while(i < n1) {
			arr[k] = left[i];
			yield* this.animateCellBg(canvas, array, k, Color.moving);
			i++;
			k++;
		}
		while(j < n2) {
			arr[k] = right[j];
			yield* this.animateCellBg(canvas, array, k, Color.moving);
			j++;
			k++;
		}
	}

	*mergeSort(array: ElementArrayBuf, low: number, high: number, canvas: CanvasHandler): Generator<undefined, void, unknown> {
		if(low < high) {
			let mid = parseInt(((low + high) / 2).toString());

			yield* this.animateCellBg(canvas, array, mid, Color.traverse);

			yield* this.mergeSort(array, low, mid, canvas);
			yield* this.mergeSort(array, mid + 1, high, canvas);
			yield* this.merge(array, low, mid, high, canvas);
		}
	}


	async *sort(array: ElementArrayBuf, canvas: CanvasHandler) {
		const arr = array.arr.v.arr;

		yield* this.mergeSort(array, 0, arr.length - 1, canvas);

		canvas.redraw();
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.array) {
			yield* this.sort(this.array, canvas);
		}
	}
}

export default new MergeSort();
