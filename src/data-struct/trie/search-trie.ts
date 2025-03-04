import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setErrorPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { ElementTrieNode } from "./el-trie-node.ts";

enum Color {
	found = "#00ff00",
	traverse = "#ffff00",
};

class SearchTrie extends AlgorithmHandler {
	root: null | ElementTrieNode = null;
	toSearchString: string = "";

	init(canvas: CanvasHandler, node: ElementTrieNode, toSearchString: string, doneCallback?: () => void) {
		this.toSearchString = toSearchString;
		this.root = node;
		this.doneCallback = doneCallback;
		this.initGenerator(canvas);
	}

	cleanup(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
	}

	uninit(_canvas: CanvasHandler) {
		this.toSearchString = "";
	}

	*searchKey(root: ElementTrieNode, s: string, canvas: CanvasHandler) {
		s = s.trim().toLowerCase();

		if(s === "") return;

		let temp = root;

		for(const char of s) {
			const charCodeIdx = char.charCodeAt(0) - 97;

			temp.bg = Color.traverse;
			temp.draw(canvas.ctx);
			yield;
			temp.drawLineToChild(canvas.ctx, charCodeIdx, Color.traverse);
			yield;

			if(charCodeIdx < 0 || charCodeIdx > 25) return false;

			if(temp.children[charCodeIdx] === null) {
				setErrorPopupText(`The word "${s}" doesn't exist in the trie.`);
				return false;
			}

			temp = temp.children[charCodeIdx]?.v as ElementTrieNode;
		}

		if(temp.isWordEnd.value) {
			temp.bg = Color.found;
			temp.draw(canvas.ctx);
			yield;
		} else {
			setErrorPopupText(`String "${s}" not found.`);
		}
	}

	*generatorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.searchKey(this.root, this.toSearchString, canvas);
			while(!gen.next().done) {
				yield null;
			}
		}
	}
}

export default new SearchTrie();
