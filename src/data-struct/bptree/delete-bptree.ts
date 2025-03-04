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
		this.root = node;
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

		for(const _ of node.animateCellBg(canvas, idx, Color.merge)) yield;
		child.keys[childCurKeyCount] = node.keys[idx];
		for(const _ of child.animateCellBg(canvas, childCurKeyCount, Color.merge)) yield;

		if(sibbling.curKeyCount.value === 0 || child.keys[childCurKeyCount] !== sibbling.keys[0]) {
			childCurKeyCount++;
		}

		for(let i = 0; i < sibbling.curKeyCount.value; i++) {
			for(const _ of sibbling.animateCellBg(canvas, i, Color.merge)) yield;
			child.keys[i + childCurKeyCount] = sibbling.keys[i];
			for(const _ of child.animateCellBg(canvas, i + childCurKeyCount, Color.merge)) yield;
		}

		if(!child.isLeaf.value) {
			for(let i = 0; i <= sibbling.curKeyCount.value; i++) {
				child.children[i + childCurKeyCount] = sibbling.children[i];
			}
		}

		for(let i = idx + 1; i < node.curKeyCount.value; i++) {
			for(const _ of node.animateCellBg(canvas, i, Color.shifting)) yield;
			node.keys[i - 1] = node.keys[i];
			for(const _ of node.animateCellBg(canvas, i - 1, Color.shifting)) yield;
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
		for(const _ of node.animateCellBg(canvas, node.curKeyCount.value, Color.delete)) yield;

		for(const _ of sibbling.animateNodeBg(canvas, Color.delete)) yield;
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
			for(const _ of child.animateCellBg(canvas, i, Color.shifting)) yield;
			child.keys[i + 1] = child.keys[i];
			for(const _ of child.animateCellBg(canvas, i + 1, Color.shifting)) yield;
		}

		if(!child.isLeaf.value) {
			for(let i = child.curKeyCount.value - 1; i >= 0; --i) {
				child.children[i + 1] = child.children[i];
			}
			child.children[0] = sibbling.children[sibbling.curKeyCount.value];
		}

		if(child.isLeaf.value) {
			for(const _ of sibbling.animateCellBg(canvas, sibbling.curKeyCount.value - 1, Color.shifting)) yield;
			node.keys[idx - 1] = sibbling.keys[sibbling.curKeyCount.value - 1];
			for(const _ of node.animateCellBg(canvas, idx - 1, Color.shifting)) yield;

			for(const _ of node.animateCellBg(canvas, idx - 1, Color.shifting)) yield;
			child.keys[0] = node.keys[idx - 1];
			for(const _ of child.animateCellBg(canvas, 0, Color.shifting)) yield;
		} else {
			for(const _ of node.animateCellBg(canvas, idx - 1, Color.shifting)) yield;
			child.keys[0] = node.keys[idx - 1];
			for(const _ of child.animateCellBg(canvas, 0, Color.shifting)) yield;

			for(const _ of sibbling.animateCellBg(canvas, sibbling.curKeyCount.value - 1, Color.shifting)) yield;
			node.keys[idx - 1] = sibbling.keys[sibbling.curKeyCount.value - 1];
			for(const _ of node.animateCellBg(canvas, idx - 1, Color.shifting)) yield;
		}

		sibbling.curKeyCount.value -= 1;
		for(const _ of sibbling.animateCellBg(canvas, sibbling.curKeyCount.value, Color.delete)) yield;
	}

	*borrowFromNext(node: ElementBptreeNode, idx: number, canvas: CanvasHandler) {
		if((node.children[idx] === null) || (node.children[idx + 1] === null)) {
			return;
		}

		let child = (node.children[idx] as Ptr<ElementBptreeNode>).v;
		let sibbling = (node.children[idx + 1] as Ptr<ElementBptreeNode>).v;

		child.curKeyCount.value += 1;

		for(const _ of node.animateCellBg(canvas, idx, Color.shifting)) yield;
		child.keys[child.curKeyCount.value - 1] = node.keys[idx];
		for(const _ of child.animateCellBg(canvas, child.curKeyCount.value - 1, Color.shifting)) yield;

		if(!child.isLeaf.value) {
			child.children[child.curKeyCount.value] = sibbling.children[0];
		}

		if(!sibbling.isLeaf.value) {
			for(const _ of sibbling.animateCellBg(canvas, 0, Color.shifting)) yield;
			node.keys[idx] = sibbling.keys[0];
			for(const _ of node.animateCellBg(canvas, idx, Color.shifting)) yield;
		} else {
			for(const _ of sibbling.animateCellBg(canvas, 1, Color.shifting)) yield;
			node.keys[idx] = sibbling.keys[1];
			for(const _ of node.animateCellBg(canvas, idx, Color.shifting)) yield;
		}

		for(let i = 1; i < sibbling.curKeyCount.value; ++i) {
			for(const _ of sibbling.animateCellBg(canvas, i, Color.shifting)) yield;
			sibbling.keys[i - 1] = sibbling.keys[i];
			for(const _ of sibbling.animateCellBg(canvas, i - 1, Color.shifting)) yield;
		}

		if(!sibbling.isLeaf.value) {
			for(let i = 1; i <= sibbling.curKeyCount.value; ++i) {
				sibbling.children[i - 1] = sibbling.children[i];
			}
		}

		sibbling.curKeyCount.value -= 1;
		for(const _ of sibbling.animateCellBg(canvas, sibbling.curKeyCount.value, Color.delete)) yield;
	}

	*fill(node: ElementBptreeNode, idx: number, canvas: CanvasHandler) {
		const T = node.T;
		const prevChild = (node.children[idx - 1] as Ptr<ElementBptreeNode>);
		const nextChild = (node.children[idx + 1] as Ptr<ElementBptreeNode>);

		if(prevChild && idx !== 0 && prevChild.v.curKeyCount.value >= T) {
			for(const _ of this.borrowFromPrev(node, idx, canvas)) yield;
		} else if(nextChild && idx !== node.curKeyCount.value && nextChild.v.curKeyCount.value >= T) {
			for(const _ of this.borrowFromNext(node, idx, canvas)) yield;
		} else {
			if(idx !== node.curKeyCount.value) {
				for(const _ of this.merge(node, idx, canvas)) yield;
			} else {
				for(const _ of this.merge(node, idx - 1, canvas)) yield;
				return true;
			}
		}
		return false;
	}

	*deleteFromLeaf(node: ElementBptreeNode, idx: number, canvas: CanvasHandler) {
		for(let i = idx + 1; i < node.curKeyCount.value; i++) {
			for(const _ of node.animateCellBg(canvas, i, Color.shifting)) yield;
			node.keys[i - 1] = node.keys[i];
			for(const _ of node.animateCellBg(canvas, i - 1, Color.shifting)) yield;
		}

		node.curKeyCount.value--;
		for(const _ of node.animateCellBg(canvas, node.curKeyCount.value, Color.delete)) yield;
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
			for(const _ of node.animateCellBg(canvas, i, Color.traverse)) yield;
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

			for(const _ of n.animateNodeBg(canvas, Color.traverse)) yield;

			stack.push(n);
			idx = 0;
			while(idx < n.curKeyCount.value && n.keys[idx] as number < value) {
				for(const _ of n.animateCellBg(canvas, idx, Color.traverse)) yield;
				idx++;
			}

			if(idx < n.curKeyCount.value && n.keys[idx] === value && !n.isLeaf.value) {
				for(const _ of n.animateCellBg(canvas, idx, Color.traverse)) yield;
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

			let gen = this.fill(parent, this.indexOfChild(parent, leaf), canvas);
			let result;

			while(true) {
				result = gen.next();
				if(result.done) {
					const isChangeLeaf = result.value;
					if(isChangeLeaf) {
						leaf = (parent.children[parent.curKeyCount.value] as Ptr<ElementBptreeNode>).v;
					}
					break;
				}
				yield;
			}
		}

		let gen = this.indexOfKey(leaf, value, canvas);
		let result;
		while(true) {
			result = gen.next();
			if(result.done) {
				if(result.value !== -1) {
					for(const _ of this.deleteFromLeaf(leaf, result.value, canvas)) yield;
				}
				break;
			}
			yield;
		}

		if(foundInInternalNode !== null) {
			for(const _ of foundInInternalNode.animateNodeBg(canvas, Color.traverse)) yield;

			let gen = this.indexOfKey(foundInInternalNode, value, canvas);
			let result;
			while(true) {
				result = gen.next();
				if(result.done) {
					if(result.value >= 0) {
						for(const _ of leaf.animateCellBg(canvas, 0, Color.assign)) yield;
						foundInInternalNode.keys[result.value] = leaf.keys[0];
						for(const _ of foundInInternalNode.animateCellBg(canvas, result.value, Color.assign)) yield;
					}
					break;
				}
				yield;
			}
		}

		if(!flag) {
			return;
		}

		while(stack.length !== 0) {
			let node = stack.pop();
			const parent = stack[stack.length - 1];
			if(!node) return;

			for(const _ of node.animateNodeBg(canvas, Color.traverse)) yield;

			if(node === root) {
				break;
			}

			if(node.curKeyCount.value < T - 1) {
				for(const _ of this.fill(parent, this.indexOfChild(parent, node), canvas)) yield;
			}
		}
	}

	*deleteValue(root: ElementBptreeNode, value: number, canvas: CanvasHandler) {
		for(const _ of this.deleteIterative(root, value, canvas)) yield;

		if(root.curKeyCount.value === 0) {
			const temp = root;

			for(const _ of root.animateNodeBg(canvas, Color.delete)) yield;

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
			let gen = this.deleteValue(this.root, this.toDeleteKey, canvas);
			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new DeleteBptree();
