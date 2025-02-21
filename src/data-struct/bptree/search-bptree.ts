import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
import { ElementBptreeNode } from "./el-bptree-node.ts";
import { BptreeNode } from "./element-types/node.ts";

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

			for(const _ of cur.animateNodeBg(canvas, Color.traverse)) yield;

			while(i < cur.curKeyCount.value && key > cur.keys.v.arr[i]) {
				for(const _ of cur.animateCellBg(canvas, i, Color.traverse)) yield;
				i++;
			}

			if(i < cur.curKeyCount.value && key === cur.keys.v.arr[i]) {
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
			cur.drawLineToChild(canvas.ctx, i);
			cur = (cur.children.v.arr[i] as Ptr<ElementBptreeNode>).v;
		}
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.searchKey(this.root, this.toSearchKey, canvas);
			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new SearchBptree();
