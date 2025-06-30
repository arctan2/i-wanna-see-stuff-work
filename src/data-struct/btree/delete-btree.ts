import { AlgorithmHandler } from "../algorithm-handler";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
import { ElementBtreeNode } from "./el-btree-node.ts";
import { BtreeNode } from "./element-types/node.ts";

enum Color {
	shifting = "#345ceb",
	assign = "#00ff00",
	traverse = "#ffff00",
	delete = "#ff0000",
	merge = "#ff005d",
};

class DeleteBtree extends AlgorithmHandler {
	root: null | ElementBtreeNode = null;
	toDeleteKey: number = 0;

	init(canvas: CanvasHandler, node: ElementBtreeNode, key: number) {
		this.toDeleteKey = key;
		this.root = node.getRoot();
		this.initGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		this.toDeleteKey = 0;
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

	*getPredecessor(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		let cur = node.children[idx];

		while(cur !== null && !((cur as Ptr<ElementBtreeNode>).v.isLeaf.value)) {
			yield* this.animateNodeBg(canvas, (cur as Ptr<ElementBtreeNode>).v, Color.traverse);
			cur = (cur as Ptr<ElementBtreeNode>).v.children[(cur as Ptr<ElementBtreeNode>).v.curKeyCount.value];
		}

		if(cur === null) {
			return 0;
		}

		const n = (cur as Ptr<ElementBtreeNode>).v;
		yield* this.animateCellBg(canvas, n, n.curKeyCount.value - 1, Color.shifting);
		return n.keys[n.curKeyCount.value - 1];
	}

	*getSuccessor(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		let cur = node.children[idx + 1];

		while(cur !== null && !((cur as Ptr<ElementBtreeNode>).v.isLeaf.value)) {
			yield* this.animateNodeBg(canvas, (cur as Ptr<ElementBtreeNode>).v, Color.traverse);
			cur = (cur as Ptr<ElementBtreeNode>).v.children[0];
		}

		if(cur === null) {
			return 0;
		}

		const n = (cur as Ptr<ElementBtreeNode>).v;
		yield* this.animateCellBg(canvas, n, 0, Color.shifting);
		return n.keys[0];
	}

	*merge(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		if((node.children[idx] === null) || (node.children[idx + 1] === null)) {
			return;
		}

		let child = (node.children[idx] as Ptr<ElementBtreeNode>).v;
		let sibbling = (node.children[idx + 1] as Ptr<ElementBtreeNode>).v;

		child.bg = Color.merge;
		sibbling.bg = Color.merge;
		child.draw(canvas.ctx);
		sibbling.draw(canvas.ctx);
		yield;
		child.bg = BtreeNode.nodeBg;
		child.draw(canvas.ctx);
		sibbling.bg = BtreeNode.nodeBg;
		sibbling.draw(canvas.ctx);

		const T = node.T;

		child.curKeyCount.value += sibbling.curKeyCount.value + 1;

		yield* this.animateCellBg(canvas, node, idx, Color.merge);
		child.keys[T - 1] = node.keys[idx];
		yield* this.animateCellBg(canvas, child, T - 1, Color.merge);


		for (let i = 0; i < sibbling.curKeyCount.value; i++) {
			yield* this.animateCellBg(canvas, sibbling, i, Color.merge);
			child.keys[i + T] = sibbling.keys[i];
			yield* this.animateCellBg(canvas, child, i + T, Color.merge);
		}

		if (!child.isLeaf.value) {
			for (let i = 0; i <= sibbling.curKeyCount.value; i++) {
				child.children[i + T] = sibbling.children[i];
			}
		}

		for (let i = idx + 1; i < node.curKeyCount.value; i++) {
			yield* this.animateCellBg(canvas, node, i, Color.shifting);
			node.keys[i - 1] = node.keys[i];
			yield* this.animateCellBg(canvas, node, i - 1, Color.shifting);
		}

		for (let i = idx + 2; i <= node.curKeyCount.value; i++) {
			node.children[i - 1] = node.children[i];
		}

		node.curKeyCount.value--;
		yield* this.animateCellBg(canvas, node, node.curKeyCount.value, Color.delete);

		yield* this.animateNodeBg(canvas, sibbling, Color.delete);
		sibbling.remove(canvas);
		canvas.redraw();
	}

	*fill(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		if(idx !== 0 && (node.children[idx - 1] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= node.T) {
			yield* this.borrowFromPrev(node, idx, canvas);
		} else if(idx !== node.curKeyCount.value && (node.children[idx + 1] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= node.T) {
			yield* this.borrowFromNext(node, idx, canvas);
		} else {
			if(idx !== node.curKeyCount.value) {
				yield* this.merge(node, idx, canvas);
			} else {
				yield* this.merge(node, idx - 1, canvas);
			}
		}
	}

	*borrowFromPrev(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		if((node.children[idx] === null) || (node.children[idx - 1]) === null) {
			return;
		}

		let child = (node.children[idx] as Ptr<ElementBtreeNode>).v;
		let sibbling = (node.children[idx - 1] as Ptr<ElementBtreeNode>).v;

		child.curKeyCount.value += 1;

		for(let i = child.curKeyCount.value - 2; i >= 0; i--) {
			yield* this.animateCellBg(canvas, child, i, Color.merge);
			child.keys[i + 1] = child.keys[i];
			yield* this.animateCellBg(canvas, child, i + 1, Color.merge);
		}

		if(!child.isLeaf.value) {
			for (let i = child.curKeyCount.value - 1; i >= 0; i--) {
				child.children[i + 1] = child.children[i];
			}
		}

		yield* this.animateCellBg(canvas, node, idx - 1, Color.merge);
		child.keys[0] = node.keys[idx - 1];
		yield* this.animateCellBg(canvas, child, 0, Color.merge);

		if(!child.isLeaf.value) {
			yield* this.animateNodeBg(canvas, sibbling, Color.shifting);
			child.children[0] = sibbling.children[sibbling.curKeyCount.value];
			yield* this.animateNodeBg(canvas, child, Color.shifting);
		}

		yield* this.animateCellBg(canvas, sibbling, sibbling.curKeyCount.value - 1, Color.shifting);
		node.keys[idx - 1] = sibbling.keys[sibbling.curKeyCount.value - 1];
		yield* this.animateCellBg(canvas, node, idx - 1, Color.shifting);

		sibbling.curKeyCount.value -= 1;
		yield* this.animateCellBg(canvas, sibbling, sibbling.curKeyCount.value, Color.delete);

		canvas.redraw();
		yield;
	}

	*borrowFromNext(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		if((node.children[idx] === null) || (node.children[idx + 1] === null)) {
			return;
		}

		let child = (node.children[idx] as Ptr<ElementBtreeNode>).v;
		let sibbling = (node.children[idx + 1] as Ptr<ElementBtreeNode>).v;

		child.curKeyCount.value += 1;

		yield* this.animateCellBg(canvas, node, idx, Color.shifting);
		child.keys[child.curKeyCount.value - 1] = node.keys[idx];
		yield* this.animateCellBg(canvas, child, child.curKeyCount.value - 1, Color.shifting);

		if (!child.isLeaf.value) {
			child.children[child.curKeyCount.value] = sibbling.children[0];
		}

		yield* this.animateCellBg(canvas, sibbling, 0, Color.shifting);
		node.keys[idx] = sibbling.keys[0];
		yield* this.animateCellBg(canvas, node, idx, Color.shifting);

		if(!sibbling.isLeaf.value) {
			for (let i = 1; i <= sibbling.curKeyCount.value; i++) {
				sibbling.children[i - 1] = sibbling.children[i];
			}
		}

		for (let i = 1; i < sibbling.curKeyCount.value; i++) {
			yield* this.animateCellBg(canvas, sibbling, i, Color.shifting);
			sibbling.keys[i - 1] = sibbling.keys[i];
			yield* this.animateCellBg(canvas, sibbling, i - 1, Color.shifting);
		}

		sibbling.curKeyCount.value -= 1;
		yield* this.animateCellBg(canvas, sibbling, sibbling.curKeyCount.value, Color.delete);
		canvas.redraw();
		yield;
	}

	*deleteFromNonLeaf(node: ElementBtreeNode, idx: number, canvas: CanvasHandler): Generator<any, void, unknown> {
		const T = node.T;

		if((node.children[idx] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= T) {
			const gen = this.getPredecessor(node, idx, canvas);
			let pred; while(!(pred = gen.next()).done) yield;

			node.keys[idx] = pred.value;
			yield* this.animateCellBg(canvas, node, idx, Color.shifting);
			yield* this.deleteRecursive((node.children[idx] as Ptr<ElementBtreeNode>).v, pred.value, canvas);
		} else if((node.children[idx + 1] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= T) {
			const gen = this.getSuccessor(node, idx, canvas);
			let succ; while(!(succ = gen.next()).done) yield;

			node.keys[idx] = succ.value;
			yield* this.animateCellBg(canvas, node, idx, Color.shifting);
			yield* this.deleteRecursive((node.children[idx + 1] as Ptr<ElementBtreeNode>).v, succ.value, canvas);
		} else {
			let k = node.keys[idx];
			yield* this.merge(node, idx, canvas);
			yield* this.deleteRecursive((node.children[idx] as Ptr<ElementBtreeNode>).v, k, canvas);
		}
	}

	*deleteFromLeaf(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		yield* this.animateCellBg(canvas, node, idx, Color.delete);

		for(let i = idx + 1; i < node.curKeyCount.value; i++) {
			yield* this.animateCellBg(canvas, node, i, Color.shifting);
			node.keys[i - 1] = node.keys[i];
			yield* this.animateCellBg(canvas, node, i - 1, Color.shifting);
		}

		node.curKeyCount.value--;
		yield* this.animateCellBg(canvas, node, node.curKeyCount.value, Color.delete);
		node.drawCell(canvas.ctx, node.curKeyCount.value);
	}

	*deleteRecursive(node: ElementBtreeNode, key: number, canvas: CanvasHandler): Generator<any, void, unknown> {
		const T = node.T;
		let idx = 0;
		
		yield* this.animateNodeBg(canvas, node, Color.traverse);

		while(idx < node.curKeyCount.value && node.keys[idx] < key) {
			yield* this.animateCellBg(canvas, node, idx, Color.traverse);
			idx++;
		}

		if(idx < node.curKeyCount.value && node.keys[idx] === key) {
			if(node.isLeaf.value) {
				yield* this.deleteFromLeaf(node, idx, canvas);
			} else {
				yield* this.deleteFromNonLeaf(node, idx, canvas);
			}
		} else {
			if(node.isLeaf.value) {
				setErrorPopupText(`The key "${key}" is not present in the tree.`);
				return;
			}

			const flag = ((idx == node.curKeyCount.value) ? true : false);

			if((node.children[idx] as Ptr<ElementBtreeNode>).v.curKeyCount.value < T) {
				yield* this.animateNodeBg(canvas, (node.children[idx] as Ptr<ElementBtreeNode>).v, Color.delete);
				yield* this.fill(node, idx, canvas);
			}

			if (flag && idx > node.curKeyCount.value) {
				yield* this.deleteRecursive((node.children[idx - 1] as Ptr<ElementBtreeNode>).v, key, canvas);
			} else {
				yield* this.deleteRecursive((node.children[idx] as Ptr<ElementBtreeNode>).v, key, canvas);
			}
		}
	}

	*deleteKey(root: ElementBtreeNode, key: number, canvas: CanvasHandler) {
		yield* this.deleteRecursive(root, key, canvas);

		if(root.curKeyCount.value === 0) {
			const temp = root;

			yield* this.animateNodeBg(canvas, root, Color.delete);

			if(!root.isLeaf.value) {
				const child = root.children[0];
				if(child !== null) {
					(child as Ptr<ElementBtreeNode>).v.parentNode = null;
					root = (child as Ptr<ElementBtreeNode>).v;
				}
			}
			temp.remove(canvas);
		}

		if(root.curKeyCount.value) {
			root.rearrangeTree(canvas);
		}
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			yield* this.deleteKey(this.root, this.toDeleteKey, canvas);
		}
	}
}

export default new DeleteBtree();
