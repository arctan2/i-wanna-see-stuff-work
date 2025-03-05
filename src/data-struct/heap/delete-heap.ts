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
			for(const _ of heap.animateCellBg(canvas, idx, Color.traverse)) yield;
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
			for(const _ of this.heapify(heap, i, canvas)) yield;
		}
	}

	*delete(heap: ElementHeapBuffer, canvas: CanvasHandler) {
		let buf = heap.buf.v;

		for(const _ of heap.animateCellBg(canvas, 0, Color.delete)) yield;

		for(const _ of heap.animateCellBg(canvas, buf.length - 1, Color.shift)) yield;
		buf.setAt(0, buf.at(buf.length - 1) as number);
		for(const _ of heap.animateCellBg(canvas, 0, Color.shift)) yield;

		buf.pop();

		heap.drawTree(canvas.ctx);

		canvas.redraw();

		for(const _ of this.heapify(heap, 0, canvas)) yield;
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			if(this.root.buf.v.length === 0) return;
			let gen = this.delete(this.root, canvas);
			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new DeleteTrie();
