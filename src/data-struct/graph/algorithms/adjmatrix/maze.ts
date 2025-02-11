import { AlgorithmHandler } from "../../../algorithm-handler";
import { CanvasHandler } from "../../../handler/canvas-handler.ts";
import { AdjMatrix, CellType, Node } from "../../element-types/adjacency-matrix.ts";
import { randInt } from "../../../utils.ts";

export default class Maze extends AlgorithmHandler {
	parent: {[_:string]: string} = {};
	rank: {[_:string]: number} = {};
	adjMatrix: AdjMatrix | null = null;

	init(adjMatrix: AdjMatrix, canvas: CanvasHandler) {
		this.adjMatrix = adjMatrix;
		this.cleanup(canvas);
		this.parent = {};
		this.rank = {};
		this.initGenerator(canvas);
	}

	uninit(_canvas: CanvasHandler) {
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

	find(nodeId: string): string {
		if(!(nodeId in this.parent)) {
			this.parent[nodeId] = nodeId;
			return nodeId;
		}

		if(nodeId === this.parent[nodeId]) {
            return nodeId;
		}
        
        this.parent[nodeId] = this.find(this.parent[nodeId]);
        return this.parent[nodeId];
	}

	union(a: string, b: string) {
		let u = this.find(a);
		let v = this.find(b);

		if(!(u in this.rank)) {
			this.rank[u] = 0;
		}

		if(!(v in this.rank)) {
			this.rank[v] = 0;
		}

		if(u !== v) {
			if(this.rank[u] < this.rank[v]) {
				[u, v] = [v, u];
			}
			this.parent[v] = u;

			let ru = this.rank[u];

			if(ru === (this.rank[v])) {
				this.rank[u] = ru + 1;
			}
		}
	}

	isConnected(a: string, b: string): boolean {
		return this.find(a) === this.find(b);
	}

	edges(adjMatrix: AdjMatrix) {
		let edges: Array<[string, string, string]> = [];

		for(let y = 0; y < adjMatrix.rows; y += 2) {
			for(let x = 0; x < adjMatrix.columns; x += 2) {
				if((y + 2) < adjMatrix.rows) {
					const u = new Node(x, y).id;
					const v = new Node(x, y + 2).id;
					const m = new Node(x, y + 1).id
					edges.push([u, v, m]);
				}

				if((x + 2) < adjMatrix.columns) {
					const u = new Node(x, y).id;
					const v = new Node(x + 2, y).id;
					const m = new Node(x + 1, y).id
					edges.push([u, v, m]);
				}
			}
		}

		this.shuffle(edges);
		return edges;
	}

	shuffle(array: Array<any>) {
		for(let i = 0; i < array.length; i++) {
			let i = randInt(0, array.length);
			let j = randInt(0, array.length);
			[array[i], array[j]] = [array[j], array[i]];
		}
	}

	*maze(adjMatrix: AdjMatrix, canvas: CanvasHandler) {
		for(let y = 0; y < adjMatrix.rows; y++) {
			for(let x = 0; x < adjMatrix.columns; x++) {
				adjMatrix.setCell(y, x, CellType.Wall);
			}
		}

		const edges = this.edges(adjMatrix);

		let path = [];

		adjMatrix.paint(canvas.ctx);

		for(let i = 0; i < edges.length; i++) {
			const [fromNode, toNode, m] = edges[i];

			if(!this.isConnected(fromNode, toNode)) {
				path.push(fromNode, toNode, m);
				this.union(fromNode, toNode);
			}
		}

		for(let p of path) {
			let [y, x] = p.split("|").map(Number);
			const c = adjMatrix.at(y, x);
			if(c === CellType.Src || c === CellType.Dest) {
				continue;
			}

			adjMatrix.setCell(y, x, CellType.Cell);
			adjMatrix.renderCell(canvas.ctx, x, y);
			yield null;
		}
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.adjMatrix) {
			let gen = this.maze(this.adjMatrix, canvas);

			while(!gen.next().done) {
				yield null;
			}
		}
	}
}
