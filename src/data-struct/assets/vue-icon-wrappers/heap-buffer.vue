<template>
	<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g id="heap-buffer">
		<path class="stroke" d="M93 57L68 22" stroke="white" stroke-width="2"/>
		<path class="stroke" d="M34 57L58 22" stroke="white" stroke-width="2"/>
		<circle class="fill" cx="64" cy="22" r="15" fill="white"/>
		<circle class="fill" cx="29" cy="64" r="15" fill="white"/>
		<circle class="fill" cx="99" cy="64" r="15" fill="white"/>
		<path class="stroke" d="M43.25 93V117H1V93H43.25ZM45.25 117V93H87.5V117H45.25ZM89.5 117V93H127V117H89.5Z" stroke="white" stroke-width="2"/>
		</g>
	</svg>
</template>

<style scoped>
svg{
	transform: scale(1.4, 1.4);
}

svg.selected .stroke {
	stroke: var(--stroke-clr);
}

svg.selected .fill {
	fill: var(--stroke-clr);
}

</style>
