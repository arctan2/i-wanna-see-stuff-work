import { Ref } from "vue";

export class ValidatorObj {
	obj: Ref<number | "">;
	min: number;
	max: number;

	constructor(obj: Ref<number | "">, min: number, max: number) {
		this.obj = obj;
		this.min = min;
		this.max = max;
	}

	validate() {
		if(this.obj.value !== "") {
			if(Number(this.obj.value) <= this.min) {
				this.obj.value = this.min;
			}

			if(Number(this.obj.value) >= this.max) {
				this.obj.value = this.max;
			}

			if(Number.isNaN(Number(this.obj.value))) {
				this.obj.value = 0;
			}

			this.obj.value = Math.floor(this.obj.value);
		}
	}
}

