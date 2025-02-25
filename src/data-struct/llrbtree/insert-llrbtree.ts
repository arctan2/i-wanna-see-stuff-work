import { AlgorithmHandler } from "../algorithm-handler.ts";
import { GAP } from "../canvas.ts";
import { setInfoPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementLLRbtreeNode, PtrLLRbNode } from "./el-llrbtree-node.ts";
import { LLRbtreeNode } from "./element-types/node.ts";
import { flip, isRed, rotateLeft, rotateRight } from "./llrbtree-helpers.ts";

enum Color {
	shifting = "#345ceb",
	assign = "#00ff00",
	traverse = "#ffff00",
	full = "#ff0000",
};

class InsertLLRbtree extends AlgorithmHandler {
	root: null | ElementLLRbtreeNode = null;
	toInsertKey: number = 0;

	init(canvas: CanvasHandler, node: ElementLLRbtreeNode, toInsertKey: number, doneCallback?: () => void) {
		this.toInsertKey = toInsertKey;
		this.root = node;
		this.doneCallback = doneCallback;
		this.initAsyncGenerator(canvas);
		setInfoPopupText(`Inserting "${this.toInsertKey}"`);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		this.toInsertKey = 0;
		setInfoPopupText("");
	}

	insert(h: PtrLLRbNode, key: number, parent: PtrLLRbNode, canvas: CanvasHandler): PtrLLRbNode {
		if(h === null) {
			const n = new ElementLLRbtreeNode(parent?.v?.x || -1, parent?.v?.y || -1, parent === null ? null : parent.v, key);
			canvas.addElements(n);
			return n.ptr;
		}

		if(key < (h.v.key.value as number)) {
			h.v.lNode = this.insert(h.v.lNode, key, h, canvas);
		} else {
			h.v.rNode = this.insert(h.v.rNode, key, h, canvas);
		}

		if(isRed(h.v.rNode) && !isRed(h.v.lNode)) {
			h = rotateLeft(h.v);
		}

		if(h && isRed(h.v.lNode) && isRed(h.v.lNode!.v.lNode)) {
			h = rotateRight(h.v);
		}

		if(h && isRed(h.v.lNode) && isRed(h.v.rNode)) {
			flip(h.v);
		}

		return h;
	}

	async *insertKey(root: ElementLLRbtreeNode, key: number, canvas: CanvasHandler) {
		if(root.key.value === "") {
			root.key.value = key;
		} else {
			root = this.insert(root.ptr, key, root.ptr, canvas)!.v;
		}

		root.isBlack = true;
		await root.rearrangeTree(canvas);
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.insertKey(this.root, this.toInsertKey, canvas);
			while(!(await gen.next()).done) {
				yield null;
			}
		}
	}
}

export default new InsertLLRbtree();
