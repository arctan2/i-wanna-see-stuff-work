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
			for(const _ of h.v.animateNodeBg(canvas, Color.delete)) yield;
			h.v.remove(canvas);
			return [null, v];
		}

		if(!isRed(h.v.lNode) && !isRed(h.v.lNode.v.lNode)) {
			let gen = moveRedLeft(h, canvas);
			while(true) {
				let result = await gen.next();
				if(result.done) {
					h = result.value;
					break;
				}
				yield;
			}
		}

		let deleted; {
			let gen = this.deleteMin((h as any).v.lNode, canvas);
			while(true) {
				let result = await gen.next();
				if(result.done) {
					[(h as any).v.lNode, deleted] = result.value;
					break;
				}
				yield;
			}
		}

		let fixedUp; {
			let gen = fixUp(h, canvas);
			while(true) {
				let result = await gen.next();
				if(result.done) {
					fixedUp = result.value;
					break;
				}
				yield;
			}
		}

		return [fixedUp, deleted];
	}

	async *delete(h: PtrLLRbNode, key: number, canvas: CanvasHandler): AsyncGenerator<undefined, [PtrLLRbNode, null | number], unknown> {
		let deleted;

		if(h === null) {
			return [null, null];
		}

		for(const _ of h.v.animateNodeBg(canvas, Color.traverse)) yield;

		if(key < (h.v.key.value as number)) { // left subtree
			h.v.drawLineToChild(canvas.ctx, "l", Color.traverse);
			yield;
			h.v.drawLineToChild(canvas.ctx, "l");

			if(h.v.lNode === null) {
				return [h, null];
			}

			if(!isRed(h.v.lNode) && !isRed(h.v.lNode.v.lNode)) {
				let gen = moveRedLeft(h, canvas);
				while(true) {
					let result = await gen.next();
					if(result.done) {
						h = result.value;
						break;
					}
					yield;
				}
			}

			let gen = this.delete((h as any).v.lNode, key, canvas);
			while(true) {
				let result = await gen.next();
				if(result.done) {
					[(h as any).v.lNode, deleted] = result.value;
					break;
				}
				yield;
			}
		} else { // right subtree
			if(isRed(h.v.lNode)) {
				let gen = rotateRight(h.v, canvas);
				while(true) {
					let result = await gen.next();
					if(result.done) {
						h = result.value;
						break;
					}
					yield;
				}
			}

			if(!(h.v.key.value as number < key) && h.v.rNode === null) {
				const v = h.v.key.value as number;
				for(const _ of h.v.animateNodeBg(canvas, Color.delete)) yield;
				h.v.remove(canvas);
				return [null, v];
			}

			h.v.drawLineToChild(canvas.ctx, "r", Color.traverse);
			yield;
			h.v.drawLineToChild(canvas.ctx, "r");

			if(h.v.rNode !== null && !isRed(h.v.rNode) && !isRed(h.v.rNode.v.rNode)) {
				let gen = moveRedRight(h, canvas);
				while(true) {
					let result = await gen.next();
					if(result.done) {
						h = result.value;
						break;
					}
					yield;
				}
			}

			if(!((h as any).v.key.value as number < key)) {
				for(const _ of (h as any).v.animateNodeBg(canvas, Color.found)) yield;
				let subDeleted;
				let gen = this.deleteMin((h as any).v.rNode, canvas);

				while(true) {
					let result = await gen.next();
					if(result.done) {
						[(h as any).v.rNode, subDeleted] = result.value;
						break;
					}
					yield;
				}

				if(subDeleted === null) {
					throw("logic");
				}

				[deleted, (h as any).v.key.value] = [(h as any).v.key.value, subDeleted];
			} else {
				let gen = this.delete((h as any).v.rNode, key, canvas);

				while(true) {
					let result = await gen.next();
					if(result.done) {
						[(h as any).v.rNode, deleted] = result.value;
						break;
					}
					yield;
				}
			}
		}

		let fixedUp; {
			let gen = fixUp(h, canvas);
			while(true) {
				let result = await gen.next();
				if(result.done) {
					fixedUp = result.value;
					break;
				}
				yield;
			}
		}

		return [fixedUp, deleted];
	}

	async *deleteValue(root: PtrLLRbNode, value: number | "", canvas: CanvasHandler) {
		if(root && (root?.v.isLeaf() || value === "")) {
			if(root.v.key.value === value) {
				for(const _ of root.v.animateNodeBg(canvas, Color.delete)) yield;
				root.v.remove(canvas);
				return;
			}
		}

		let deleted;

		let gen = this.delete(root, value as number, canvas);
		while(true) {
			let result = await gen.next();
			if(result.done) {
				[root, deleted] = result.value;
				if(deleted === null) {
					setErrorPopupText(`Key "${value}" not found in the tree.`);
				}
				break;
			}
			yield;
		}

		if(root !== null) {
			root.v.isBlack = true;
			await root.v.rearrangeTree(canvas);
		}
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.deleteValue(this.root.ptr, this.toDeleteKey, canvas);
			while(!(await gen.next()).done) {
				yield null;
			}
		}
	}
}

export default new DeleteLLRbtree();
