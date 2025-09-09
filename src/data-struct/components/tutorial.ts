import { ref } from "vue";
import { setIsMemAllocShow, setIsMenuOpen } from "./refs";
import { playground } from "../handler/playground-handler";
import { unfocusElement } from "../global";

export const isTutorialMode = ref(false);

export function startTutorial() {
	setIsMenuOpen(false);
	setIsMemAllocShow(false);
	unfocusElement();
	playground.canvas.redraw();
	isTutorialMode.value = true;
}
