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
		this.root = node;
		this.initGenerator(canvas);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		this.toDeleteString = "";
	}

	*deleteRecursive(node: ElementTrieNode | null, s: string, depth: number, canvas: CanvasHandler) {
		if(node === null) {
			setErrorPopupText(`String "${s}" not present in the tree.`);
			return node;
		}

		for(const _ of node.animateNodeBg(canvas, Color.traverse)) yield;

		if(depth === s.length) {
			if(node.isWordEnd.value) {
				node.isWordEnd.value = false;
			} else {
				setErrorPopupText(`String "${s}" not present in the tree.`);
			}

			if(node.isEmpty()) {
				for(const _ of node.animateNodeBg(canvas, Color.delete)) yield;
				node.remove(canvas);
				canvas.redraw();
				return null;
			}

			return node;
		}

		const charCodeIdx = s.charAt(depth).charCodeAt(0) - 97;

		let gen = this.deleteRecursive(node.children[charCodeIdx]?.v || null, s, depth + 1, canvas);
		let result;
		while(true) {
			result = gen.next();
			if(result.done) {
				node.children[charCodeIdx] = result.value?.ptr || null;
				break;
			}
			yield;
		}

		if(node.isEmpty() && !node.isWordEnd.value) {
			for(const _ of node.animateNodeBg(canvas, Color.delete)) yield;
			node.remove(canvas);
			canvas.redraw();
			return null;
		}

		return node;
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.deleteRecursive(this.root, this.toDeleteString, 0, canvas);
			while(!gen.next().done) {
				yield null;
			}
			this.root.rearrangeTree(canvas);
		}
	}
}

export default new DeleteTrie();
