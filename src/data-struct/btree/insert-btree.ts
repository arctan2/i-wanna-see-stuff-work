import { AlgorithmHandler } from "../algorithm-handler";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Null, Ptr } from "../memory-allocator/allocator.ts";
import { ElementBtreeNode } from "./el-btree-node.ts";
import { BtreeNode } from "./element-types/node.ts";

enum Color {
	visited = "#00ff00"
};

class InsertBtree extends AlgorithmHandler {
	root: null | ElementBtreeNode = null;
	toInsertKey: number = 0;

	init(canvas: CanvasHandler, node: ElementBtreeNode, toInsertKey: number, doneCallback?: () => void) {
		this.toInsertKey = toInsertKey;
		this.root = node;
		this.doneCallback = doneCallback;
		this.initGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root = null;
		this.toInsertKey = 0;
		canvas.redraw();
	}

	splitNode(parent: ElementBtreeNode, idx: number, canvas: CanvasHandler): void {
		const fullChild: Ptr<ElementBtreeNode> = parent.children.v.arr[idx] as Ptr<ElementBtreeNode>;
		const newChild = new ElementBtreeNode(
			parent.x + ((parent.totalWidth / 2) * (idx + 1)),
			parent.y + (BtreeNode.cellHeight*2),
			parent.M,
			fullChild.v.isLeaf.value,
			parent
		);

		canvas.addElements(newChild);

		const t = parent.T;
		newChild.curKeyCount.value = fullChild.v.curKeyCount.value - t;

		for (let i = 0; i < newChild.curKeyCount.value; i++) {
			newChild.keys.v.arr[i] = fullChild.v.keys.v.arr[i + t];
		}

		if (!fullChild.v.isLeaf.value) {
			for (let i = 0; i < newChild.curKeyCount.value + 1; i++) {
				newChild.children.v.arr[i] = fullChild.v.children.v.arr[i + t];
			}
		}

		fullChild.v.curKeyCount.value = t - 1;

		for (let i = parent.curKeyCount.value; i >= idx + 1; i--) {
			parent.children.v.arr[i + 1] = parent.children.v.arr[i];
		}
		parent.children.v.arr[idx + 1] = newChild.ptr;

		for (let i = parent.curKeyCount.value - 1; i >= idx; i--) {
			parent.keys.v.arr[i + 1] = parent.keys.v.arr[i];
		}

		parent.keys.v.arr[idx] = fullChild.v.keys.v.arr[t - 1];
		parent.curKeyCount.value++;
		
		parent.rearrangeTree(canvas);
	}

	*insertKey(root: ElementBtreeNode, key: number, canvas: CanvasHandler) {
		const M = root.M;

		if(root.curKeyCount.value === M - 1) {
			const newRoot = new ElementBtreeNode(
				root.x,
				root.y - (BtreeNode.cellHeight * 2),
				root.M,
				false,
				null
			);
			canvas.addElements(newRoot);
			newRoot.children.v.arr[0] = root.ptr;
			root.parentNode = newRoot;
			this.splitNode(newRoot, 0, canvas);
			root = newRoot;
		}

		let current: ElementBtreeNode = root;
		while(!current.isLeaf.value) {
			let i = 0;
			while (i < current.curKeyCount.value && (current.keys.v.arr[i] as number) < key) {
				i++;
			}

			if(
				(current.children.v.arr[i].constructor.name !== Null.name) &&
				(current.children.v.arr[i] as Ptr<ElementBtreeNode>).v.curKeyCount.value === M - 1
			) {
				this.splitNode(current, i, canvas);
				if ((current.keys.v.arr[i] as number) < key) {
					i++;
				}
			}
			current = (current.children.v.arr[i] as Ptr<ElementBtreeNode>).v;
		}

		let i = current.curKeyCount.value - 1;
		while (i >= 0 && (current.keys.v.arr[i] as number) > key) {
			current.keys.v.arr[i + 1] = current.keys.v.arr[i];
			i--;
		}
		current.keys.v.arr[i + 1] = key;
		current.curKeyCount.value++;

		canvas.redraw();

		return root;
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.insertKey(this.root, this.toInsertKey, canvas);
			let result: IteratorResult<never, ElementBtreeNode>;

			while(true) {
				result = gen.next();
				if(result.done) {
					break;
				}
				yield null;
			}
		}
	}
}

export default new InsertBtree();
