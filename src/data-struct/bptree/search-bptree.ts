import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
import { ElementBptreeNode } from "./el-bptree-node.ts";

enum Color {
	found = "#00ff00",
	traverse = "#ffff00",
	notEqual = "#ff0000",
};

class SearchBptree extends AlgorithmHandler {
	root: null | ElementBptreeNode = null;
	toSearchKey: number = 0;

	init(canvas: CanvasHandler, node: ElementBptreeNode, toSearchKey: number, doneCallback?: () => void) {
		this.toSearchKey = toSearchKey;
		this.root = node;
		this.doneCallback = doneCallback;
		this.initGenerator(canvas);
	}

	cleanup(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
	}

	uninit(_canvas: CanvasHandler) {
		this.toSearchKey = 0;
	}

	*searchKey(root: ElementBptreeNode, key: number, canvas: CanvasHandler) {
		let cur = root;

		while(true) {
			let i = 0;

			yield* cur.animateNodeBg(canvas, Color.traverse);

			while(i < cur.curKeyCount.value && key > cur.keys[i]) {
				yield* cur.animateCellBg(canvas, i, Color.traverse);
				i++;
			}

			if(i < cur.curKeyCount.value && key === cur.keys[i]) {
				if(cur.isLeaf.value) {
					cur.keysBg[i] = Color.found;
					cur.drawCell(canvas.ctx, i);
					return;
				}
				i++;
			}

			if(cur.isLeaf.value) {
				setErrorPopupText(`Key "${key}" not found.`);
				return;
			}

			cur.drawLineToChild(canvas.ctx, i, Color.traverse);
			yield;
			cur = (cur.children[i] as Ptr<ElementBptreeNode>).v;
		}
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			yield* this.searchKey(this.root, this.toSearchKey, canvas);
		}
	}
}

export default new SearchBptree();
