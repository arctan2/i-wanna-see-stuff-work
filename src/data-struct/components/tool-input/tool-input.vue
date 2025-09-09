<script setup lang="ts">
import BtreeInput from './btree-input.vue';
import ArrayInput from './array-input.vue';
import { curToolIdx, ToolList } from "../../global";
</script>

<template>
	<BtreeInput v-if="ToolList[curToolIdx]?.name === 'btree' || ToolList[curToolIdx]?.name === 'b+tree'" />
	<ArrayInput v-if="ToolList[curToolIdx]?.name === 'array'" />
</template>
