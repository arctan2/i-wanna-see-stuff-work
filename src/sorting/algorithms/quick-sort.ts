import { AnimationState, Sorter } from "./sorter-iface.ts";

export default class QuickSort extends Sorter {
	constructor(cb: () => void) {
		super(cb);
	}

	*partition(low: number, high: number): Generator<null, number, unknown> {
		this.animate(AnimationState.Traversing, high);
		yield null;
		let pivot = this.elements[high].value;
		let i = low - 1;
		this.animate(AnimationState.Compare, high);

		for(let j = low; j <= high - 1; j++) {
			this.animate(AnimationState.Compare, j);
			yield null;
			this.animate(AnimationState.None, j);
			if(this.elements[j].value < pivot) {
				i++;
				this.animate(AnimationState.Swap, j, i);
				yield null;
				[this.elements[i], this.elements[j]] = [this.elements[j], this.elements[i]];
				this.animate(AnimationState.SwapDone, j, i);
				yield null;
			}
			this.animate(AnimationState.None, j, i);
			yield null;
		}

		this.animate(AnimationState.Swap, i + 1, high);
		yield null;
		[this.elements[i + 1], this.elements[high]] = [this.elements[high], this.elements[i + 1]];
		this.animate(AnimationState.SwapDone, i + 1, high);
		yield null;
		this.animate(AnimationState.None, i + 1, high);
		yield null;

		return i + 1;
	}

	*quickSort(low: number, high: number) {
		if(low < high) {
			let partition = yield* this.partition(low, high);

			let leftGen = this.quickSort(low, partition - 1);
			while(!leftGen.next().done) {
				yield null;
			}
			let rightGen = this.quickSort(partition + 1, high);
			while(!rightGen.next().done) {
				yield null;
			}
		}
	}

	*sortGenerator() {
		let qSorter = this.quickSort(0, this.elements.length - 1);
		while(!qSorter.next().done) {
			yield null;
		}
	}
}

