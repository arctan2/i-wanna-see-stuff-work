import { AlgorithmHandler } from "../../../algorithm-handler";
import { setErrorPopupText } from "../../../global";
import { CanvasHandler } from "../../../handler/canvas-handler";
import { AdjMatrix, CellType, Node } from "../../element-types/adjacency-matrix";

export default class BfsAdjMatrix extends AlgorithmHandler {
	adjMatrix: AdjMatrix | null = null;

	init(adjMatrix: AdjMatrix, canvas: CanvasHandler) {
		this.adjMatrix = adjMatrix;
		this.cleanup(canvas);
		this.initGenerator(canvas);
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

	*finalPath(adjMatrix: AdjMatrix, pred: {[_:string]: Node | null}, canvas: CanvasHandler) {
		const dest = adjMatrix.dest;
		const src = adjMatrix.src;

		let temp = pred[dest.id];

		while(temp) {
			if(temp.id !== src.id) {
				adjMatrix.setCell(temp.y, temp.x, CellType.Path);
				adjMatrix.renderCell(canvas.ctx, temp.x, temp.y);
				yield null;
			}
			temp = pred[temp.id];
		}
	}

	*bfs(adjMatrix: AdjMatrix, canvas: CanvasHandler) {
		const src = adjMatrix.src;
		const dest = adjMatrix.dest;
		let visited = new Set<string>();
		let queue: Array<Node> = [];
		let pred: {[_:string]: Node | null} = {};

		visited.add(src.id);
		queue.push(src);
		
		while(queue.length) {
			let front = queue.shift();

			if(!front) {
				return;
			}

			const adjacentNodes = [
				// top
				new Node(front.x, front.y - 1),
				// right
				new Node(front.x + 1, front.y),
				// bottom
				new Node(front.x, front.y + 1),
				// left
				new Node(front.x - 1, front.y),
			]; 

			if(front.id !== src.id && front.id !== dest.id) {
				adjMatrix.setCell(front.y, front.x, CellType.Visited);
				adjMatrix.renderCell(canvas.ctx, front.x, front.y);
				yield null;
			}

			for(let n of adjacentNodes) {
				if(
					(n.x < 0 || n.x >= adjMatrix.columns) ||
					(n.y < 0 || n.y >= adjMatrix.rows) ||
					(adjMatrix.at(n.y, n.x) === CellType.Wall)
				) {
					continue;
				}

				if(!visited.has(n.id)) {
					if(n.id !== src.id && n.id !== dest.id) {
						adjMatrix.setCell(n.y, n.x, CellType.AdjNode);
						adjMatrix.renderCell(canvas.ctx, n.x, n.y);
						yield null;
					}
					visited.add(n.id);
					pred[n.id] = front;
					if(n.id === dest.id) {
						let gen = this.finalPath(adjMatrix, pred, canvas);
						while(!gen.next().done) yield null;
						return;
					}
					queue.push(n);
				}
			}
		}
		setErrorPopupText("The node is not reachable from the source node.");
	}

	uninit(_canvas: CanvasHandler) {
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.adjMatrix) {
			let gen = this.bfs(this.adjMatrix, canvas);

			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

