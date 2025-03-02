<template>
	<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g id="llrbtree-node" clip-path="url(#clip0_1004_2)">
		<path class="stroke" d="M99 84L78 42" stroke="white" stroke-width="2"/>
		<path class="stroke" d="M30 84L50 42" stroke="white" stroke-width="2"/>
		<circle class="circle" cx="64" cy="25" r="25" fill="black"/>
		<circle class="circle" cx="25" cy="103" r="25" fill="#FF0000"/>
		<circle class="circle" cx="103" cy="103" r="25" fill="#FF0000"/>
		</g>
		<defs>
		<clipPath id="clip0_1004_2">
		<rect width="128" height="128" fill="white"/>
		</clipPath>
		</defs>
	</svg>
</template>

<style scoped>
svg{
	transform: scale(1.2, 1.2);
}

svg.selected .stroke {
	stroke: var(--stroke-clr);
}

svg.selected .circle {
	fill: var(--stroke-clr);
}
</style>
