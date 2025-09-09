import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setInfoPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementArrayBuf } from "./el-array.ts";
import { ArrayBuf } from "./element-types/array.ts";

enum Color {
	shifting = "#82f7ff",
	assign = "#00ff00",
	traverse = "#ffff00",
	full = "#ff0000",
};

class InsertArrayBuf extends AlgorithmHandler {
	array: null | ElementArrayBuf = null;
	toInsertKey: number = 0;
	toInsertIdx: number = 0;

	init(canvas: CanvasHandler, array: ElementArrayBuf, toInsertIdx: number, toInsertKey: number, doneCallback?: () => void) {
		this.toInsertKey = toInsertKey;
		this.toInsertIdx = toInsertIdx;
		this.array = array;
		this.doneCallback = doneCallback;
		this.initAsyncGenerator(canvas);
		setInfoPopupText(`Inserting "${this.toInsertKey}"`);
	}

	uninit(canvas: CanvasHandler) {
		this.array?.resetAllNodesStyle(canvas);
		this.array = null;
		this.toInsertKey = 0;
		setInfoPopupText("");
	}

	*animateCellBg(canvas: CanvasHandler, array: ElementArrayBuf, idx: number, color: string) {
		array.cellBg[idx] = color;
		array.drawCellAtIdx(canvas.ctx, idx);
		yield;
		array.cellBg[idx] = ArrayBuf.bg;
		array.drawCellAtIdx(canvas.ctx, idx);
	}

	async *insert(array: ElementArrayBuf, idx: number, element: number, canvas: CanvasHandler) {
		const len = array.arr.v.arr.length;
		for(let i = len; i > idx; i--) {
			yield* this.animateCellBg(canvas, array, i, Color.traverse);
			yield* this.animateCellBg(canvas, array, i - 1, Color.shifting);
			array.arr.v.arr[i] = array.arr.v.arr[i - 1];
			yield* this.animateCellBg(canvas, array, i, Color.shifting);
		}

		if(idx === len) {
			array.arr.v.arr[idx] = "" as any;
		}
		yield* this.animateCellBg(canvas, array, idx, Color.assign);
		array.arr.v.arr[idx] = element;

		canvas.redraw();
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.array) {
			yield* this.insert(this.array, this.toInsertIdx, this.toInsertKey, canvas);
		}
	}
}

export default new InsertArrayBuf();
