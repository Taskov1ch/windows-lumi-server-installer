import React from "react";

const colorMap: { [key: string]: string } = {
	"0": "#000000", // black
	"1": "#0000AA", // dark_blue
	"2": "#00AA00", // dark_green
	"3": "#00AAAA", // dark_aqua
	"4": "#AA0000", // dark_red
	"5": "#AA00AA", // dark_purple
	"6": "#FFAA00", // gold
	"7": "#AAAAAA", // gray
	"8": "#555555", // dark_gray
	"9": "#5555FF", // blue
	a: "#55FF55", // green
	b: "#55FFFF", // aqua
	c: "#FF5555", // red
	d: "#FF55FF", // light_purple
	e: "#FFFF55", // yellow
	f: "#FFFFFF", // white
};

const formatMap: { [key: string]: React.CSSProperties } = {
	l: { fontWeight: "bold" },
	m: { textDecoration: "line-through" },
	n: { textDecoration: "underline" },
	o: { fontStyle: "italic" },
};

export const parseMotd = (text: string): React.ReactNode[] => {
	const parts = text.split("§");
	const nodes: React.ReactNode[] = [];

	let currentStyle: React.CSSProperties = {
		color: colorMap["f"],
	};

	if (parts[0]) {
		nodes.push(
			<span key="part-0" style={currentStyle} >
				{parts[0]}
			</span>
		);
	}

	for (let i = 1; i < parts.length; i++) {
		const part = parts[i];
		if (!part) continue;

		const code = part[0].toLowerCase();
		const content = part.substring(1);

		if (colorMap[code]) {
			currentStyle = {
				color: colorMap[code],
			};
		} else if (formatMap[code]) {
			currentStyle = { ...currentStyle, ...formatMap[code] };
		} else if (code === "r") {
			currentStyle = {
				color: colorMap["f"],
			};
		}

		if (content) {
			nodes.push(
				<span key={`part-${i}`} style={currentStyle} >
					{content}
				</span>
			);
		}
	}

	return nodes;
};