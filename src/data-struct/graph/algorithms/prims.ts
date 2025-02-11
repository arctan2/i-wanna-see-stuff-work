import { AlgorithmHandler } from "../../algorithm-handler";
import { CanvasHandler } from "../../handler/canvas-handler.ts";
import { ElementGNode } from "../el-node.ts";
import { ElementUEdge } from "../el-u-edge.ts";
import { ElementDEdge } from "../el-d-edge.ts";
import { setErrorPopupText } from "../../global.ts";

enum Color {
	span = "#00ff00",
	curNode = "#0000ff",
	compare = "#ffff00"
};

class PriorityQueue {
	private qArr: Array<{
		dist: number,
		node: ElementGNode,
	}> = [];

	private heapify(idx: number) {
		let heap = this.qArr;
		let smallestIdx = idx;
		const leftIdx = 2 * idx + 1;
		const rightIdx = 2 * idx + 2;

		if(leftIdx < heap.length && heap[leftIdx] < heap[smallestIdx]) {
			smallestIdx = leftIdx;
		}

		if(rightIdx < heap.length && heap[rightIdx] < heap[smallestIdx]) {
			smallestIdx = rightIdx;
		}

		if(smallestIdx !== idx) {
			[heap[smallestIdx], heap[idx]] = [heap[idx], heap[smallestIdx]];
			this.heapify(smallestIdx);
		}
	}

	insert(dist: number, node: ElementGNode): void {
		const qNode = { dist, node };
		this.qArr.push(qNode);
		let idx = this.qArr.length - 1;

		while(idx > 0 && this.qArr[Math.floor((idx - 1) / 2)].dist > this.qArr[idx].dist) {
			let pidx = Math.floor((idx - 1) / 2);
			[this.qArr[idx], this.qArr[pidx]] = [this.qArr[pidx], this.qArr[idx]];

			idx = pidx;
		}
	}

	isEmpty() {
		return this.qArr.length === 0;
	}

	extractMin(): ElementGNode | undefined {
		[this.qArr[0], this.qArr[this.qArr.length - 1]] = [this.qArr[this.qArr.length - 1], this.qArr[0]];
		const min = this.qArr.pop()?.node;

		this.heapify(0);
		return min;
	}
}

class WeightValue { 
	weight: number;
	prev: ElementGNode | null;
	prevEdge: ElementUEdge | null;

	constructor(weight: number, prev: ElementGNode | null, prevEdge: ElementUEdge | null) {
		this.weight = weight;
		this.prev = prev;
		this.prevEdge = prevEdge;
	}
};

class Prims extends AlgorithmHandler {
	startNode: null | ElementGNode = null;
	mst: Map<ElementGNode, WeightValue> = new Map();

	init(canvas: CanvasHandler, startNode: ElementGNode) {
		this.initGenerator(canvas);
		this.startNode = startNode;
		this.mst = new Map();
	}

	uninit(_canvas: CanvasHandler) {
	}

	cleanup(canvas: CanvasHandler) {
		let mst = this.mst;

		for(let key of mst.keys()) {
			let value = mst.get(key);
			
			if(value && value.prevEdge && value.prev) {
				key.resetStyle();
				value.prev.resetStyle();
				value.prevEdge.bg = "#ffffff";
			}
		}
		canvas.redraw();
	}

	forceStop(canvas: CanvasHandler): void {
		super.forceStop(canvas);
		this.cleanup(canvas);
	}

	*prims(startNode: ElementGNode, canvas: CanvasHandler) {
		let pq = new PriorityQueue();
		let mst = this.mst;
		let key = new Map<ElementGNode, number>();
		let visited = new Set<ElementGNode>();

		key.set(startNode, 0);
		pq.insert(0, startNode);

		while(!pq.isEmpty()) {
			let extractedVertex = pq.extractMin();
			if(!extractedVertex) throw new Error("pq is empty");

			extractedVertex.bg = Color.curNode;
			extractedVertex.draw(canvas.ctx);
			yield null;

			visited.add(extractedVertex);

			for(const edge of extractedVertex.edges.v.list()) {
				let prevEdgeColor = edge.v.bg;

				edge.v.bg = Color.compare;
				edge.v.draw(canvas.ctx);
				yield null;

				const destination = (edge.v.toNode === extractedVertex) ? edge.v.fromNode : edge.v.toNode;

				if(!visited.has(destination)) {
					const newKey = edge.v.weight.value;

					if(!key.has(destination)) key.set(destination, Infinity);

					if(key.get(destination) as number > newKey) {
						pq.insert(newKey, destination);

						const prev = mst.get(destination);
						if(prev && prev.prevEdge && prev.prev) {
							prev.prevEdge.bg = "#ffffff";
						}

						mst.set(destination, new WeightValue(newKey, extractedVertex, edge.v as ElementUEdge))
						prevEdgeColor = Color.span;
						key.set(destination, newKey);
					}
				}

				edge.v.bg = prevEdgeColor;
				edge.v.draw(canvas.ctx);
			}

			extractedVertex.resetStyle();
			extractedVertex.draw(canvas.ctx);
			yield null;
		}

		for(let key of mst.keys()) {
			let value = mst.get(key);
			
			if(value && value.prevEdge && value.prev) {
				key.bg = Color.span;
				key.color = "#000000";

				value.prev.bg = Color.span;
				value.prev.color = "#000000";
			}
		}

		canvas.redraw();
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.startNode) {
			if(this.startNode.edges.v.first()?.v.constructor.name === ElementDEdge.name) {
				setErrorPopupText("Can't perform Prims on directed edge");
				return;
			}

			let gen = this.prims(this.startNode, canvas);

			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new Prims();
