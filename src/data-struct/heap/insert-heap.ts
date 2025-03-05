import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setInfoPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementHeapBuffer } from "./el-heap-buffer.ts";

enum Color {
	inserted = "#00ff00",
	traverse = "#ffff00",
	swap = "#6f00ff"
};

class InsertTrie extends AlgorithmHandler {
	root: null | ElementHeapBuffer = null;
	toInsert: number = -1;

	init(canvas: CanvasHandler, node: ElementHeapBuffer, toInsert: number, doneCallback?: () => void) {
		this.toInsert = toInsert;
		this.root = node;
		this.doneCallback = doneCallback;
		this.initGenerator(canvas);
		setInfoPopupText(`Inserting "${this.toInsert}"`);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		this.toInsert = -1;
		setInfoPopupText("");
	}

	*insertMinHeap(heap: ElementHeapBuffer, value: number, canvas: CanvasHandler) {
		let buf = heap.buf.v;
		buf.push(value);
		let idx = buf.length - 1;

		heap.drawTree(canvas.ctx);
		canvas.redraw();

		for(const _ of heap.animateCellBg(canvas, idx, Color.inserted)) yield;

		while((idx > 0) && heap.cmpFn(buf.at(heap.parentIdx(idx)) as number, buf.at(idx) as number)) {
			for(const _ of heap.animateCellBg(canvas, idx, Color.traverse)) yield;
			let temp = buf.at(idx) as number;

			const idxs = [idx, heap.parentIdx(idx)];
			
			idxs.forEach(i => {
				heap.nodesStyles[i].bg = Color.swap;
				heap.drawCellAtIdx(canvas.ctx, i);
			})
			yield;

			buf.setAt(idx, buf.at(heap.parentIdx(idx)) as number);
			buf.setAt(heap.parentIdx(idx), temp);

			idxs.forEach(i => {
				heap.drawCellAtIdx(canvas.ctx, i);
			})
			yield;

			idxs.forEach(i => {
				heap.nodesStyles[i].resetStyle();
				heap.drawCellAtIdx(canvas.ctx, i);
			})
			yield;

			idx = heap.parentIdx(idx);
		}
		canvas.redraw();
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.insertMinHeap(this.root, this.toInsert, canvas);
			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new InsertTrie();
