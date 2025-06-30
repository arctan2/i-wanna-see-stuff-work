import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setInfoPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementHeapBuffer } from "./el-heap-buffer.ts";

enum Color {
	traverse = "#ffff00",
	delete = "#ff0000",
	swap = "#6f00ff",
	shift = "#6f00ff",
};

class Heapify extends AlgorithmHandler {
	root: null | ElementHeapBuffer = null;

	init(canvas: CanvasHandler, node: ElementHeapBuffer, doneCallback?: () => void) {
		this.root = node;
		this.doneCallback = doneCallback;
		this.initGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		setInfoPopupText("");
	}

	*heapify(heap: ElementHeapBuffer, idx: number, canvas: CanvasHandler): Generator<any, void, unknown> {
		let i = idx;
		const leftIdx = heap.leftIdx(idx);
		const rightIdx = heap.rightIdx(idx);

		const buf = heap.buf.v;

		if(leftIdx < buf.length && heap.cmpFn(buf.at(i) as number, buf.at(leftIdx) as number)) {
			i = leftIdx;
		}

		if(rightIdx < buf.length && heap.cmpFn(buf.at(i) as number, buf.at(rightIdx) as number)) {
			i = rightIdx;
		}

		if(i !== idx) {
			yield* heap.animateCellBg(canvas, idx, Color.traverse);
			let temp = buf.at(idx) as number;

			const idxs = [idx, i];
			
			idxs.forEach(i => {
				heap.nodesStyles[i].bg = Color.swap;
				heap.drawCellAtIdx(canvas.ctx, i);
			})
			yield;

			buf.setAt(idx, buf.at(i) as number);
			buf.setAt(i, temp);

			idxs.forEach(i => {
				heap.drawCellAtIdx(canvas.ctx, i);
			})
			yield;

			idxs.forEach(i => {
				heap.nodesStyles[i].resetStyle();
				heap.drawCellAtIdx(canvas.ctx, i);
			})
			yield;
			yield* this.heapify(heap, i, canvas);
		}
	}

	*buildHeap(heap: ElementHeapBuffer, canvas: CanvasHandler) {
		let startIdx = Math.floor(heap.buf.v.length / 2) - 1;

		yield* heap.animateCellBg(canvas, startIdx, Color.traverse);
	 
		for(let i = startIdx; i >= 0; i--) {
			yield* this.heapify(heap, i, canvas);
		}
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			if(this.root.buf.v.length === 0) return;
			yield* this.buildHeap(this.root, canvas);
		}
	}
}

export default new Heapify();
