import { AlgorithmHandler } from "../algorithm-handler";
import { GAP } from "../canvas.ts";
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

class InsertBtree extends AlgorithmHandler {
	root: null | ElementBtreeNode = null;
	toInsertKey: number = 0;

	init(canvas: CanvasHandler, node: ElementBtreeNode, toInsertKey: number, doneCallback?: () => void) {
		this.toInsertKey = toInsertKey;
		this.root = node;
		this.doneCallback = doneCallback;
		this.initAsyncGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root = null;
		this.toInsertKey = 0;
		canvas.redraw();
	}

	async *splitNode(parent: ElementBtreeNode, idx: number, canvas: CanvasHandler) {
		const fullChild: Ptr<ElementBtreeNode> = parent.children.v.arr[idx] as Ptr<ElementBtreeNode>;
		const newChild = new ElementBtreeNode(
			parent.x + ((parent.totalWidth / 2) * (idx + 1)),
			parent.y + (BtreeNode.cellHeight) + (GAP * 2),
			parent.M,
			fullChild.v.isLeaf.value,
			parent
		);

		canvas.addElements(newChild);
		newChild.draw(canvas.ctx);
		yield;

		const t = parent.T;
		newChild.curKeyCount.value = fullChild.v.curKeyCount.value - t;

		for (let i = 0; i < newChild.curKeyCount.value; i++) {
			for(const _ of this.animateCellBg(canvas, fullChild.v, i + t, Color.shifting)) yield;
			newChild.keys.v.arr[i] = fullChild.v.keys.v.arr[i + t];
			for(const _ of this.animateCellBg(canvas, newChild, i, Color.shifting)) yield;
		}

		if (!fullChild.v.isLeaf.value) {
			for (let i = 0; i < newChild.curKeyCount.value + 1; i++) {
				newChild.children.v.arr[i] = fullChild.v.children.v.arr[i + t];
			}
		}

		for (let i = parent.curKeyCount.value; i >= idx + 1; i--) {
			parent.children.v.arr[i + 1] = parent.children.v.arr[i];
		}
		parent.children.v.arr[idx + 1] = newChild.ptr;

		for (let i = parent.curKeyCount.value - 1; i >= idx; i--) {
			for(const _ of this.animateCellBg(canvas, parent, i, Color.shifting)) yield;
			parent.keys.v.arr[i + 1] = parent.keys.v.arr[i];
			for(const _ of this.animateCellBg(canvas, parent, i + 1, Color.shifting)) yield;
		}

		parent.curKeyCount.value++;
		for(const _ of this.animateCellBg(canvas, fullChild.v, t - 1, Color.assign)) yield;
		fullChild.v.curKeyCount.value = t - 1;
		parent.keys.v.arr[idx] = fullChild.v.keys.v.arr[t - 1];
		for(const _ of this.animateCellBg(canvas, parent, idx, Color.assign)) yield;
		
		await parent.rearrangeTree(canvas);
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

	async *insertKey(root: ElementBtreeNode, key: number, canvas: CanvasHandler) {
		const M = root.M;

		for(const _ of this.animateNodeBg(canvas, root, Color.traverse)) yield;

		if(root.curKeyCount.value === M - 1) {
			for(const _ of this.animateNodeBg(canvas, root, Color.full)) yield;

			const newRoot = new ElementBtreeNode(
				root.x,
				root.y - (BtreeNode.cellHeight * 3),
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

		let current: ElementBtreeNode = root;
		while(!current.isLeaf.value) {
			let i = 0;
			while (i < current.curKeyCount.value && (current.keys.v.arr[i] as number) < key) {
				for(const _ of this.animateCellBg(canvas, current, i, Color.traverse)) yield;
				i++;
			}

			current.drawLineToChild(canvas.ctx, i, Color.traverse);
			yield;
			current.drawLineToChild(canvas.ctx, i);

			if(
				(current.children.v.arr[i].constructor.name !== Null.name) &&
				(current.children.v.arr[i] as Ptr<ElementBtreeNode>).v.curKeyCount.value === M - 1
			) {
				for(const _ of this.animateNodeBg(canvas, (current.children.v.arr[i] as Ptr<ElementBtreeNode>).v, Color.full)) yield;
				{
					const a = this.splitNode(current, i, canvas);
					while(!(await a.next()).done) yield;
					yield;
				}
				if ((current.keys.v.arr[i] as number) < key) {
					i++;
				}
				current.drawLineToChild(canvas.ctx, i, Color.traverse);
				yield;
				current.drawLineToChild(canvas.ctx, i);
			}
			current = (current.children.v.arr[i] as Ptr<ElementBtreeNode>).v;
		}

		let i = current.curKeyCount.value - 1;
		current.curKeyCount.value++;
		while (i >= 0 && (current.keys.v.arr[i] as number) > key) {
			for(const _ of this.animateCellBg(canvas, current, i, Color.shifting)) yield;
			current.keys.v.arr[i + 1] = current.keys.v.arr[i];
			for(const _ of this.animateCellBg(canvas, current, i + 1, Color.shifting)) yield;
			i--;
		}

		for(const _ of this.animateCellBg(canvas, current, i + 1, Color.assign)) yield;

		current.keys.v.arr[i + 1] = key;

		canvas.redraw();

		return root;
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.insertKey(this.root, this.toInsertKey, canvas);
			let result: IteratorResult<undefined, ElementBtreeNode>;

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

export default new InsertBtree();
