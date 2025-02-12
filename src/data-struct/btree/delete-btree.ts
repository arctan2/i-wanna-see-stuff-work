import { AlgorithmHandler } from "../algorithm-handler";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Null, Ptr } from "../memory-allocator/allocator.ts";
import { ElementBtreeNode } from "./el-btree-node.ts";
import { BtreeNode } from "./element-types/node.ts";

enum Color {
	shifting = "#345ceb",
	assign = "#00ff00",
	traverse = "#ffff00",
	full = "#ff0000",
};

class DeleteBtree extends AlgorithmHandler {
	root: null | ElementBtreeNode = null;
	toDeleteKey: number = 0;

	init(canvas: CanvasHandler, node: ElementBtreeNode, key: number) {
		this.toDeleteKey = key;
		this.root = node;
		this.initAsyncGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root = null;
		this.toDeleteKey = 0;
		canvas.redraw();
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


	getPredecessor(node: ElementBtreeNode, idx: number, canvas: CanvasHandler): number {
		let cur = node.children.v.arr[idx];

		while(!Null.isNull(cur) && !((cur as Ptr<ElementBtreeNode>).v.isLeaf.value)) {
			cur = (cur as Ptr<ElementBtreeNode>).v.children.v.arr[(cur as Ptr<ElementBtreeNode>).v.curKeyCount.value];
		}

		if(Null.isNull(cur)) {
			return 0;
		}

		return (cur as Ptr<ElementBtreeNode>).v.keys.v.arr[(cur as Ptr<ElementBtreeNode>).v.curKeyCount.value - 1];
	}

	getSuccessor(node: ElementBtreeNode, idx: number, canvas: CanvasHandler): number {
		let cur = node.children.v.arr[idx + 1];

		while(!Null.isNull(cur) && !((cur as Ptr<ElementBtreeNode>).v.isLeaf.value)) {
			cur = (cur as Ptr<ElementBtreeNode>).v.children.v.arr[0];
		}

		if(Null.isNull(cur)) {
			return 0;
		}

		return (cur as Ptr<ElementBtreeNode>).v.keys.v.arr[0];
	}

	merge(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		if(Null.isNull(node.children.v.arr[idx]) || Null.isNull(node.children.v.arr[idx + 1])) {
			return;
		}

		let child = (node.children.v.arr[idx] as Ptr<ElementBtreeNode>).v;
		let sibbling = (node.children.v.arr[idx + 1] as Ptr<ElementBtreeNode>).v;

		const T = node.T;

		child.keys.v.arr[T - 1] = node.keys.v.arr[idx];

		for (let i = 0; i < sibbling.curKeyCount.value; i++) {
			child.keys.v.arr[i + T] = sibbling.keys.v.arr[i];
		}

		if (!child.isLeaf.value) {
			for (let i = 0; i <= sibbling.curKeyCount.value; i++) {
				child.children.v.arr[i + T] = sibbling.children.v.arr[i];
			}
		}

		for (let i = idx + 1; i < node.curKeyCount.value; i++) {
			node.keys.v.arr[i - 1] = node.keys.v.arr[i];
		}

		for (let i = idx + 2; i <= node.curKeyCount.value; i++) {
			node.children.v.arr[i - 1] = node.children.v.arr[i];
		}

		child.curKeyCount.value += sibbling.curKeyCount.value + 1;
		node.curKeyCount.value--;

		sibbling.remove(canvas);
	}

	fill(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		if (idx != 0 && (node.children.v.arr[idx - 1] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= node.T) {
			this.borrowFromPrev(node, idx, canvas);
		} else if (idx != node.curKeyCount.value && (node.children.v.arr[idx + 1] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= node.T) {
			this.borrowFromNext(node, idx, canvas);
		} else {
			if (idx != node.curKeyCount.value) {
				this.merge(node, idx, canvas);
			} else {
				this.merge(node, idx - 1, canvas);
			}
		}
	}

	borrowFromPrev(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		let child = (node.children.v.arr[idx] as Ptr<ElementBtreeNode>).v;
		let sibbling = (node.children.v.arr[idx - 1] as Ptr<ElementBtreeNode>).v;

		if(child === null || sibbling === null) {
			return;
		}

		for (let i = child.curKeyCount.value - 1; i >= 0; --i) {
			child.keys.v.arr[i + 1] = child.keys.v.arr[i];
		}

		if (!child.isLeaf.value) {
			for (let i = child.curKeyCount.value; i >= 0; --i) {
				child.children.v.arr[i + 1] = child.children.v.arr[i];
			}
		}

		child.keys.v.arr[0] = node.keys.v.arr[idx - 1];

		if (!child.isLeaf.value) {
			child.children.v.arr[0] = sibbling.children.v.arr[sibbling.curKeyCount.value];
		}

		node.keys.v.arr[idx - 1] = sibbling.keys.v.arr[sibbling.curKeyCount.value - 1];

		child.curKeyCount.value += 1;
		sibbling.curKeyCount.value -= 1;
	}

	borrowFromNext(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		let child = (node.children.v.arr[idx] as Ptr<ElementBtreeNode>).v;
		let sibbling = (node.children.v.arr[idx + 1] as Ptr<ElementBtreeNode>).v;

		if(child === null || sibbling === null) {
			return;
		}

		child.keys.v.arr[child.curKeyCount.value] = node.keys.v.arr[idx];

		if (!child.isLeaf.value) {
			child.children.v.arr[child.curKeyCount.value + 1] = sibbling.children.v.arr[0];
		}

		node.keys.v.arr[idx] = sibbling.keys.v.arr[0];

		for (let i = 1; i < sibbling.curKeyCount.value; ++i) {
			sibbling.keys.v.arr[i - 1] = sibbling.keys.v.arr[i];
		}

		if (!sibbling.isLeaf.value) {
			for (let i = 1; i <= sibbling.curKeyCount.value; ++i) {
				sibbling.children.v.arr[i - 1] = sibbling.children.v.arr[i];
			}
		}

		child.curKeyCount.value += 1;
		sibbling.curKeyCount.value -= 1;
	}

	deleteFromNonLeaf(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		const T = node.T;

		if((node.children.v.arr[idx] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= T) {
			const pred = this.getPredecessor(node, idx, canvas);
			node.keys.v.arr[idx] = pred;
			this.deleteRecursive((node.children.v.arr[idx] as Ptr<ElementBtreeNode>).v, pred, canvas);
		} else if((node.children.v.arr[idx + 1] as Ptr<ElementBtreeNode>).v.curKeyCount.value >= T) {
			const succ = this.getSuccessor(node, idx, canvas);
			node.keys.v.arr[idx] = succ;
			this.deleteRecursive((node.children.v.arr[idx + 1] as Ptr<ElementBtreeNode>).v, succ, canvas);
		} else {
			let k = node.keys.v.arr[idx];
			this.merge(node, idx, canvas);
			this.deleteRecursive((node.children.v.arr[idx] as Ptr<ElementBtreeNode>).v, k, canvas);
		}
	}

	deleteFromLeaf(node: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		for(let i = idx + 1; i < node.curKeyCount.value; i++) {
			node.keys.v.arr[i - 1] = node.keys.v.arr[i];
		}
		node.curKeyCount.value--;
	}

	deleteRecursive(node: ElementBtreeNode, key: number, canvas: CanvasHandler) {
		const T = node.T;
		let idx = 0;
		
		while(idx < node.curKeyCount.value && node.keys.v.arr[idx] < key) {
			idx++;
		}

		if(idx < node.curKeyCount.value && node.keys.v.arr[idx] === key) {
			if(node.isLeaf.value) {
				this.deleteFromLeaf(node, idx, canvas);
			} else {
				this.deleteFromNonLeaf(node, idx, canvas);
			}
		} else {
			if (node.isLeaf.value) {
				setErrorPopupText(`The key "${key}" is not present in the tree`);
				return;
			}

			const flag = ((idx == node.curKeyCount.value) ? true : false);

			if ((node.children.v.arr[idx] as Ptr<ElementBtreeNode>).v.curKeyCount.value < T) {
				this.fill(node, idx, canvas);
			}

			if (flag && idx > node.curKeyCount.value) {
				this.deleteRecursive((node.children.v.arr[idx - 1] as Ptr<ElementBtreeNode>).v, key, canvas);
			} else {
				this.deleteRecursive((node.children.v.arr[idx] as Ptr<ElementBtreeNode>).v, key, canvas);
			}
		}
	}

	async *deleteKey(root: ElementBtreeNode, key: number, canvas: CanvasHandler) {
		this.deleteRecursive(root, key, canvas);

		if(root.curKeyCount.value === 0) {
			const temp = root;
			if(!root.isLeaf.value) {
				const child = root.children.v.arr[0];
				if(!Null.isNull(child)) {
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

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.deleteKey(this.root, this.toDeleteKey, canvas);
			let result: IteratorResult<undefined | never, void>;

			while(true) {
				result = await gen.next();
				if(result.done) {
					break;
				}
				yield null;
			}
		}
	}
}

export default new DeleteBtree();
