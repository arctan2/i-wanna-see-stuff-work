import { AlgorithmHandler } from "../../../algorithm-handler";
import { setErrorPopupText } from "../../../global";
import { CanvasHandler } from "../../../handler/canvas-handler";
import { AdjMatrix, CellType, Node } from "../../element-types/adjacency-matrix";
import { Heuristics, chebyshevDistance, euclidian, manhattan, octileDistance } from "../heuristics";
import { PriorityQueue } from "./common";

class DistValue { 
	g: number = Infinity;
	f: number = Infinity;
	prev: Node | null;

	constructor(prev: Node | null, f: number, g: number) {
		this.f = f;
		this.g = g;
		this.prev = prev;
	}
};

export default class AstarAdjMatrix extends AlgorithmHandler {
	adjMatrix: AdjMatrix | null = null;
	distanceTable: {[_:string]: DistValue} = {};
	curHeuristics: Heuristics = Heuristics.Manhattan;

	init(adjMatrix: AdjMatrix, heuristics: Heuristics, canvas: CanvasHandler) {
		this.adjMatrix = adjMatrix;
		this.distanceTable = {};
		this.cleanup(canvas);
		this.curHeuristics = heuristics;
		this.initGenerator(canvas)
	}

	cleanup(canvas: CanvasHandler) {
		if(this.adjMatrix) {
			this.adjMatrix.resetCells(canvas.ctx);
		}
	}

	forceStop(canvas: CanvasHandler): void {
		super.forceStop(canvas);
		this.cleanup(canvas);
	}

	*finalPath(adjMatrix: AdjMatrix, canvas: CanvasHandler) {
		const dest = adjMatrix.dest;
		const src = adjMatrix.src;

		let temp = this.distanceTable[dest.id];

		while(temp?.prev && temp.prev) {
			if(temp.prev.id !== src.id) {
				adjMatrix.setCell(temp.prev.y, temp.prev.x, CellType.Path);
				adjMatrix.renderCell(canvas.ctx, temp.prev.x, temp.prev.y);
				yield null;
			}
			temp = this.distanceTable[temp.prev.id];
		}
	}

	heuristics(node: Node, dest: Node) {
		switch(this.curHeuristics) {
			case Heuristics.Manhattan:
				return manhattan(node, dest);
			case Heuristics.Euclidian:
				return euclidian(node, dest);
			case Heuristics.OctileDistance:
				return octileDistance(node, dest);
			case Heuristics.ChebyshevDistance:
				return chebyshevDistance(node, dest);
		}
	}

	*astar(adjMatrix: AdjMatrix, canvas: CanvasHandler) {
		const src = adjMatrix.src;
		const dest = adjMatrix.dest;
		let minQueue = new PriorityQueue<Node>();
		let distanceTable = this.distanceTable;
		let visited = new Set<string>();

		const fh = this.heuristics(src, dest);

		distanceTable[src.id] = new DistValue(null, fh, 0);
		minQueue.insert(fh, src);

		while(!minQueue.isEmpty()) {
			const cur = minQueue.extractMin();

			if(!cur) throw new Error("priority queue is empty.");

			if(cur.id === dest.id) {
				let gen = this.finalPath(adjMatrix, canvas);
				while(!gen.next().done) yield null;
				return;
			}

			const curDistVal = distanceTable[cur.id] as DistValue;

			const adjacentNodes = [
				// top
				new Node(cur.x, cur.y - 1),
				// right
				new Node(cur.x + 1, cur.y),
				// bottom
				new Node(cur.x, cur.y + 1),
				// left
				new Node(cur.x - 1, cur.y),
			]; 

			for(const toNode of adjacentNodes) {
				if(
					(toNode.x < 0 || toNode.x >= adjMatrix.columns) ||
					(toNode.y < 0 || toNode.y >= adjMatrix.rows) ||
					(adjMatrix.at(toNode.y, toNode.x) === CellType.Wall)
				) {
					continue;
				}

				if(!distanceTable[toNode.id]) {
					distanceTable[toNode.id] = new DistValue(null, Infinity, Infinity);
				}

				const toNodeDistVal = distanceTable[toNode.id] as DistValue;

				const tentativeG = curDistVal.g;

				if(tentativeG < toNodeDistVal.g) {
					const f = this.heuristics(toNode, dest);
					distanceTable[toNode.id].prev = cur;
					distanceTable[toNode.id].f = f;
					distanceTable[toNode.id].g = tentativeG;
					
					if(!visited.has(toNode.id)) {
						visited.add(toNode.id);
						minQueue.insert(f, toNode);
						if(toNode.id !== src.id && toNode.id !== dest.id) {
							adjMatrix.setCell(toNode.y, toNode.x, CellType.AdjNode);
							adjMatrix.renderCell(canvas.ctx, toNode.x, toNode.y);
							yield null;
						}
					}
				}
			}

			visited.add(cur.id);

			if(cur.id !== src.id && cur.id !== dest.id) {
				adjMatrix.setCell(cur.y, cur.x, CellType.Visited);
				adjMatrix.renderCell(canvas.ctx, cur.x, cur.y);
				yield null;
			}
		}

		setErrorPopupText("The node is unreachable.");
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.adjMatrix) {
			let gen = this.astar(this.adjMatrix, canvas);
			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

