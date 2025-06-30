import { AlgorithmHandler } from "../algorithm-handler.ts";
import { GAP } from "../canvas.ts";
import { setInfoPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
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
		const fullChild: ElementBptreeNode = (parent.children[idx] as Ptr<ElementBptreeNode>).v;
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
			yield* fullChild.animateCellBg(canvas, i + t, Color.shifting);
			newChild.keys[i] = fullChild.keys[i + t];
			yield* newChild.animateCellBg(canvas, i, Color.shifting);
		}

		if (!fullChild.isLeaf.value) {
			for (let i = 0; i < newChild.curKeyCount.value + 1; i++) {
				newChild.children[i] = fullChild.children[i + t];
			}
			yield* fullChild.animateCellBg(canvas, t - 1, Color.shifting);
			fullChild.curKeyCount.value = t - 1;
		} else {
			newChild.nextNode = fullChild.nextNode;
			fullChild.nextNode = newChild.ptr;
			yield* fullChild.animateCellBg(canvas, fullChild.curKeyCount.value - newChild.curKeyCount.value, Color.shifting);
			fullChild.curKeyCount.value -= newChild.curKeyCount.value;
		}


		for (let i = parent.curKeyCount.value; i >= idx + 1; i--) {
			parent.children[i + 1] = parent.children[i];
		}
		parent.children[idx + 1] = newChild.ptr;

		for (let i = parent.curKeyCount.value - 1; i >= idx; i--) {
			yield* parent.animateCellBg(canvas, i, Color.shifting);
			parent.keys[i + 1] = parent.keys[i];
			yield* parent.animateCellBg(canvas, i + 1, Color.shifting);
		}

		if (!fullChild.isLeaf.value) {
			parent.keys[idx] = fullChild.keys[t - 1];
		} else {
			parent.keys[idx] = fullChild.keys[t];
		}
		parent.curKeyCount.value++;
		yield* parent.animateCellBg(canvas, idx, Color.shifting);
		
		await parent.rearrangeTree(canvas);
	}

	async *insertKey(root: ElementBptreeNode, key: number, canvas: CanvasHandler) {
		const M = root.M;

		yield* root.animateNodeBg(canvas, Color.traverse);

		if(root.curKeyCount.value === M - 1) {
			yield* root.animateNodeBg(canvas, Color.full);

			const newRoot = new ElementBptreeNode(
				root.x,
				root.y - (BptreeNode.cellHeight * 3),
				root.M,
				false,
				null
			);
			canvas.addElements(newRoot);
			newRoot.children[0] = root.ptr;
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
			while (i < current.curKeyCount.value && (current.keys[i] as number) < key) {
				yield* current.animateCellBg(canvas, i, Color.traverse);
				i++;
			}

			current.drawLineToChild(canvas.ctx, i, Color.traverse);
			yield;
			current.drawLineToChild(canvas.ctx, i);

			if(
				(current.children[i] !== null) &&
				(current.children[i] as Ptr<ElementBptreeNode>).v.curKeyCount.value === M - 1
			) {
				yield* (current.children[i] as Ptr<ElementBptreeNode>).v.animateNodeBg(canvas, Color.full);
				{
					const a = this.splitNode(current, i, canvas);
					while(!(await a.next()).done) yield;
					yield;
				}
				if((current.keys[i] as number) < key) {
					i++;
				}
				current.drawLineToChild(canvas.ctx, i, Color.traverse);
				yield;
				current.drawLineToChild(canvas.ctx, i);
			}
			current = (current.children[i] as Ptr<ElementBptreeNode>).v;
		}

		let i = current.curKeyCount.value - 1;
		current.curKeyCount.value++;
		while (i >= 0 && (current.keys[i] as number) > key) {
			yield* current.animateCellBg(canvas, i, Color.shifting);
			current.keys[i + 1] = current.keys[i];
			yield* current.animateCellBg(canvas, i + 1, Color.shifting);
			i--;
		}

		yield* current.animateCellBg(canvas, i + 1, Color.assign);

		current.keys[i + 1] = key;

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
