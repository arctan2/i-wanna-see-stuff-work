<script lang="ts" setup>
import { ref } from "vue";
import Select from "../../../common-components/select.vue";
import BytesView from "./bytes-view.vue";
import SimplifiedView from "./simplified-view.vue";
import { setIsMemAllocShow } from "../refs";
import ModeSwitch from "../../../common-components/mode-switch.vue";

enum Mode {
	Bytes = "Bytes",
	Simplified = "Simplified"
}

const byteAlign: any = { "auto": "auto", "4": 4, "8": 8, "16": 16, "32": 32, "64": 64 };
const isOn = ref<boolean>(true);
const curByteAlign = ref<"auto" | number>("auto");
const showAddressOnHover = ref<boolean>(false);
const allocContainerDiv = ref<Element | null>(null);
const addressType = ref<"hex" | "decimal">("hex");
const isBottomLayout = ref<boolean>(true);

</script>

<template>
<div id="memory-alloc" :class="['floating-panel', isBottomLayout ? 'bottom' : 'right']">
	<div id="pane-btns">
		<div style="" class="close-btn" @click="setIsMemAllocShow(false)">x</div>
		<div class="right-icon" v-if="isBottomLayout" @click="isBottomLayout = false"></div>
		<div class="bottom-icon" v-else @click="isBottomLayout = true"></div>
	</div>

	<div id="top-bar" class="scroll-bar">
		<ModeSwitch 
			:offText="Mode.Bytes"
			:onText="Mode.Simplified"
			:onClick="() => isOn = !isOn"
			:state="isOn"
		/>

		<div class="drop-down-container" v-if="!isOn">
			<span>Align: </span>
			<div class="custom-select-container">
				<Select :options="byteAlign as any" :onChange="(value) => curByteAlign = value as any" :value="curByteAlign as string" />
			</div>
		</div>

		<template v-if="isOn">
			<div class="checkbox-container">
				<input type="checkbox" v-model="showAddressOnHover" />
				<label>Show address on hover</label>
			</div>

			<div class="drop-down-container" v-if="showAddressOnHover">
				<span>Address Type: </span>
				<div class="custom-select-container">
					<Select
						:options="{ hex: 'hex', 'decimal': 'decimal' }"
						:onChange="(value) => addressType = value as any"
						:value="addressType"
					/>
				</div>
			</div>
		</template>
	</div>

	<div id="alloc-container" class="scroll-bar" ref="allocContainerDiv">
		<BytesView v-if="!isOn" :byteAlign="byteAlign[curByteAlign as any]" :parentDiv="allocContainerDiv" />
		<SimplifiedView
			v-if="isOn"
			:showAddressOnHover="showAddressOnHover"
			:addressType="addressType"
			:parentDiv="allocContainerDiv"
		/>
	</div>
</div>
</template>

<style>
@import "@css/common.css";

*{
	--chars: #1a821a;
	--str: #57c95e;
	--lnode: #8400ff;
	--gnode: #ff801f;
	--null: #ffffff;
	--edge: #0ab58e;
	--list: #ff00ff;
	--list-map: #cf5d5d;
	--adj-mat: #fffb91;
	--btree-node: #0095ff;
	--bptree-node: #00ff91;
	--llrbtree-node: #ff2626;
	--trie-node: #c7c7c7;
	--heap-buffer: #00e5ff;
	--array-buf: #4772ff;
}

#memory-alloc{
	position: absolute;
	z-index: 15;
	display: flex;
	flex-direction: column;
	padding: 2px;
}

.right{
	width: 40%;
	height: 90%;
	right: 0.1%;
	bottom: 1%;
}

.bottom {
	width: 98%;
	height: 40%;
	bottom: 1%;
}

#pane-btns .right-icon{
	display: flex;
	flex-direction: row;
	position: relative;
	right: 0;
	padding: 0.15rem 0.5rem;
}

#pane-btns .right-icon:hover::before, .right-icon:hover::after, #pane-btns .bottom-icon:hover::before, .bottom-icon:hover::after{
	border-color: #6596e0;
}

.right-icon::before{
	content: "";
	display: block;
	width: 60%;
	height: 100%;
	border: 2px solid rgb(180, 180, 180);
}

.right-icon::after{
	content: "";
	display: block;
	width: 30%;
	height: 100%;
	border: 2px solid rgb(180, 180, 180);
	border-left: 0;
}

#pane-btns .bottom-icon{
	display: flex;
	flex-direction: column;
	position: relative;
	right: 0;
	padding: 0.1rem 0.5rem;
}

.bottom-icon::before{
	content: "";
	display: block;
	width: 100%;
	height: 60%;
	border: 2px solid rgb(180, 180, 180);
}

.bottom-icon::after{
	content: "";
	display: block;
	width: 100%;
	height: 30%;
	border: 2px solid rgb(180, 180, 180);
	border-top: 0;
}


#top-bar{
	background-color: rgb(15, 15, 15);
	width: 100%;
	height: 3rem;
	display: flex;
	flex-direction: row;
	align-items: center;
	overflow-x: auto;
	overflow-y: hidden;
	padding: 0.3rem 0;
	font-size: 0.75rem;
	border-radius: 5px 5px 0 0;
}

#top-bar::-webkit-scrollbar{
	height: 4px;
}

#top-bar > * {
	min-height: 100%;
	padding: 0 0.5rem;
	height: 100%;
	border-right: 2px solid #333333;
}

#top-bar > *:last-child{
	border-right: 0;
}

#alloc-container{
	display: flex;
	flex-direction: row;
	height: 100%;
	overflow-y: auto;
	padding: 0.5rem;
}

.checkbox-container{
	height: 100%;
}

.drop-down-container{
	display: flex;
	flex-direction: row;
	align-items: center;
}

.drop-down-container span{
	font-family: monospace;
	margin-right: 0.2rem;
	white-space: pre;
}
</style>
