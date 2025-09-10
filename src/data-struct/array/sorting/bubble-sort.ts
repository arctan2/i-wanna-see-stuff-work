import { AlgorithmHandler } from "../../algorithm-handler.ts";
import { setInfoPopupText } from "../../global.ts";
import { CanvasHandler } from "../../handler/canvas-handler.ts";
import { ElementArrayBuf } from "../el-array.ts";
import { ArrayBuf } from "../element-types/array.ts";

enum Color {
	swap = "#82f7ff",
	swapDone = "#00ff00",
	assign = "#00ff00",
	traverse = "#ffff00",
	compare = "#ff00ff",
	full = "#ff0000",
};

class BubbleSort extends AlgorithmHandler {
	array: null | ElementArrayBuf = null;

	init(canvas: CanvasHandler, array: ElementArrayBuf, doneCallback?: () => void) {
		this.array = array;
		this.doneCallback = doneCallback;
		this.initAsyncGenerator(canvas);
		setInfoPopupText(`Bubble Sort`);
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

	async *sort(array: ElementArrayBuf, canvas: CanvasHandler) {
		const arr = array.arr.v.arr;
		let n = arr.length;

		for(let i = 0; i < n - 1; i++) {
			for(let j = 0; j < n - i - 1; j++) {
				yield* this.animateCellBg(canvas, array, j, Color.traverse);

				array.cellBg[j] = Color.compare;
				array.drawCellAtIdx(canvas.ctx, j);
				array.cellBg[j + 1] = Color.compare;
				array.drawCellAtIdx(canvas.ctx, j + 1);
				yield;

				if(arr[j] > arr[j + 1]) {
					array.cellBg[j] = Color.swap;
					array.drawCellAtIdx(canvas.ctx, j);
					array.cellBg[j + 1] = Color.swap;
					array.drawCellAtIdx(canvas.ctx, j + 1);
					yield;
					
					let temp = arr[j];
					arr[j] = arr[j + 1];
					arr[j + 1] = temp;

					array.cellBg[j] = Color.swapDone;
					array.drawCellAtIdx(canvas.ctx, j);
					array.cellBg[j + 1] = Color.swapDone;
					array.drawCellAtIdx(canvas.ctx, j + 1);
					yield;
				}
				array.cellBg[j] = ArrayBuf.bg;
				array.drawCellAtIdx(canvas.ctx, j);
				array.cellBg[j + 1] = ArrayBuf.bg;
				array.drawCellAtIdx(canvas.ctx, j + 1);
				yield;
			}
		}

		canvas.redraw();
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.array) {
			yield* this.sort(this.array, canvas);
		}
	}
}

export default new BubbleSort();
