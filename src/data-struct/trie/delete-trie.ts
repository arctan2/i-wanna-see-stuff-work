import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementTrieNode } from "./el-trie-node.ts";

enum Color {
	traverse = "#ffff00",
	delete = "#ff0000",
};

class DeleteTrie extends AlgorithmHandler {
	root: null | ElementTrieNode = null;
	toDeleteString: string = "";

	init(canvas: CanvasHandler, node: ElementTrieNode, s: string) {
		this.toDeleteString = s;
		this.root = node.getRoot();
		this.initGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		this.toDeleteString = "";
	}

	*deleteRecursive(node: ElementTrieNode | null, s: string, depth: number, canvas: CanvasHandler): Generator<any, ElementTrieNode | null, unknown> {
		if(node === null) {
			setErrorPopupText(`String "${s}" not present in the tree.`);
			return node;
		}

		yield* node.animateNodeBg(canvas, Color.traverse);

		if(depth === s.length) {
			if(node.isWordEnd.value) {
				node.isWordEnd.value = false;
			} else if(s !== "") {
				setErrorPopupText(`String "${s}" not present in the tree.`);
			}

			if(node.isEmpty()) {
				yield* node.animateNodeBg(canvas, Color.delete);
				node.remove(canvas);
				canvas.redraw();
				return null;
			}

			return node;
		}

		const charCodeIdx = s.charAt(depth).charCodeAt(0) - 97;

		node.children[charCodeIdx] = (yield* this.deleteRecursive(node.children[charCodeIdx]?.v || null, s, depth + 1, canvas))?.ptr || null;

		if(node.isEmpty() && !node.isWordEnd.value) {
			yield* node.animateNodeBg(canvas, Color.delete);
			node.remove(canvas);
			canvas.redraw();
			return null;
		}

		return node;
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			yield* this.deleteRecursive(this.root, this.toDeleteString, 0, canvas);
			this.root.rearrangeTree(canvas);
		}
	}
}

export default new DeleteTrie();
