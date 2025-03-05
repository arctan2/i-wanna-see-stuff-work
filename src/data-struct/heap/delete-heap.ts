import { AlgorithmHandler } from "../algorithm-handler.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementHeapBuffer } from "./el-heap-buffer.ts";

enum Color {
	traverse = "#ffff00",
	delete = "#ff0000",
};

class DeleteTrie extends AlgorithmHandler {
	root: null | ElementHeapBuffer = null;
	toDelete: number = -1;

	init(canvas: CanvasHandler, node: ElementHeapBuffer, s: number) {
		this.toDelete = s;
		this.root = node;
		this.initGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		this.toDelete = -1;
	}

	*deleteRecursive(node: ElementHeapBuffer | null, s: number, depth: number, canvas: CanvasHandler) {
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.deleteRecursive(this.root, this.toDelete, 0, canvas);
			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new DeleteTrie();
