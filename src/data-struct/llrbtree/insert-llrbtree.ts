import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setInfoPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementLLRbtreeNode, PtrLLRbNode } from "./el-llrbtree-node.ts";
import { flip, isRed, rotateLeft, rotateRight } from "./llrbtree-helpers.ts";

enum Color {
	shifting = "#345ceb",
	insertTo = "#00ff00",
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

	async *insert(h: PtrLLRbNode, key: number, parent: PtrLLRbNode, canvas: CanvasHandler) {
		if(h === null) {
			for(const _ of parent!.v.animateNodeBg(canvas, Color.insertTo)) yield;
			const p = parent!.v;
			const isLeft = key < (p.key.value || 0);

			const n = new ElementLLRbtreeNode(p.x, p.y, parent === null ? null : parent.v, key);

			let pos;

			if(isLeft) {
				pos = p.getLeftChildPos();
				p.lNode = n.ptr;
			} else {
				pos = p.getRightChildPos();
				p.rNode = n.ptr;
			}

			canvas.addElements(n);
			await n.moveToAnimate(canvas, pos.x, pos.y);
			yield;
			return n.ptr;
		}

		for(const _ of h.v.animateNodeBg(canvas, Color.traverse)) yield;

		if(key < (h.v.key.value as number)) {
			let gen = this.insert(h.v.lNode, key, h, canvas);

			h.v.drawLineToChild(canvas.ctx, "l", Color.traverse);
			yield;
			h.v.drawLineToChild(canvas.ctx, "l");

			while(true) {
				let result = await gen.next();
				if(result.done) {
					h.v.lNode = result.value;
					break;
				}
				yield;
			}
		} else {
			let gen = this.insert(h.v.rNode, key, h, canvas);

			h.v.drawLineToChild(canvas.ctx, "r", Color.traverse);
			yield;
			h.v.drawLineToChild(canvas.ctx, "r");

			while(true) {
				let result = await gen.next();
				if(result.done) {
					h.v.rNode = result.value;
					break;
				}
				yield;
			}
		}

		if(isRed(h.v.rNode) && !isRed(h.v.lNode)) {
			let gen = rotateLeft(h.v, canvas);
			while(true) {
				let result = await gen.next();
				if(result.done) {
					h = result.value;
					break;
				}
				yield;
			}
		}

		if(h && isRed(h.v.lNode) && isRed(h.v.lNode!.v.lNode)) {
			let gen = rotateRight(h.v, canvas);;
			while(true) {
				let result = await gen.next();
				if(result.done) {
					h = result.value;
					break;
				}
				yield;
			}
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
			let gen = this.insert(root.ptr, key, root.ptr, canvas);
			while(true) {
				let result = await gen.next();
				if(result.done) {
					root = result.value!.v;
					break;
				}
				yield;
			}
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
