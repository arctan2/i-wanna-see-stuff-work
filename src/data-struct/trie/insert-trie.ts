import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setInfoPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
import { ElementTrieNode } from "./el-trie-node.ts";

enum Color {
	endOfWord = "#00ff00",
	traverse = "#ffff00",
};

class InsertTrie extends AlgorithmHandler {
	root: null | ElementTrieNode = null;
	toInsertString: string = "";

	init(canvas: CanvasHandler, node: ElementTrieNode, toInsertString: string, doneCallback?: () => void) {
		this.toInsertString = toInsertString;
		this.root = node;
		this.doneCallback = doneCallback;
		this.initAsyncGenerator(canvas);
		setInfoPopupText(`Inserting "${this.toInsertString}"`);
	}

	uninit(canvas: CanvasHandler) {
		this.root?.resetAllNodesStyle(canvas);
		this.root = null;
		this.toInsertString = "";
		setInfoPopupText("");
	}

	async *insertString(root: ElementTrieNode, s: string, canvas: CanvasHandler) {
		s = s.trim().toLowerCase();

		if(s === "") return;

		let temp = root;

		for(const char of s) {
			yield* temp.animateNodeBg(canvas, Color.traverse);
			const charCodeIdx = char.charCodeAt(0) - 97;

			if(temp.children[charCodeIdx] === null) {
				const n = new ElementTrieNode(temp.x, temp.y, temp, char);
				canvas.addElements(n);
				temp.children[charCodeIdx] = n.ptr;
				await root.rearrangeTree(canvas);
			}

			temp = (temp.children[charCodeIdx] as Ptr<ElementTrieNode>).v;
		}

		temp.isWordEnd.value = true;
		temp.word = s;

		yield* temp.animateNodeBg(canvas, Color.endOfWord);

		await root.rearrangeTree(canvas);
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.root) {
			yield* this.insertString(this.root, this.toInsertString, canvas);
		}
	}
}

export default new InsertTrie();
