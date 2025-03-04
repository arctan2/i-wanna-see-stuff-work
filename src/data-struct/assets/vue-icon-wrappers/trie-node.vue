<template>
	<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g id="trie-node">
		<path class="stroke" d="M93 57L68 22" stroke="white" stroke-width="2"/>
		<path class="stroke" d="M34 57L58 22" stroke="white" stroke-width="2"/>
		<path class="stroke" d="M29.3613 108.4L28.2418 61" stroke="white" stroke-width="2"/>
		<path class="stroke" d="M99.3613 104.4L98.2418 57" stroke="white" stroke-width="2"/>
		<circle class="fill" cx="64" cy="15" r="15" fill="white"/>
		<circle class="fill" cx="64" cy="15" r="15" fill="white"/>
		<circle class="fill" cx="29" cy="64" r="15" fill="white"/>
		<circle class="fill" cx="29" cy="113" r="15" fill="white"/>
		<circle class="fill" cx="99" cy="64" r="15" fill="white"/>
		<circle class="fill" cx="99" cy="113" r="15" fill="white"/>
		<path class="fill" d="M37.2664 52.2292L35.8906 37.1474L51.9727 48.6128L37.2664 52.2292Z" fill="white"/>
		<path class="fill" d="M29.5653 99.5557L18.7254 88.3276L39.8612 87.8268L29.5653 99.5557Z" fill="white"/>
		<path class="fill" d="M99.5654 99.5938L88.7256 88.3657L109.861 87.8649L99.5654 99.5938Z" fill="white"/>
		<path class="fill" d="M89.5675 52.5196L75.1895 47.7629L92.1199 37.5918L89.5675 52.5196Z" fill="white"/>
		<path class="text" d="M25.5795 60.2102V59.2727H32.125V60.2102H29.3807V68H28.3239V60.2102H25.5795Z" fill="black"/>
		<path class="text" d="M97.0568 68V59.2727H100.006C100.688 59.2727 101.247 59.3892 101.685 59.6222C102.122 59.8523 102.446 60.169 102.656 60.5724C102.866 60.9759 102.972 61.4347 102.972 61.9489C102.972 62.4631 102.866 62.919 102.656 63.3168C102.446 63.7145 102.124 64.027 101.689 64.2543C101.254 64.4787 100.699 64.5909 100.023 64.5909H97.6364V63.6364H99.9886C100.455 63.6364 100.83 63.5682 101.114 63.4318C101.401 63.2955 101.608 63.1023 101.736 62.8523C101.866 62.5994 101.932 62.2983 101.932 61.9489C101.932 61.5994 101.866 61.294 101.736 61.0327C101.605 60.7713 101.396 60.5696 101.109 60.4276C100.822 60.2827 100.443 60.2102 99.9716 60.2102H98.1136V68H97.0568ZM101.165 64.0795L103.312 68H102.085L99.9716 64.0795H101.165Z" fill="black"/>
		<path class="text" d="M30.1136 108.273V117H29.0568V108.273H30.1136Z" fill="black"/>
		<path class="text" d="M97.0568 117V108.273H102.324V109.21H98.1136V112.159H102.051V113.097H98.1136V116.062H102.392V117H97.0568Z" fill="black"/>
		</g>
	</svg>
</template>

<style scoped>
svg{
	transform: scale(1.2, 1.2);
}

svg.selected .stroke {
	stroke: var(--stroke-clr);
}

svg.selected .fill {
	fill: var(--stroke-clr);
}

svg.selected .text {
	fill: #ffffff;
}
</style>
