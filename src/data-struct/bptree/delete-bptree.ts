import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
import { ElementBptreeNode } from "./el-bptree-node.ts";
import { BptreeNode } from "./element-types/node.ts";

enum Color {
	shifting = "#345ceb",
	assign = "#00ff00",
	traverse = "#ffff00",
	delete = "#ff0000",
	merge = "#ff005d",
	foundInInternal = "#ff8400",
};

class DeleteBptree extends AlgorithmHandler {
	root: null | ElementBptreeNode = null;
	toDeleteKey: number = 0;

	init(canvas: CanvasHandler, node: ElementBptreeNode, key: number) {
		this.toDeleteKey = key;
		this.root = node.getRoot();
		this.initGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		this.toDeleteKey = 0;
	}

	*merge(node: ElementBptreeNode, idx: number, canvas: CanvasHandler) {
		if((node.children[idx] === null) || (node.children[idx + 1] === null)) {
			return;
		}

		let child = (node.children[idx] as Ptr<ElementBptreeNode>).v;
		let sibbling = (node.children[idx + 1] as Ptr<ElementBptreeNode>).v;

		child.bg = Color.merge;
		sibbling.bg = Color.merge;
		child.draw(canvas.ctx);
		sibbling.draw(canvas.ctx);
		yield;
		child.bg = BptreeNode.nodeBg;
		child.draw(canvas.ctx);
		sibbling.bg = BptreeNode.nodeBg;
		sibbling.draw(canvas.ctx);

		if(child === null || sibbling === null) {
			return;
		}

		let childCurKeyCount = child.curKeyCount.value;

		if(child.isLeaf.value) {
			child.curKeyCount.value += sibbling.curKeyCount.value;
		} else {
			child.curKeyCount.value += sibbling.curKeyCount.value + 1;
		}

		yield* node.animateCellBg(canvas, idx, Color.merge);
		child.keys[childCurKeyCount] = node.keys[idx];
		yield* child.animateCellBg(canvas, childCurKeyCount, Color.merge);

		if(sibbling.curKeyCount.value === 0 || child.keys[childCurKeyCount] !== sibbling.keys[0]) {
			childCurKeyCount++;
		}

		for(let i = 0; i < sibbling.curKeyCount.value; i++) {
			yield* sibbling.animateCellBg(canvas, i, Color.merge);
			child.keys[i + childCurKeyCount] = sibbling.keys[i];
			yield* child.animateCellBg(canvas, i + childCurKeyCount, Color.merge);
		}

		if(!child.isLeaf.value) {
			for(let i = 0; i <= sibbling.curKeyCount.value; i++) {
				child.children[i + childCurKeyCount] = sibbling.children[i];
			}
		}

		for(let i = idx + 1; i < node.curKeyCount.value; i++) {
			yield* node.animateCellBg(canvas, i, Color.shifting);
			node.keys[i - 1] = node.keys[i];
			yield* node.animateCellBg(canvas, i - 1, Color.shifting);
		}

		for(let i = idx + 2; i <= node.curKeyCount.value; i++) {
			node.children[i - 1] = node.children[i];
		}

		if(child.isLeaf.value) {
			child.nextNode = sibbling.nextNode;
			canvas.redraw();
			yield;
		}

		node.curKeyCount.value--;
		yield* node.animateCellBg(canvas, node.curKeyCount.value, Color.delete);

		yield* sibbling.animateNodeBg(canvas, Color.delete);
		sibbling.remove(canvas);
		canvas.redraw();
		yield;
	}

