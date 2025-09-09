import { AlgorithmHandler } from "../algorithm-handler.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementHeapBuffer } from "./el-heap-buffer.ts";

enum Color {
	traverse = "#ffff00",
	delete = "#ff0000",
	swap = "#6f00ff",
	shift = "#6f00ff",
};

class DeleteTrie extends AlgorithmHandler {
	root: null | ElementHeapBuffer = null;

	init(canvas: CanvasHandler, node: ElementHeapBuffer) {
		this.root = node;
		this.initGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
	}

	*heapify(heap: ElementHeapBuffer, idx: number, canvas: CanvasHandler) {
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

	*delete(heap: ElementHeapBuffer, canvas: CanvasHandler) {
		let buf = heap.buf.v;

		yield* heap.animateCellBg(canvas, 0, Color.delete);

		yield* heap.animateCellBg(canvas, buf.length - 1, Color.shift);
		buf.setAt(0, buf.at(buf.length - 1) as number);
		yield* heap.animateCellBg(canvas, 0, Color.shift);

		buf.pop();

		heap.drawTree(canvas.ctx);

		canvas.redraw();

		yield* this.heapify(heap, 0, canvas);
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			if(this.root.buf.v.length === 0) return;
			let gen = this.delete(this.root, canvas);
			while(!gen.next().done) {
				yield;
			}
		}
	}
}

export default new DeleteTrie();
