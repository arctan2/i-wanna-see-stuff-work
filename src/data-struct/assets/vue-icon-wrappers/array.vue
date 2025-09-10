<template>
	<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
	<g id="ll-node">
		<rect class="stroke" width="114" height="45" x="10" y="37" stroke="#ffffff" stroke-width="4" />
		<line class="stroke" x1="48" y1="37" x2="48" y2="82" stroke="#ffffff" stroke-width="4" />
		<line class="stroke" x1="86" y1="37" x2="86" y2="82" stroke="#ffffff" stroke-width="4" />
	</g>
	</svg>
</template>

<style scoped>
svg{
	transform: scale(1.7, 1.7);
}

svg.selected .stroke {
	stroke: var(--stroke-clr);
}

</style>