	*borrowFromPrev(node: ElementBptreeNode, idx: number, canvas: CanvasHandler) {
		if((node.children[idx] === null) || (node.children[idx - 1] === null)) {
			return;
		}

		let child = (node.children[idx] as Ptr<ElementBptreeNode>).v;
		let sibbling = (node.children[idx - 1] as Ptr<ElementBptreeNode>).v;

		child.curKeyCount.value += 1;

		for(let i = child.curKeyCount.value - 2; i >= 0; --i) {
			yield* child.animateCellBg(canvas, i, Color.shifting);
			child.keys[i + 1] = child.keys[i];
			yield* child.animateCellBg(canvas, i + 1, Color.shifting);
		}

		if(!child.isLeaf.value) {
			for(let i = child.curKeyCount.value - 1; i >= 0; --i) {
				child.children[i + 1] = child.children[i];
			}
			child.children[0] = sibbling.children[sibbling.curKeyCount.value];
		}

		if(child.isLeaf.value) {
			yield* sibbling.animateCellBg(canvas, sibbling.curKeyCount.value - 1, Color.shifting);
			node.keys[idx - 1] = sibbling.keys[sibbling.curKeyCount.value - 1];
			yield* node.animateCellBg(canvas, idx - 1, Color.shifting);

			yield* node.animateCellBg(canvas, idx - 1, Color.shifting);
			child.keys[0] = node.keys[idx - 1];
			yield* child.animateCellBg(canvas, 0, Color.shifting);
		} else {
			yield* node.animateCellBg(canvas, idx - 1, Color.shifting);
			child.keys[0] = node.keys[idx - 1];
			yield* child.animateCellBg(canvas, 0, Color.shifting);

			yield* sibbling.animateCellBg(canvas, sibbling.curKeyCount.value - 1, Color.shifting);
			node.keys[idx - 1] = sibbling.keys[sibbling.curKeyCount.value - 1];
			yield* node.animateCellBg(canvas, idx - 1, Color.shifting);
		}

		sibbling.curKeyCount.value -= 1;
		yield* sibbling.animateCellBg(canvas, sibbling.curKeyCount.value, Color.delete);
	}

	*borrowFromNext(node: ElementBptreeNode, idx: number, canvas: CanvasHandler) {
		if((node.children[idx] === null) || (node.children[idx + 1] === null)) {
			return;
		}

		let child = (node.children[idx] as Ptr<ElementBptreeNode>).v;
		let sibbling = (node.children[idx + 1] as Ptr<ElementBptreeNode>).v;

		child.curKeyCount.value += 1;

		yield* node.animateCellBg(canvas, idx, Color.shifting);
		child.keys[child.curKeyCount.value - 1] = node.keys[idx];
		yield* child.animateCellBg(canvas, child.curKeyCount.value - 1, Color.shifting);

		if(!child.isLeaf.value) {
			child.children[child.curKeyCount.value] = sibbling.children[0];
		}

		if(!sibbling.isLeaf.value) {
			yield* sibbling.animateCellBg(canvas, 0, Color.shifting);
			node.keys[idx] = sibbling.keys[0];
			yield* node.animateCellBg(canvas, idx, Color.shifting);
		} else {
			yield* sibbling.animateCellBg(canvas, 1, Color.shifting);
			node.keys[idx] = sibbling.keys[1];
			yield* node.animateCellBg(canvas, idx, Color.shifting);
		}

		for(let i = 1; i < sibbling.curKeyCount.value; ++i) {
			yield* sibbling.animateCellBg(canvas, i, Color.shifting);
			sibbling.keys[i - 1] = sibbling.keys[i];
			yield* sibbling.animateCellBg(canvas, i - 1, Color.shifting);
		}

		if(!sibbling.isLeaf.value) {
			for(let i = 1; i <= sibbling.curKeyCount.value; ++i) {
				sibbling.children[i - 1] = sibbling.children[i];
			}
		}

		sibbling.curKeyCount.value -= 1;
		yield* sibbling.animateCellBg(canvas, sibbling.curKeyCount.value, Color.delete);
	}

	*fill(node: ElementBptreeNode, idx: number, canvas: CanvasHandler) {
		const T = node.T;
		const prevChild = (node.children[idx - 1] as Ptr<ElementBptreeNode>);
		const nextChild = (node.children[idx + 1] as Ptr<ElementBptreeNode>);

		if(prevChild && idx !== 0 && prevChild.v.curKeyCount.value >= T) {
			yield* this.borrowFromPrev(node, idx, canvas);
		} else if(nextChild && idx !== node.curKeyCount.value && nextChild.v.curKeyCount.value >= T) {
			yield* this.borrowFromNext(node, idx, canvas);
		} else {
			if(idx !== node.curKeyCount.value) {
				yield* this.merge(node, idx, canvas);
			} else {
				yield* this.merge(node, idx - 1, canvas);
				return true;
			}
		}
		return false;
	}

	*deleteFromLeaf(node: ElementBptreeNode, idx: number, canvas: CanvasHandler) {
		for(let i = idx + 1; i < node.curKeyCount.value; i++) {
			yield* node.animateCellBg(canvas, i, Color.shifting);
			node.keys[i - 1] = node.keys[i];
			yield* node.animateCellBg(canvas, i - 1, Color.shifting);
		}

		node.curKeyCount.value--;
		yield* node.animateCellBg(canvas, node.curKeyCount.value, Color.delete);
	}

