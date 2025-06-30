import { AlgorithmHandler } from "../../../algorithm-handler";
import { setErrorPopupText } from "../../../global";
import { CanvasHandler } from "../../../handler/canvas-handler";
import { AdjMatrix, CellType, Node } from "../../element-types/adjacency-matrix";

export default class DfsAdjMatrixClass extends AlgorithmHandler {
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

	*dfs(adjMatrix: AdjMatrix, node: Node, visited: Set<string>, pred: {[_:string]: Node | null}, canvas: CanvasHandler): Generator<any, boolean, unknown>{
		const src = adjMatrix.src;
		const dest = adjMatrix.dest;
		visited.add(node.id);

		const adjacentNodes = [
			// top
			new Node(node.x, node.y - 1),
			// right
			new Node(node.x + 1, node.y),
			// bottom
			new Node(node.x, node.y + 1),
			// left
			new Node(node.x - 1, node.y),
		]; 

		if(node.id !== src.id && node.id !== dest.id) {
			adjMatrix.setCell(node.y, node.x, CellType.Visited);
			adjMatrix.renderCell(canvas.ctx, node.x, node.y);
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
				pred[n.id] = node;
				if(n.id !== src.id && n.id !== dest.id) {
					adjMatrix.setCell(n.y, n.x, CellType.AdjNode);
					adjMatrix.renderCell(canvas.ctx, n.x, n.y);
					yield null;
				}

				if(n.id === dest.id) {
					let gen = this.finalPath(adjMatrix, pred, canvas);
					while(!gen.next().done) yield null;
					return true;
				}

				let ret = yield* this.dfs(adjMatrix, n, visited, pred, canvas);

				if(ret === true) {
					return true;
				}
			}
		}
		if(node === src) {
			setErrorPopupText("The node is not reachable from the source node.");
		}
		return false;
	}

	uninit(_canvas: CanvasHandler) {
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.adjMatrix) {
			let pred: {[_:string]: Node | null} = {};
			let visited: Set<string> = new Set();
			yield* this.dfs(this.adjMatrix, this.adjMatrix.src, visited, pred, canvas);
		}
	}
}
