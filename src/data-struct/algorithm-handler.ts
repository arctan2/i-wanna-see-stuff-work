import { algorithmState } from "./components/refs";
import { DELAY, isAutoplay } from "./global";
import { CanvasHandler } from "./handler/canvas-handler";

export enum ProgressState {
	NotBegun = 1,
	Stopped,
	Paused,
	Running
}

type Gen = Generator<null, void, unknown>;
type AsyncGen = AsyncGenerator<null, void, unknown>;

export class AlgorithmHandler {
	private state: ProgressState = ProgressState.NotBegun;
	private generator: Gen | AsyncGen | null = null;
	private isAsync: boolean = false;

	doneCallback?: () => void;

	private async run(canvas: CanvasHandler) {
		if(this.state !== ProgressState.Stopped) {
			this.next(canvas);
		}

		return new Promise((resolve, _) => {
			setTimeout(() => {
				if(this.state !== ProgressState.Running) {
					resolve(false);
					return;
				}
				resolve(true);
			}, DELAY);
		});
	}

	private async asyncRun(canvas: CanvasHandler) {
		if(this.state !== ProgressState.Stopped) {
			await this.asyncNext(canvas);
		}

		return new Promise((resolve, _) => {
			if(this.state === ProgressState.Stopped) {
				resolve(false);
				return;
			}
			setTimeout(() => {
				if(this.state !== ProgressState.Running) {
					resolve(false);
					return;
				}
				resolve(true);
			}, DELAY);
		});
	}

	async play(canvas: CanvasHandler) {
		if(this.isAsync) {
			this.asyncPlay(canvas);
			return;
		}

		this.state = ProgressState.Running;
		if(this.generator === null) {
			this.generator = this.generatorFn(canvas);
		}

		while(await this.run(canvas));
	}

	tryPlay(canvas: CanvasHandler) {
		if(isAutoplay.value) {
			this.play(canvas);
		}
	}

	private async asyncPlay(canvas: CanvasHandler) {
		this.state = ProgressState.Running;
		if(this.generator === null) {
			this.generator = this.asyncGeneratorFn(canvas);
		}

		while(await this.asyncRun(canvas));
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
		if(this.state === ProgressState.Stopped) return;
		this.state = ProgressState.Stopped;
		this.uninit(canvas);
		this.generator = null;

		algorithmState.forceStopAlgorithm();
	}

	next(canvas: CanvasHandler) {
		if(this.isAsync) {
			this.asyncNext(canvas);
			return;
		}

		if(this.state === ProgressState.NotBegun) {
			this.state = ProgressState.Paused;
		}

		if((this.generator as Gen)?.next().done) {
			this.done(canvas);
		}
	}

	private async asyncNext(canvas: CanvasHandler) {
		if(this.state === ProgressState.NotBegun) {
			this.state = ProgressState.Paused;
		}
		if((await (this.generator as AsyncGen)?.next()).done) {
			this.done(canvas);
		}
	}

	getState() {
		return this.state;
	}

	initGenerator(canvas: CanvasHandler) {
		this.state = ProgressState.NotBegun;
		this.generator = this.generatorFn(canvas);
		this.isAsync = false;
	}
	
	initAsyncGenerator(canvas: CanvasHandler) {
		this.state = ProgressState.NotBegun;
		this.generator = this.asyncGeneratorFn(canvas);
		this.isAsync = true;
	}

	async *asyncGeneratorFn(_canvas: CanvasHandler) {
		yield null;
		/* implemented by child class */
	}

	*generatorFn(_canvas: CanvasHandler) {
		yield null;
		/* implemented by child class */
	}
}