	indexOfChild(parent: ElementBptreeNode, child: ElementBptreeNode) {
		for(let i = 0; i <= parent.curKeyCount.value; i++) {
			if((parent.children[i] as Ptr<ElementBptreeNode>).v === child) {
				return i;
			}
		}
		return -1;
	}

	*indexOfKey(node: ElementBptreeNode, key: number, canvas: CanvasHandler) {
		for(let i = 0; i < node.curKeyCount.value; i++) {
			yield* node.animateCellBg(canvas, i, Color.traverse);
			if(node.keys[i] === key) {
				return i;
			}
		}
		return -1;
	}

	*deleteIterative(root: ElementBptreeNode, value: number, canvas: CanvasHandler) {
		const T = root.T;
		let stack: Array<ElementBptreeNode> = [];

		let node: Ptr<ElementBptreeNode> | null = root.ptr;
		let foundInInternalNode: null | ElementBptreeNode = null;

		let idx = 0;
		while(node !== null) {
			const n: ElementBptreeNode = node.v;

			yield* n.animateNodeBg(canvas, Color.traverse);

			stack.push(n);
			idx = 0;
			while(idx < n.curKeyCount.value && n.keys[idx] as number < value) {
				yield* n.animateCellBg(canvas, idx, Color.traverse);
				idx++;
			}

			if(idx < n.curKeyCount.value && n.keys[idx] === value && !n.isLeaf.value) {
				yield* n.animateCellBg(canvas, idx, Color.traverse);
				foundInInternalNode = n;
				n.bg = Color.foundInInternal;
				n.draw(canvas.ctx);
				yield;

				n.drawLineToChild(canvas.ctx, idx + 1, Color.traverse);
				yield;
				n.drawLineToChild(canvas.ctx, idx + 1);

				node = n.children[idx + 1];
				continue;
			}

			node = n.children[idx];
		}

		let leaf = stack.pop();

		if(leaf === undefined || leaf.curKeyCount.value === idx) {
			setErrorPopupText(`The value "${value}" is not present in the tree.`);
			return;
		}

		const flag = leaf.curKeyCount.value <= T - 1 && leaf !== root;

		if(flag) {
			const parent = stack[stack.length - 1];

			const isChangeLeaf = yield* this.fill(parent, this.indexOfChild(parent, leaf), canvas);
			if(isChangeLeaf) {
				leaf = (parent.children[parent.curKeyCount.value] as Ptr<ElementBptreeNode>).v;
			}
		}

		let result = yield* this.indexOfKey(leaf, value, canvas);
		if(result !== -1) {
			yield* this.deleteFromLeaf(leaf, result, canvas);
		}

		if(foundInInternalNode !== null) {
			yield* foundInInternalNode.animateNodeBg(canvas, Color.traverse);

			let result = yield* this.indexOfKey(foundInInternalNode, value, canvas);
			if(result >= 0) {
				yield* leaf.animateCellBg(canvas, 0, Color.assign);
				foundInInternalNode.keys[result] = leaf.keys[0];
				yield* foundInInternalNode.animateCellBg(canvas, result, Color.assign);
			}
		}

		if(!flag) {
			return;
		}

		while(stack.length !== 0) {
			let node = stack.pop();
			const parent = stack[stack.length - 1];
			if(!node) return;

			yield* node.animateNodeBg(canvas, Color.traverse);

			if(node === root) {
				break;
			}

			if(node.curKeyCount.value < T - 1) {
				yield* this.fill(parent, this.indexOfChild(parent, node), canvas);
			}
		}
	}

	*deleteValue(root: ElementBptreeNode, value: number, canvas: CanvasHandler) {
		yield* this.deleteIterative(root, value, canvas);

		if(root.curKeyCount.value === 0) {
			const temp = root;

			yield* root.animateNodeBg(canvas, Color.delete);

			if(!root.isLeaf.value) {
				const child = root.children[0];
				if(child !== null) {
					(child as Ptr<ElementBptreeNode>).v.parentNode = null;
					root = (child as Ptr<ElementBptreeNode>).v;
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
			yield* this.deleteValue(this.root, this.toDeleteKey, canvas);
		}
	}
}

export default new DeleteBptree();
