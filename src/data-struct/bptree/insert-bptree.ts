import { AlgorithmHandler } from "../algorithm-handler.ts";
import { GAP } from "../canvas.ts";
import { setInfoPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Null, Ptr } from "../memory-allocator/allocator.ts";
import { ElementBptreeNode } from "./el-bptree-node.ts";
import { BptreeNode } from "./element-types/node.ts";

enum Color {
	shifting = "#345ceb",
	assign = "#00ff00",
	traverse = "#ffff00",
	full = "#ff0000",
};

class InsertBptree extends AlgorithmHandler {
	root: null | ElementBptreeNode = null;
	toInsertKey: number = 0;

	init(canvas: CanvasHandler, node: ElementBptreeNode, toInsertKey: number, doneCallback?: () => void) {
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

	async *splitNode(parent: ElementBptreeNode, idx: number, canvas: CanvasHandler) {
		const fullChild: ElementBptreeNode = (parent.children.v.arr[idx] as Ptr<ElementBptreeNode>).v;
		const newChild = new ElementBptreeNode(
			parent.x + ((parent.totalWidth / 2) * (idx + 1)),
			parent.y + (BptreeNode.cellHeight) + (GAP * 2),
			parent.M,
			fullChild.isLeaf.value,
			parent
		);

		canvas.addElements(newChild);
		newChild.draw(canvas.ctx);
		yield;

		const t = parent.T;
		newChild.curKeyCount.value = t - 1;

		for (let i = 0; i < newChild.curKeyCount.value; i++) {
			for(const _ of fullChild.animateCellBg(canvas, i + t, Color.shifting)) yield;
			newChild.keys.v.arr[i] = fullChild.keys.v.arr[i + t];
			for(const _ of newChild.animateCellBg(canvas, i, Color.shifting)) yield;
		}

		if (!fullChild.isLeaf.value) {
			for (let i = 0; i < newChild.curKeyCount.value + 1; i++) {
				newChild.children.v.arr[i] = fullChild.children.v.arr[i + t];
			}
			for(const _ of fullChild.animateCellBg(canvas, t - 1, Color.shifting)) yield;
			fullChild.curKeyCount.value = t - 1;
		} else {
			newChild.nextNode = fullChild.nextNode;
			fullChild.nextNode = newChild.ptr;
			for(const _ of fullChild.animateCellBg(canvas, fullChild.curKeyCount.value - newChild.curKeyCount.value, Color.shifting)) yield;
			fullChild.curKeyCount.value -= newChild.curKeyCount.value;
		}


		for (let i = parent.curKeyCount.value; i >= idx + 1; i--) {
			parent.children.v.arr[i + 1] = parent.children.v.arr[i];
		}
		parent.children.v.arr[idx + 1] = newChild.ptr;

		for (let i = parent.curKeyCount.value - 1; i >= idx; i--) {
			for(const _ of parent.animateCellBg(canvas, i, Color.shifting)) yield;
			parent.keys.v.arr[i + 1] = parent.keys.v.arr[i];
			for(const _ of parent.animateCellBg(canvas, i + 1, Color.shifting)) yield;
		}

		if (!fullChild.isLeaf.value) {
			parent.keys.v.arr[idx] = fullChild.keys.v.arr[t - 1];
		} else {
			parent.keys.v.arr[idx] = fullChild.keys.v.arr[t];
		}
		parent.curKeyCount.value++;
		for(const _ of parent.animateCellBg(canvas, idx, Color.shifting)) yield;
		
		await parent.rearrangeTree(canvas);
	}

	async *insertKey(root: ElementBptreeNode, key: number, canvas: CanvasHandler) {
		const M = root.M;

		for(const _ of root.animateNodeBg(canvas, Color.traverse)) yield;

		if(root.curKeyCount.value === M - 1) {
			for(const _ of root.animateNodeBg(canvas, Color.full)) yield;

			const newRoot = new ElementBptreeNode(
				root.x,
				root.y - (BptreeNode.cellHeight * 3),
				root.M,
				false,
				null
			);
			canvas.addElements(newRoot);
			newRoot.children.v.arr[0] = root.ptr;
			root.parentNode = newRoot;
			{
				const a = this.splitNode(newRoot, 0, canvas);
				while(!(await a.next()).done) yield;
				yield;
			}
			root = newRoot;
		}

		let current: ElementBptreeNode = root;
		while(current.isLeaf.value === false) {
			let i = 0;
			while (i < current.curKeyCount.value && (current.keys.v.arr[i] as number) < key) {
				for(const _ of current.animateCellBg(canvas, i, Color.traverse)) yield;
				i++;
			}

			current.drawLineToChild(canvas.ctx, i, Color.traverse);
			yield;
			current.drawLineToChild(canvas.ctx, i);

			if(
				!Null.isNull(current.children.v.arr[i]) &&
				(current.children.v.arr[i] as Ptr<ElementBptreeNode>).v.curKeyCount.value === M - 1
			) {
				for(const _ of (current.children.v.arr[i] as Ptr<ElementBptreeNode>).v.animateNodeBg(canvas, Color.full)) yield;
				{
					const a = this.splitNode(current, i, canvas);
					while(!(await a.next()).done) yield;
					yield;
				}
				if((current.keys.v.arr[i] as number) < key) {
					i++;
				}
				current.drawLineToChild(canvas.ctx, i, Color.traverse);
				yield;
				current.drawLineToChild(canvas.ctx, i);
			}
			current = (current.children.v.arr[i] as Ptr<ElementBptreeNode>).v;
		}

		let i = current.curKeyCount.value - 1;
		current.curKeyCount.value++;
		while (i >= 0 && (current.keys.v.arr[i] as number) > key) {
			for(const _ of current.animateCellBg(canvas, i, Color.shifting)) yield;
			current.keys.v.arr[i + 1] = current.keys.v.arr[i];
			for(const _ of current.animateCellBg(canvas, i + 1, Color.shifting)) yield;
			i--;
		}

		for(const _ of current.animateCellBg(canvas, i + 1, Color.assign)) yield;

		current.keys.v.arr[i + 1] = key;

		canvas.redraw();

		return root;
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

export default new InsertBptree();
