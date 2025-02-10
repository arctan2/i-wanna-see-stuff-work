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

	run(canvas: CanvasHandler) {
		return new Promise((resolve, _) => {
			setTimeout(() => {
				if(this.state === ProgressState.Stopped) {
					resolve(false);
					return;
				}
				this.next(canvas);
				if(this.state !== ProgressState.Running) {
					resolve(false);
					return;
				}
				resolve(true);
			}, DELAY);
		});
	}

	async play(canvas: CanvasHandler, callback?: () => void) {
		this.state = ProgressState.Running;
		if(this.generator === null) {
			this.generator = this.generatorFn(canvas);
		}

		while(await this.run(canvas));

		if(callback) {
			callback();
		}
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
	}

	forceStop(canvas: CanvasHandler) {
		if(this.state === ProgressState.Stopped || this.state === ProgressState.NotBegun) return;
		this.state = ProgressState.Stopped;
		this.uninit(canvas);
		this.generator = null;

		algorithmState.forceStopAlgorithm();
	}

	next(canvas: CanvasHandler) {
		if(this.generator?.next().done) {
			this.done(canvas);
		}
	}

	*generatorFn(_canvas: CanvasHandler) {
		yield null;
		/* implemented by child class */
	}
}

