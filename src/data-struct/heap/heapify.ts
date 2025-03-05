import { AlgorithmHandler } from "../algorithm-handler.ts";
import { setInfoPopupText } from "../global.ts";
import { CanvasHandler } from "../handler/canvas-handler.ts";
import { Ptr } from "../memory-allocator/allocator.ts";
import { ElementHeapBuffer } from "./el-heap-buffer.ts";

enum Color {
	endOfWord = "#00ff00",
	traverse = "#ffff00",
};

class InsertTrie extends AlgorithmHandler {
	root: null | ElementHeapBuffer = null;
	toInsertString: string = "";

	init(canvas: CanvasHandler, node: ElementHeapBuffer, toInsertString: string, doneCallback?: () => void) {
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

	async *insertString(root: ElementHeapBuffer, s: string, canvas: CanvasHandler) {
		s = s.trim().toLowerCase();

		if(s === "") return;

		let temp = root;

		for(const char of s) {
			for(const _ of temp.animateNodeBg(canvas, Color.traverse)) yield;
			const charCodeIdx = char.charCodeAt(0) - 97;

			if(temp.children[charCodeIdx] === null) {
				const n = new ElementHeapBuffer(temp.x, temp.y, temp, char);
				canvas.addElements(n);
				temp.children[charCodeIdx] = n.ptr;
				await root.rearrangeTree(canvas);
			}

			temp = (temp.children[charCodeIdx] as Ptr<ElementHeapBuffer>).v;
		}

		temp.isWordEnd.value = true;
		temp.word = s;

		for(const _ of temp.animateNodeBg(canvas, Color.endOfWord)) yield;

		await root.rearrangeTree(canvas);
	}

	async *asyncGeneratorFn(canvas: CanvasHandler) {
		if(this.root) {
			let gen = this.insertString(this.root, this.toInsertString, canvas);
			while(!(await gen.next()).done) {
				yield null;
			}
		}
	}
}

export default new InsertTrie();
