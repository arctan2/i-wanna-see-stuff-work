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

class InsertionSort extends AlgorithmHandler {
	array: null | ElementArrayBuf = null;

	init(canvas: CanvasHandler, array: ElementArrayBuf, doneCallback?: () => void) {
		this.array = array;
		this.doneCallback = doneCallback;
		this.initAsyncGenerator(canvas);
		setInfoPopupText(`Insertion Sort`);
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

		for(let i = 1; i < n; i++) { 
			let key = arr[i];
			let j = i - 1;

			yield* this.animateCellBg(canvas, array, i, Color.traverse);

			while(true) {
				if(j < 0) {
					break;
				}
				yield* this.animateCellBg(canvas, array, j, Color.traverse);

				yield* this.setColor(canvas, array, Color.compare, j);

				yield* this.setColor(canvas, array, Color.none as string, j, i);

				if(arr[j] <= key) {
					break;
				}
				yield* this.setColor(canvas, array, Color.moving, j);
				arr[j + 1] = arr[j]; 
				for(const _ of this.setColor(canvas, array, Color.none as any, j));
				for(const _ of this.setColor(canvas, array, Color.moving, j + 1));
				yield;
				for(const _ of this.setColor(canvas, array, Color.none as any, j + 1));
				j--;
				yield;
			}
			arr[j + 1] = key; 
			yield* this.setColor(canvas, array, Color.swapDone, j + 1);
			yield* this.setColor(canvas, array, Color.none as any, j + 1);
		} 

		canvas.redraw();
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.array) {
			yield* this.sort(this.array, canvas);
		}
	}
}

export default new InsertionSort();
