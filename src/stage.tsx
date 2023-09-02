import { useState, useEffect, useRef } from "preact/hooks";

const Anchor = {
	LEFT: 0,
	RIGHT: 1,
	CENTER: 2
};

const VerticalAnchor = {
	TOP: 0,
	BOTTOM: 1,
	CENTER: 2
};

type Slide = {
	title: string;
	text: string[];
};

const obsChannel = new BroadcastChannel("obs_openlp_channel");

export function App() {
	const [config, setConfig] = useState({
		hideOnBlankScreen: false,
		lyricsHidden: false,
		titleHidden: false,
		emptyString: false,
		alwaysHide: false,
		crossfadeDuration: 500,
		lyricsContainerIndex: 0,
		fadeDuration: 900,
		titleVisible: {
			songs: false,
			bibles: false
		},
		autoResize: false,
		maxWidth: 600,
		textFormatting: {
			all: false,
			bold: true,
			italics: true,
			underline: true,
			colors: false,
			superscript: true,
			subscript: false,
			paragraph: false
		},
		startingFont: 36
	} as const);

	const [currentSlides, setCurrentSlides] = useState([]);
	const [currentSlide, setCurrentSlide] = useState(0);
	const [currentItem, setCurrentItem] = useState(null);
	const [currentService, setCurrentService] = useState(null);

	const titleDivRef = useRef<HTMLDivElement | null>(null);
	const lyricsContainerRefs = [
		useRef<HTMLDivElement | null>(null),
		useRef<HTMLDivElement | null>(null)
	];

	const updateTitle = () => {
		if (currentSlides === undefined) {
			return;
		}
		const slide = currentSlides[currentSlide];
		if (slide.title) {
			const titleDiv = titleDivRef.current;
			let title = slide.title;
			let validTitle = false;
			let plugin: "bibles" | "songs";
			if (!isNaN(parseInt(slide.text[0], 10))) {
				plugin = "bibles";
			} else {
				plugin = "songs";
			}
			if (config.titleVisible[plugin]) {
				if (plugin === "bibles") {
					const location = String(/\d? ?\w+ \d+:[0-9, -]+/.exec(title)).trim();
					const bibleVersions = title.match(/[A-Z]{3,}/g);
					const uniqueVersions = [...new Set(bibleVersions)];
					let versions = "";
					if (bibleVersions !== null) {
						uniqueVersions.forEach((version) => {
							versions += version + ", ";
						});
						versions = versions.slice(0, -2);
					}
					title = location + " " + versions;
				}
				titleDiv.innerHTML = title;
				validTitle = true;
			}
			if (!validTitle) {
				titleDiv.style.display = "none";
				setConfig({ ...config, titleHidden: true });
			} else {
				if (!config.lyricsHidden && !config.alwaysHide) {
					titleDiv.style.display = "block";
				}
				setConfig({ ...config, titleHidden: false });
			}
		}
	};

	const loadSlides = () => {
		fetch("/api/controller/live/text")
			.then((response) => response.json())
			.then((data) => {
				setCurrentSlides(data.results.slides);
				setCurrentSlide(0);
				let tag = "";
				let lastChange = 0;
				data.results.slides.forEach((slide, idx) => {
					const prevtag = tag;
					tag = slide.tag;
					if (tag !== prevtag) {
						lastChange = idx;
					} else {
						if (
							slide.text === data.results.slides[lastChange].text &&
							data.results.slides.length >= idx + (idx - lastChange)
						) {
							let match = true;
							for (let idx2 = 0; idx2 < idx - lastChange; idx2++) {
								if (
									data.results.slides[lastChange + idx2].text !==
									data.results.slides[idx + idx2].text
								) {
									match = false;
									break;
								}
							}
							if (match) {
								lastChange = idx;
							}
						}
					}
					if (slide.selected) setCurrentSlide(idx);
				});
				updateTitle();
				updateText();
			});
	};

	const updateText = () => {
		if (currentSlides === undefined) {
			return;
		}
		const slide = currentSlides[currentSlide];
		let text = "";
		const tags = [];
		if (slide.html || slide.text) {
			if (config.textFormatting.all === true) {
				tags.push("all");
			} else {
				Object.entries(config.textFormatting).forEach(([key, val]) => {
					if (val === true) {
						switch (key) {
							case "bold":
								tags.push("strong");
								break;
							case "italics":
								tags.push("em");
								break;
							case "underline":
								tags.push('span style="text-decoration: underline"');
								break;
							case "colors":
								tags.push('span style="-webkit-text-fill-color"');
								break;
							case "superscript":
								tags.push("sub");
								break;
							case "subscript":
								tags.push("sub");
								break;
							case "paragraph":
								tags.push("p");
								break;
						}
					}
				});
			}

			if (tags.length > 0) {
				text = filterTags(slide.html, tags);
			} else {
				text = slide.text;
			}
		}

		const slideData = { type: "lyrics", lines: text.split(/\n/g) };
		obsChannel.postMessage(JSON.stringify(slideData));
	};

	const pollServer = () => {
		const lyricsContainer =
			lyricsContainerRefs[config.lyricsContainerIndex].current;
		const titleDiv = titleDivRef.current;
		fetch("/api/poll")
			.then((response) => response.json())
			.then((data) => {
				if (
					currentItem !== data.results.item ||
					currentService !== data.results.service
				) {
					setCurrentItem(data.results.item);
					setCurrentService(data.results.service);
					loadSlides();
				} else if (currentSlide !== data.results.slide) {
					setCurrentSlide(parseInt(data.results.slide, 10));
					updateText();
				}
				const blankScreen =
					data.results.display === true ||
					data.results.theme === true ||
					data.results.blank === true;
				if ((blankScreen && config.hideOnBlankScreen) || config.alwaysHide) {
					if (!config.lyricsHidden) {
						lyricsContainer.style.display = "none";
						titleDiv.style.display = "none";
						setConfig({ ...config, lyricsHidden: true });
					}
				} else {
					if (config.lyricsHidden) {
						if (!config.emptyString) {
							lyricsContainer.style.display = "block";
							if (!config.titleHidden) {
								titleDiv.style.display = "block";
							}
						}
						setConfig({ ...config, lyricsHidden: false });
					}
				}
			});
	};

	const channelReceive = (ev) => {
		if (ev.data === null) {
			return;
		}
		let updateLayout = false;
		const lyricsContainer =
			lyricsContainerRefs[config.lyricsContainerIndex].current;
		const data = JSON.parse(ev.data);
		switch (data.type) {
			case "titleLayout":
				const titleContainer = titleDivRef.current;
				const titleDiv = titleDivRef.current;
				switch (data.hAnchor) {
					case Anchor.LEFT:
						titleContainer.style.justifyContent = "flex-start";
						titleDiv.style.marginLeft = data.hOffset + "px";
						titleDiv.style.marginRight = "0";
						break;
					case Anchor.RIGHT:
						titleContainer.style.justifyContent = "flex-end";
						titleDiv.style.marginRight = data.hOffset + "px";
						titleDiv.style.marginLeft = "0";
						break;
					case Anchor.CENTER:
						titleContainer.style.justifyContent = "center";
						titleDiv.style.marginLeft = data.hOffset + "px";
						titleDiv.style.marginRight = "0";
						break;
				}
				document.querySelectorAll(".title-container")[
					1 - data.vAnchor
				].style.display = "none";
				document.querySelectorAll(".title-container")[
					data.vAnchor
				].style.display = "block";
				break;
			case "lyricsLayout":
				const lyricsDiv =
					lyricsContainerRefs[config.lyricsContainerIndex].current;
				switch (data.hAnchor) {
					case Anchor.LEFT:
						lyricsDiv.style.left = data.hOffset + "px";
						lyricsDiv.style.right = "";
						lyricsDiv.style.marginLeft = "";
						break;
					case Anchor.RIGHT:
						lyricsDiv.style.left = "";
						lyricsDiv.style.right = data.hOffset + "px";
						lyricsDiv.style.marginLeft = "";
						break;
					case Anchor.CENTER:
						lyricsDiv.style.left = "";
						lyricsDiv.style.right = "";
						lyricsDiv.style.marginLeft = data.hOffset + "px";
						break;
				}
				switch (data.vAnchor) {
					case VerticalAnchor.TOP:
						lyricsDiv.style.top = data.vOffset + "px";
						lyricsDiv.style.bottom = "";
						lyricsDiv.style.marginTop = "";
						break;
					case VerticalAnchor.BOTTOM:
						lyricsDiv.style.top = "";
						lyricsDiv.style.bottom = data.vOffset + "px";
						lyricsDiv.style.marginTop = "";
						break;
					case VerticalAnchor.CENTER:
						lyricsDiv.style.top = "";
						lyricsDiv.style.bottom = "";
						lyricsDiv.style.marginTop = data.vOffset + "px";
						break;
				}
				break;
			case "maxWidth":
				setConfig({ ...config, maxWidth: data.value });
				document.querySelectorAll(".lyrics").forEach((lyrics) => {
					lyrics.style.maxWidth = data.value + "px";
				});
				break;
			case "lyricsHeight":
				document.querySelector("#lyrics-container").style.height =
					data.value + "px";
				break;
			case "hide":
				setConfig({ ...config, alwaysHide: data.value });
				break;
			case "hideOnBlank":
				setConfig({ ...config, hideOnBlankScreen: data.value });
				break;
			case "fadeDuration":
				setConfig({ ...config, fadeDuration: Number(data.value) });
				break;
			case "crossfadeDuration":
				setConfig({ ...config, crossfadeDuration: Number(data.value) });
				break;
			case "resize":
				setConfig({ ...config, autoResize: data.value });
				updateLayout = true;
				break;
			case "lyricsFont":
				setConfig({ ...config, startingFont: data.value });
				updateLayout = true;
				break;
			case "titleFont":
				titleDivRef.current.style.fontSize = data.value + "pt";
				break;
			case "titleVisibility":
				if (data.song !== undefined) {
					setConfig({
						...config,
						titleVisible: { ...config.titleVisible, songs: data.song }
					});
				}
				if (data.bible !== undefined) {
					setConfig({
						...config,
						titleVisible: { ...config.titleVisible, bibles: data.bible }
					});
				}
				updateTitle();
				break;
			case "textFormatting":
				setConfig({ ...config, textFormatting: data.value });
				break;
			case "nextSlide":
				fetch("/api/controller/live/next");
				break;
			case "previousSlide":
				fetch("/api/controller/live/previous");
				break;
			case "lyrics":
				if (data.value.length <= 4) {
					lyricsContainer.style.display = "none";
					setConfig({ ...config, emptyString: true });
				} else {
					if (
						config.crossfadeDuration === 0 ||
						config.emptyString ||
						config.alwaysHide ||
						config.lyricsHidden
					) {
						lyricsContainer.innerHTML = data.value;
						if (config.emptyString) {
							setConfig({ ...config, emptyString: false });
							if (!config.lyricsHidden && !config.alwaysHide) {
								lyricsContainer.style.display = "block";
							}
						}
					} else {
						const nextLyricsContainer =
							lyricsContainerRefs[1 - config.lyricsContainerIndex].current;
						nextLyricsContainer.innerHTML = data.value;
						lyricsContainer.style.opacity = "0";
						nextLyricsContainer.style.opacity = "1";

						setConfig({
							...config,
							lyricsContainerIndex: 1 - config.lyricsContainerIndex
						});
						lyricsContainer = nextLyricsContainer;
					}
				}
				updateLayout = true;
				break;
			default:
				console.log("Unsupported message: " + data.type + ":");
				console.log(data);
				break;
		}

		if (updateLayout) {
			lyricsContainer.style.fontSize = config.startingFont + "pt";

			if (config.autoResize) {
				const lyricsParent = document.querySelector("#lyrics-container");
				while (
					lyricsContainer.offsetHeight > lyricsParent.clientHeight &&
					lyricsParent.clientHeight > 0
				) {
					const currentSize = window.getComputedStyle(lyricsContainer).fontSize;
					const nextSize = parseInt(currentSize, 10) - 1 + "px";
					lyricsContainer.style.fontSize = nextSize;
				}
			}
		}
	};

	useEffect(() => {
		setInterval(pollServer, 250);
		pollServer();

		obsChannel.onmessage = channelReceive;
		obsChannel.postMessage(JSON.stringify({ type: "init" }));
	}, []);

	return (
		<div id="content">
			<div class="title-container">
				<div class="title" ref={titleDivRef}></div>
			</div>
			<div id="lyrics-container">
				<div class="lyrics" ref={lyricsContainerRefs[0]}></div>
				<div class="lyrics" ref={lyricsContainerRefs[1]}></div>
			</div>
			{/* <div class="title-container">
				<div class="title"></div>
			</div> */}
		</div>
	);
}
