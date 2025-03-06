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
			for(const _ of this.animateNodeBg(canvas, (cur as Ptr<ElementBtreeNode>).v, Color.traverse)) yield;
			cur = (cur as Ptr<ElementBtreeNode>).v.children[(cur as Ptr<ElementBtreeNode>).v.curKeyCount.value];
		}

		if(cur === null) {
			return 0;
		}

		const n = (cur as Ptr<ElementBtreeNode>).v;
		for(const _ of this.animateCellBg(canvas, n, n.curKeyCount.value - 1, Color.shifting)) yield;
		return n.keys[n.curKeyCount.value - 1];
	}

	*getSuccessor(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		let cur = node.children[idx + 1];

		while(cur !== null && !((cur as Ptr<ElementBtreeNode>).v.isLeaf.value)) {
			for(const _ of this.animateNodeBg(canvas, (cur as Ptr<ElementBtreeNode>).v, Color.traverse)) yield;
			cur = (cur as Ptr<ElementBtreeNode>).v.children[0];
		}

		if(cur === null) {
			return 0;
		}

		const n = (cur as Ptr<ElementBtreeNode>).v;
		for(const _ of this.animateCellBg(canvas, n, 0, Color.shifting)) yield;
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

		for(const _ of this.animateCellBg(canvas, node, idx, Color.merge)) yield;
		child.keys[T - 1] = node.keys[idx];
		for(const _ of this.animateCellBg(canvas, child, T - 1, Color.merge)) yield;


		for (let i = 0; i < sibbling.curKeyCount.value; i++) {
			for(const _ of this.animateCellBg(canvas, sibbling, i, Color.merge)) yield;
			child.keys[i + T] = sibbling.keys[i];
			for(const _ of this.animateCellBg(canvas, child, i + T, Color.merge)) yield;
		}

		if (!child.isLeaf.value) {
			for (let i = 0; i <= sibbling.curKeyCount.value; i++) {
				child.children[i + T] = sibbling.children[i];
			}
		}

		for (let i = idx + 1; i < node.curKeyCount.value; i++) {
			for(const _ of this.animateCellBg(canvas, node, i, Color.shifting)) yield;
			node.keys[i - 1] = node.keys[i];
			for(const _ of this.animateCellBg(canvas, node, i - 1, Color.shifting)) yield;
		}

		for (let i = idx + 2; i <= node.curKeyCount.value; i++) {
			node.children[i - 1] = node.children[i];
		}

		node.curKeyCount.value--;
		for(const _ of this.animateCellBg(canvas, node, node.curKeyCount.value, Color.delete)) yield;

		for(const _ of this.animateNodeBg(canvas, sibbling, Color.delete)) yield;
		sibbling.remove(canvas);
		canvas.redraw();
	}

	*fill(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		if(idx !== 0 && (node.children[idx - 1] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= node.T) {
			for(const _ of this.borrowFromPrev(node, idx, canvas)) yield;
		} else if(idx !== node.curKeyCount.value && (node.children[idx + 1] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= node.T) {
			for(const _ of this.borrowFromNext(node, idx, canvas)) yield;
		} else {
			if(idx !== node.curKeyCount.value) {
				for(const _ of this.merge(node, idx, canvas)) yield;
			} else {
				for(const _ of this.merge(node, idx - 1, canvas)) yield;
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
			for(const _ of this.animateCellBg(canvas, child, i, Color.merge)) yield;
			child.keys[i + 1] = child.keys[i];
			for(const _ of this.animateCellBg(canvas, child, i + 1, Color.merge)) yield;
		}

		if(!child.isLeaf.value) {
			for (let i = child.curKeyCount.value - 1; i >= 0; i--) {
				child.children[i + 1] = child.children[i];
			}
		}

		for(const _ of this.animateCellBg(canvas, node, idx - 1, Color.merge)) yield;
		child.keys[0] = node.keys[idx - 1];
		for(const _ of this.animateCellBg(canvas, child, 0, Color.merge)) yield;

		if(!child.isLeaf.value) {
			for(const _ of this.animateNodeBg(canvas, sibbling, Color.shifting)) yield;
			child.children[0] = sibbling.children[sibbling.curKeyCount.value];
			for(const _ of this.animateNodeBg(canvas, child, Color.shifting)) yield;
		}

		for(const _ of this.animateCellBg(canvas, sibbling, sibbling.curKeyCount.value - 1, Color.shifting)) yield;
		node.keys[idx - 1] = sibbling.keys[sibbling.curKeyCount.value - 1];
		for(const _ of this.animateCellBg(canvas, node, idx - 1, Color.shifting)) yield;

		sibbling.curKeyCount.value -= 1;
		for(const _ of this.animateCellBg(canvas, sibbling, sibbling.curKeyCount.value, Color.delete)) yield;

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

		for(const _ of this.animateCellBg(canvas, node, idx, Color.shifting)) yield;
		child.keys[child.curKeyCount.value - 1] = node.keys[idx];
		for(const _ of this.animateCellBg(canvas, child, child.curKeyCount.value - 1, Color.shifting)) yield;

		if (!child.isLeaf.value) {
			child.children[child.curKeyCount.value] = sibbling.children[0];
		}

		for(const _ of this.animateCellBg(canvas, sibbling, 0, Color.shifting)) yield;
		node.keys[idx] = sibbling.keys[0];
		for(const _ of this.animateCellBg(canvas, node, idx, Color.shifting)) yield;

		if(!sibbling.isLeaf.value) {
			for (let i = 1; i <= sibbling.curKeyCount.value; i++) {
				sibbling.children[i - 1] = sibbling.children[i];
			}
		}

		for (let i = 1; i < sibbling.curKeyCount.value; i++) {
			for(const _ of this.animateCellBg(canvas, sibbling, i, Color.shifting)) yield;
			sibbling.keys[i - 1] = sibbling.keys[i];
			for(const _ of this.animateCellBg(canvas, sibbling, i - 1, Color.shifting)) yield;
		}

		sibbling.curKeyCount.value -= 1;
		for(const _ of this.animateCellBg(canvas, sibbling, sibbling.curKeyCount.value, Color.delete)) yield;
		canvas.redraw();
		yield;
	}

	*deleteFromNonLeaf(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		const T = node.T;

		if((node.children[idx] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= T) {
			const gen = this.getPredecessor(node, idx, canvas);
			let pred; while(!(pred = gen.next()).done) yield;

			node.keys[idx] = pred.value;
			for(const _ of this.animateCellBg(canvas, node, idx, Color.shifting)) yield;
			for(const _ of this.deleteRecursive((node.children[idx] as Ptr<ElementBtreeNode>).v, pred.value, canvas)) yield;
		} else if((node.children[idx + 1] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= T) {
			const gen = this.getSuccessor(node, idx, canvas);
			let succ; while(!(succ = gen.next()).done) yield;

			node.keys[idx] = succ.value;
			for(const _ of this.animateCellBg(canvas, node, idx, Color.shifting)) yield;
			for(const _ of this.deleteRecursive((node.children[idx + 1] as Ptr<ElementBtreeNode>).v, succ.value, canvas)) yield;
		} else {
			let k = node.keys[idx];
			for(const _ of this.merge(node, idx, canvas)) yield;
			for(const _ of this.deleteRecursive((node.children[idx] as Ptr<ElementBtreeNode>).v, k, canvas)) yield;
		}
	}

	*deleteFromLeaf(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		for(const _ of this.animateCellBg(canvas, node, idx, Color.delete)) yield;

		for(let i = idx + 1; i < node.curKeyCount.value; i++) {
			for(const _ of this.animateCellBg(canvas, node, i, Color.shifting)) yield;
			node.keys[i - 1] = node.keys[i];
			for(const _ of this.animateCellBg(canvas, node, i - 1, Color.shifting)) yield;
		}

		node.curKeyCount.value--;
		for(const _ of this.animateCellBg(canvas, node, node.curKeyCount.value, Color.delete)) yield;
		node.drawCell(canvas.ctx, node.curKeyCount.value);
	}

	*deleteRecursive(node: ElementBtreeNode, key: number, canvas: CanvasHandler) {
		const T = node.T;
		let idx = 0;
		
		for(const _ of this.animateNodeBg(canvas, node, Color.traverse)) yield;

		while(idx < node.curKeyCount.value && node.keys[idx] < key) {
			for(const _ of this.animateCellBg(canvas, node, idx, Color.traverse)) yield;
			idx++;
		}

		if(idx < node.curKeyCount.value && node.keys[idx] === key) {
			if(node.isLeaf.value) {
				for(const _ of this.deleteFromLeaf(node, idx, canvas)) yield;
			} else {
				for(const _ of this.deleteFromNonLeaf(node, idx, canvas)) yield;
			}
		} else {
			if(node.isLeaf.value) {
				setErrorPopupText(`The key "${key}" is not present in the tree.`);
				return;
			}

			const flag = ((idx == node.curKeyCount.value) ? true : false);

			if((node.children[idx] as Ptr<ElementBtreeNode>).v.curKeyCount.value < T) {
				for(const _ of this.animateNodeBg(canvas, (node.children[idx] as Ptr<ElementBtreeNode>).v, Color.delete)) yield;
				for(const _ of this.fill(node, idx, canvas)) yield;
			}

			if (flag && idx > node.curKeyCount.value) {
				for(const _ of this.deleteRecursive((node.children[idx - 1] as Ptr<ElementBtreeNode>).v, key, canvas)) yield;
			} else {
				for(const _ of this.deleteRecursive((node.children[idx] as Ptr<ElementBtreeNode>).v, key, canvas)) yield;
			}
		}
	}

	*deleteKey(root: ElementBtreeNode, key: number, canvas: CanvasHandler) {
		for(const _ of this.deleteRecursive(root, key, canvas)) yield;

		if(root.curKeyCount.value === 0) {
			const temp = root;

			for(const _ of this.animateNodeBg(canvas, root, Color.delete)) yield;

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
			let gen = this.deleteKey(this.root, this.toDeleteKey, canvas);
			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new DeleteBtree();
