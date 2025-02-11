import { algorithmState } from "./components/refs";
import { DELAY } from "./global";
import { CanvasHandler } from "./handler/canvas-handler";

export enum ProgressState {
	NotBegun = 1,
	Stopped,
	Paused,
	Running
}

export class AlgorithmHandler {
	private state: ProgressState = ProgressState.NotBegun;
	private generator: Generator<null, void, unknown> | null = null;

	doneCallback?: () => void;

	run(canvas: CanvasHandler) {
		return new Promise((resolve, _) => {
			if(this.state === ProgressState.Stopped) {
				resolve(false);
				return;
			}
			setTimeout(() => {
				this.next(canvas);
				if(this.state !== ProgressState.Running) {
					resolve(false);
					return;
				}
				resolve(true);
			}, DELAY);
		});
	}

	async play(canvas: CanvasHandler) {
		this.state = ProgressState.Running;
		if(this.generator === null) {
			this.generator = this.generatorFn(canvas);
		}

		while(await this.run(canvas));
	}

	pause() {
		this.state = ProgressState.Paused;
	}

	uninit(_canvas: CanvasHandler) {
		/* implemented by child class */
	}

	done(canvas: CanvasHandler) {
		if(this.state === ProgressState.Stopped || this.state === ProgressState.NotBegun) return;
		this.state = ProgressState.Stopped;
		this.uninit(canvas);
		this.generator = null;

		algorithmState.algorithmDone();

		if(this.doneCallback) {
			setTimeout(this.doneCallback);
		}
	}

	forceStop(canvas: CanvasHandler) {
		if(this.state === ProgressState.Stopped || this.state === ProgressState.NotBegun) return;
		this.state = ProgressState.Stopped;
		this.uninit(canvas);
		this.generator = null;

		algorithmState.forceStopAlgorithm();
	}

	next(canvas: CanvasHandler) {
		if(this.state === ProgressState.NotBegun) {
			this.state = ProgressState.Paused;
		}
		if(this.generator?.next().done) {
			this.done(canvas);
		}
	}

	initGenerator(canvas: CanvasHandler) {
		this.state = ProgressState.NotBegun;
		this.generator = this.generatorFn(canvas);
	}

	*generatorFn(_canvas: CanvasHandler) {
		yield null;
		/* implemented by child class */
	}
}

