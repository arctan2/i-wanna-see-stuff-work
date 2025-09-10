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

class SelectionSort extends AlgorithmHandler {
	array: null | ElementArrayBuf = null;

	init(canvas: CanvasHandler, array: ElementArrayBuf, doneCallback?: () => void) {
		this.array = array;
		this.doneCallback = doneCallback;
		this.initAsyncGenerator(canvas);
		setInfoPopupText(`Selection Sort"`);
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

	async *sort(array: ElementArrayBuf, canvas: CanvasHandler) {
		const arr = array.arr.v.arr;
		let n = arr.length;

		for(let i = 0; i < n - 1; i++) {
			let minIdx = i;
			yield* this.setColor(canvas, array, Color.traverse, i);
			yield* this.setColor(canvas, array, Color.compare, minIdx);
			for(let j = i + 1; j < n; j++) {
				yield* this.animateCellBg(canvas, array, j, Color.compare);

				if(arr[j] < arr[minIdx]) {
					yield* this.setColor(canvas, array, Color.none as string, minIdx);
					minIdx = j;
					yield* this.setColor(canvas, array, Color.compare, minIdx);
				}
			}
			if(i !== minIdx) {
				yield* this.setColor(canvas, array, Color.swap, minIdx, i);
				[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
				yield* this.setColor(canvas, array, Color.swapDone, minIdx, i);
			}

			yield* this.setColor(canvas, array, Color.none as string, minIdx, i);
		}

		canvas.redraw();
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.array) {
			yield* this.sort(this.array, canvas);
		}
	}
}

export default new SelectionSort();
