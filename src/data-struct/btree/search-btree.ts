import { AlgorithmHandler } from "../algorithm-handler";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
import { ElementBtreeNode } from "./el-btree-node.ts";
import { BtreeNode } from "./element-types/node.ts";

enum Color {
	found = "#00ff00",
	traverse = "#ffff00",
	notEqual = "#ff0000",
};

class SearchBtree extends AlgorithmHandler {
	root: null | ElementBtreeNode = null;
	toSearchKey: number = 0;

	init(canvas: CanvasHandler, node: ElementBtreeNode, toSearchKey: number, doneCallback?: () => void) {
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

	*animateNodeBg(canvas: CanvasHandler, node: ElementBtreeNode, color: string) {
		node.bg = color;
		node.draw(canvas.ctx);
		yield;
		node.bg = BtreeNode.nodeBg;
		node.draw(canvas.ctx);
	}

	*animateCellBg(canvas: CanvasHandler, node: ElementBtreeNode, idx: number, color: string) {
		node.keysBg[idx] = color;
		node.drawCell(canvas.ctx, idx);
		yield;
		node.keysBg[idx] = BtreeNode.cellBg;
		node.drawCell(canvas.ctx, idx);
	}

	*searchKey(root: ElementBtreeNode, key: number, canvas: CanvasHandler) {
		let cur = root;

		while(true) {
			let i = 0;

			for(const _ of this.animateNodeBg(canvas, cur, Color.traverse)) yield;

			while(i < cur.curKeyCount.value && key > cur.keys[i]) {
				for(const _ of this.animateCellBg(canvas, cur, i, Color.traverse)) yield;
				i++;
			}

			if(i < cur.curKeyCount.value && key === cur.keys[i]) {
				cur.keysBg[i] = Color.found;
				cur.drawCell(canvas.ctx, i);
				return;
			}

			if(cur.isLeaf.value) {
				setErrorPopupText(`Key "${key}" not found.`);
				return;
			}

			cur.drawLineToChild(canvas.ctx, i, Color.traverse);
			yield;
			
			cur = (cur.children[i] as Ptr<ElementBtreeNode>).v;
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

export default new SearchBtree();
