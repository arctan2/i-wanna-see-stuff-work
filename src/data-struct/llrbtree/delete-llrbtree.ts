import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementLLRbtreeNode, PtrLLRbNode } from "./el-llrbtree-node.ts";
import { fixUp, isRed, moveRedLeft, moveRedRight, rotateRight } from "./llrbtree-helpers.ts";

enum Color {
	found = "#00ff00",
	traverse = "#ffff00",
	delete = "#ff0000",
};

class DeleteLLRbtree extends AlgorithmHandler {
	root: null | ElementLLRbtreeNode = null;
	toDeleteKey: number | "" = "";

	init(canvas: CanvasHandler, node: ElementLLRbtreeNode, key: number | "") {
		this.toDeleteKey = key;
		this.root = node.getRoot();
		this.initAsyncGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		this.toDeleteKey = 0;
	}

	async *deleteMin(h: PtrLLRbNode, canvas: CanvasHandler): AsyncGenerator<undefined, [PtrLLRbNode, null | number], unknown> {
		if(h === null) {
			return [null, null];
		}

		if(h.v.lNode === null) {
			const v = h.v.key.value as number;
			yield* h.v.animateNodeBg(canvas, Color.delete);
			h.v.remove(canvas);
			return [null, v];
		}

		if(!isRed(h.v.lNode) && !isRed(h.v.lNode.v.lNode)) {
			h = yield* moveRedLeft(h, canvas);
		}

		let deleted; 
		[(h as any).v.lNode, deleted] = yield* this.deleteMin((h as any).v.lNode, canvas);
		let fixedUp = yield* fixUp(h, canvas);

		return [fixedUp, deleted];
	}

	async *delete(h: PtrLLRbNode, key: number, canvas: CanvasHandler): AsyncGenerator<undefined, [PtrLLRbNode, null | number], unknown> {
		let deleted;

		if(h === null) {
			return [null, null];
		}

		yield* h.v.animateNodeBg(canvas, Color.traverse);

		if(key < (h.v.key.value as number)) { // left subtree
			h.v.drawLineToChild(canvas.ctx, "l", Color.traverse);
			yield;
			h.v.drawLineToChild(canvas.ctx, "l");

			if(h.v.lNode === null) {
				return [h, null];
			}

			if(!isRed(h.v.lNode) && !isRed(h.v.lNode.v.lNode)) {
				h = yield* moveRedLeft(h, canvas);
			}

			[(h as any).v.lNode, deleted] = yield* this.delete((h as any).v.lNode, key, canvas);
		} else { // right subtree
			if(isRed(h.v.lNode)) {
				h = yield* rotateRight(h.v, canvas);
			}

			if(!(h.v.key.value as number < key) && h.v.rNode === null) {
				const v = h.v.key.value as number;
				yield* h.v.animateNodeBg(canvas, Color.delete);
				h.v.remove(canvas);
				return [null, v];
			}

			h.v.drawLineToChild(canvas.ctx, "r", Color.traverse);
			yield;
			h.v.drawLineToChild(canvas.ctx, "r");

			if(h.v.rNode !== null && !isRed(h.v.rNode) && !isRed(h.v.rNode.v.rNode)) {
				h = yield* moveRedRight(h, canvas);
			}

			if(!((h as any).v.key.value as number < key)) {
				yield* (h as any).v.animateNodeBg(canvas, Color.found);
				let subDeleted;
				[(h as any).v.rNode, subDeleted] = yield* this.deleteMin((h as any).v.rNode, canvas);

				if(subDeleted === null) {
					throw("logic");
				}

				[deleted, (h as any).v.key.value] = [(h as any).v.key.value, subDeleted];
			} else {
				[(h as any).v.rNode, deleted] = yield* this.delete((h as any).v.rNode, key, canvas);
			}
		}

		let fixedUp = yield* fixUp(h, canvas);

		return [fixedUp, deleted];
	}

	async *deleteValue(root: PtrLLRbNode, value: number | "", canvas: CanvasHandler) {
		if(root && (root?.v.isLeaf() || value === "")) {
			if(root.v.key.value === value) {
				yield* root.v.animateNodeBg(canvas, Color.delete);
				root.v.remove(canvas);
				return;
			}
		}

		let deleted;

		[root, deleted] = yield* this.delete(root, value as number, canvas);

		if(deleted === null) {
			setErrorPopupText(`Key "${value}" not found in the tree.`);
		}

		if(root !== null) {
			root.v.isBlack = true;
			await root.v.rearrangeTree(canvas);
		}
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.root) {
			yield* this.deleteValue(this.root.ptr, this.toDeleteKey, canvas);
		}
	}
}

export default new DeleteLLRbtree();
