import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
import { ElementArrayBuf } from "./el-array.ts";
import { ArrayBuf } from "./element-types/array.ts";

enum Color {
	found = "#00ff00",
	traverse = "#ffff00",
	notEqual = "#ff0000",
};

class SearchBtree extends AlgorithmHandler {
	array: null | ElementArrayBuf = null;
	toSearchKey: number = 0;

	init(canvas: CanvasHandler, array: ElementArrayBuf, toSearchKey: number, doneCallback?: () => void) {
		this.toSearchKey = toSearchKey;
		this.array = array;
		this.doneCallback = doneCallback;
		this.initGenerator(canvas);
	}

	cleanup(canvas: CanvasHandler) {
		this.array?.resetAllNodesStyle(canvas);
		this.array = null;
	}

	uninit(_canvas: CanvasHandler) {
		this.toSearchKey = 0;
	}

	*animateNodeBg(canvas: CanvasHandler, array: ElementArrayBuf, color: string) {
		array.bg = color;
		array.draw(canvas.ctx);
		yield;
		array.bg = ArrayBuf.nodeBg;
		array.draw(canvas.ctx);
	}

	*animateCellBg(canvas: CanvasHandler, array: ElementArrayBuf, idx: number, color: string) {
		array.keysBg[idx] = color;
		array.drawCell(canvas.ctx, idx);
		yield;
		array.keysBg[idx] = ArrayBuf.cellBg;
		array.drawCell(canvas.ctx, idx);
	}

	*searchKey(array: ElementArrayBuf, key: number, canvas: CanvasHandler) {
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.array) {
			yield* this.searchKey(this.array, this.toSearchKey, canvas);
		}
	}
}

export default new SearchBtree();
