<template>
	<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g id="btree-node">
		<path class="stroke" d="M19.0508 85V109H1V85H19.0508ZM21.0508 109V85H39.1016V109H21.0508ZM41.1016 109V85H57V109H41.1016Z" stroke="white" stroke-width="2"/>
		<path class="stroke" d="M89.0508 85V109H71V85H89.0508ZM91.0508 109V85H109.102V109H91.0508ZM111.102 109V85H127V109H111.102Z" stroke="white" stroke-width="2"/>
		<path class="stroke" d="M54.0508 20V44H36V20H54.0508ZM56.0508 44V20H74.1016V44H56.0508ZM76.1016 44V20H92V44H76.1016Z" stroke="white" stroke-width="2"/>
		<path class="stroke" d="M36 44.5L29 85" stroke="white" stroke-width="2"/>
		<path class="stroke" d="M55.5 43.5L99 85.5" stroke="white" stroke-width="2"/>
		</g>
	</svg>
</template>

<style scoped>
svg{
	transform: scale(1.5, 1.5);
}

svg.selected .stroke {
	stroke: var(--stroke-clr);
}
</style>
