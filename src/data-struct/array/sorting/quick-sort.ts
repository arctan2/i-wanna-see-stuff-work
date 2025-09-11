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

class QuickSort extends AlgorithmHandler {
	array: null | ElementArrayBuf = null;

	init(canvas: CanvasHandler, array: ElementArrayBuf, doneCallback?: () => void) {
		this.array = array;
		this.doneCallback = doneCallback;
		this.initAsyncGenerator(canvas);
		setInfoPopupText(`Quick Sort`);
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

	*partition(array: ElementArrayBuf, low: number, high: number, canvas: CanvasHandler): Generator<undefined, number, unknown> {
		let arr = array.arr.v.arr;

		yield* this.setColor(canvas, array, Color.traverse, high);
		let pivot = arr[high];
		let i = low - 1;
		yield* this.setColor(canvas, array, Color.compare, high);

		for(let j = low; j <= high - 1; j++) {
			yield* this.animateCellBg(canvas, array, j, Color.compare);

			if(arr[j] < pivot) {
				i++;
				yield* this.setColor(canvas, array, Color.swap, j, i);
				[arr[i], arr[j]] = [arr[j], arr[i]];
				yield* this.setColor(canvas, array, Color.swapDone, j, i);
			}
			yield* this.setColor(canvas, array, Color.none as string, j, i);
		}

		yield* this.setColor(canvas, array, Color.swap, i + 1, high);
		[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
		yield* this.setColor(canvas, array, Color.swapDone, i + 1, high);
		yield* this.setColor(canvas, array, Color.none as string, i + 1, high);

		return i + 1;
	}

	*quickSort(array: ElementArrayBuf, low: number, high: number, canvas: CanvasHandler): Generator<undefined, void, unknown> {
		if(low < high) {
			let partition = yield* this.partition(array, low, high, canvas);
			yield* this.quickSort(array, low, partition - 1, canvas);
			yield* this.quickSort(array, partition + 1, high, canvas);
		}
	}

	async *sort(array: ElementArrayBuf, canvas: CanvasHandler) {
		const arr = array.arr.v.arr;
		yield* this.quickSort(array, 0, arr.length - 1, canvas);
		canvas.redraw();
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.array) {
			yield* this.sort(this.array, canvas);
		}
	}
}

export default new QuickSort();
