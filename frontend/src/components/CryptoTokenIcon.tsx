interface CryptoTokenIconProps {
	className?: string;
}

export function CryptoTokenIcon({
	className = "w-8 h-8",
}: CryptoTokenIconProps = {}) {
	return (
		<svg
			className={className}
			fill='none'
			viewBox='0 0 24 24'
			xmlns='http://www.w3.org/2000/svg'
			style={{ color: "var(--primary)" }}
		>
			<defs>
				<linearGradient id='cryptoGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
					<stop
						offset='0%'
						style={{ stopColor: "var(--primary)", stopOpacity: 1 }}
					/>
					<stop
						offset='100%'
						style={{ stopColor: "var(--primary)", stopOpacity: 0.7 }}
					/>
				</linearGradient>
			</defs>
			<circle
				cx='12'
				cy='12'
				r='10'
				stroke='url(#cryptoGradient)'
				strokeWidth='1.5'
			></circle>
			<path
				d='M10 10L12 7L14 10'
				stroke='url(#cryptoGradient)'
				strokeLinecap='round'
				strokeLinejoin='round'
				strokeWidth='1.5'
			></path>
			<path
				d='M10 14L12 17L14 14'
				stroke='url(#cryptoGradient)'
				strokeLinecap='round'
				strokeLinejoin='round'
				strokeWidth='1.5'
			></path>
		</svg>
	);
}
