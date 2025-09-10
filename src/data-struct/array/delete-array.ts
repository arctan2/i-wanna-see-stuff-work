import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
import { ElementArrayBuf } from "./el-array.ts";
import { ArrayBuf } from "./element-types/array.ts";

enum Color {
	shifting = "#345ceb",
	assign = "#00ff00",
	traverse = "#ffff00",
	delete = "#ff0000",
	merge = "#ff005d",
};

class DeleteArrayBuf extends AlgorithmHandler {
	array: null | ElementArrayBuf = null;
	toDeleteIdx: number = -1;

	init(canvas: CanvasHandler, array: ElementArrayBuf, idx: number) {
		this.toDeleteIdx = idx;
		this.array = array;
		this.initGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.array?.resetAllNodesStyle(canvas);
		this.array = null;
		this.toDeleteIdx = -1;
	}

	*animateNodeBg(canvas: CanvasHandler, array: ElementArrayBuf, color: string) {
		array.bg = color;
		array.draw(canvas.ctx);
		yield;
		array.bg = ArrayBuf.bg;
		array.draw(canvas.ctx);
	}

	*animateCellBg(canvas: CanvasHandler, array: ElementArrayBuf, idx: number, color: string) {
		array.cellBg[idx] = color;
		array.drawCellAtIdx(canvas.ctx, idx);
		yield;
		array.cellBg[idx] = ArrayBuf.bg;
		array.drawCellAtIdx(canvas.ctx, idx);
	}

	*deleteKey(array: ElementArrayBuf, idx: number, canvas: CanvasHandler) {
		const len = array.arr.v.arr.length;

		for(let i = idx; i < len - 1; i++) {
			yield* this.animateCellBg(canvas, array, i, Color.traverse);
			yield* this.animateCellBg(canvas, array, i + 1, Color.merge);
			array.arr.v.arr[i] = array.arr.v.arr[i + 1];
			yield* this.animateCellBg(canvas, array, i, Color.merge);
		}

		yield* this.animateCellBg(canvas, array, len - 1, Color.delete);
		array.arr.v.arr.pop();

		canvas.redraw();
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.array && this.toDeleteIdx >= 0) {
			yield* this.deleteKey(this.array, this.toDeleteIdx, canvas);
			this.array.calcSpikeWidth();
		}
	}
}

export default new DeleteArrayBuf();
