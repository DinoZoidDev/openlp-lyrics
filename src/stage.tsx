/*
	###############################################################################
	# OpenLP - Open Source Lyrics Projection                                      #
	# --------------------------------------------------------------------------- #
	# Copyright (c) 2008-2017 OpenLP Developers                                   #
	# --------------------------------------------------------------------------- #
	# This program is free software; you can redistribute it and/or modify it     #
	# under the terms of the GNU General Public License as published by the Free  #
	# Software Foundation; version 2 of the License.                              #
	#                                                                             #
	# This program is distributed in the hope that it will be useful, but WITHOUT #
	# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or       #
	# FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for    #
	# more details.                                                               #
	#                                                                             #
	# You should have received a copy of the GNU General Public License along     #
	# with this program; if not, write to the Free Software Foundation, Inc., 59  #
	# Temple Place, Suite 330, Boston, MA 02111-1307 USA                          #
	###############################################################################
*/

import clsx from "clsx";
import { useAtom } from "jotai";
import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import "./stage.css";
import "./base.css";

import { configAtom } from "./utils/store";

type Slide = {
    title?: string;
    html?: string;
    text?: string;
    tag: string;
    selected: boolean;
};

const obsChannel = new BroadcastChannel("obs_openlp_channel");

function Stage() {
    const [config, setConfig] = useAtom(configAtom);

    const [currentSlides, setCurrentSlides] = useState<Slide[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [currentItem, setCurrentItem] = useState(null);
    const [currentService, setCurrentService] = useState(null);

    const titleRef = useRef<HTMLDivElement | null>(null);
    const titleContainerRef = useRef<HTMLDivElement | null>(null);
    const lyricsContainerRefs = [
        useRef<HTMLDivElement | null>(null),
        useRef<HTMLDivElement | null>(null),
    ];
    const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

    const updateTitle = () => {
        if (!currentSlides === undefined) return;
        const slide = currentSlides[currentSlide];
        if (slide && slide.title) {
            const titleDiv = titleRef.current;
            if (!titleDiv) return;
            let title = slide.title;
            let validTitle = false;
            let plugin: "bibles" | "songs";
            if (!isNaN(parseInt(slide.text![0], 10))) {
                plugin = "bibles";
            } else {
                plugin = "songs";
            }
            if (config.titleVisible[plugin]) {
                if (plugin === "bibles") {
                    const location = String(
                        /\d? ?\w+ \d+:[0-9, -]+/.exec(title),
                    ).trim();
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
                const slides = data.results.slides as Slide[];
                setCurrentSlides(slides);
                setCurrentSlide(0);
                let tag = "";
                let lastChange = 0;
                slides.forEach((slide, idx) => {
                    const prevtag = tag;
                    tag = slide.tag;
                    if (tag !== prevtag) {
                        lastChange = idx;
                    } else {
                        if (
                            slide.text === slides[lastChange].text &&
                            slides.length >= idx + (idx - lastChange)
                        ) {
                            let match = true;
                            for (
                                let idx2 = 0;
                                idx2 < idx - lastChange;
                                idx2++
                            ) {
                                if (
                                    slides[lastChange + idx2].text !==
                                    slides[idx + idx2].text
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
        const slide = currentSlides[currentSlide];
        if (!slide) return;
        const slideData = {
            type: "lyrics",
            lines: slide.text?.split(/\n/g),
        };
        obsChannel.postMessage(JSON.stringify(slideData));
    };

    const pollServer = () => {
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

                setConfig({
                    ...config,
                    lyricsHidden: blankScreen || config.alwaysHide,
                });
            });
    };

    const channelReceive = (event: MessageEvent<any>) => {
        if (!event.data) return;
        let lyricsContainer =
            lyricsContainerRefs[config.lyricsContainerIndex].current;
        const data = JSON.parse(event.data);
        switch (data.type) {
            case "titleLayout":
                setConfig({
                    ...config,
                    horizontalAnchor: data.hAnchor,
                    verticalAnchor: data.vAnchor,
                });
                break;
            case "lyricsLayout":
                setConfig({
                    ...config,
                    horizontalAnchor: data.hAnchor,
                    verticalAnchor: data.vAnchor,
                });
                break;
            case "hide":
                setConfig({ ...config, alwaysHide: data.value });
                break;
            case "fadeDuration":
                setConfig({ ...config, fadeDuration: Number(data.value) });
                break;
            case "crossfadeDuration":
                setConfig({ ...config, crossfadeDuration: Number(data.value) });
                break;
            case "resize":
                setConfig({ ...config, autoResize: data.value });
                // updateLayout = true;
                break;
            case "titleVisibility":
                if (data.song !== undefined) {
                    setConfig({
                        ...config,
                        titleVisible: {
                            ...config.titleVisible,
                            songs: data.song,
                        },
                    });
                }
                if (data.bible !== undefined) {
                    setConfig({
                        ...config,
                        titleVisible: {
                            ...config.titleVisible,
                            bibles: data.bible,
                        },
                    });
                }
                updateTitle();
                break;
            case "nextSlide":
                fetch("/api/controller/live/next");
                break;
            case "previousSlide":
                fetch("/api/controller/live/previous");
                break;
            case "lyrics":
                if (!lyricsContainer) return;
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
                            lyricsContainerRefs[1 - config.lyricsContainerIndex]
                                .current;
                        lyricsContainer.style.opacity = "0";
                        if (nextLyricsContainer) {
                            nextLyricsContainer.innerHTML = data.value;
                            nextLyricsContainer.style.opacity = "1";
                        }

                        setConfig({
                            ...config,
                            lyricsContainerIndex:
                                1 - config.lyricsContainerIndex,
                        });
                        lyricsContainer = nextLyricsContainer;
                    }
                }
                resizeLayout();
                break;
            default:
                console.log("Unsupported message: " + data.type + ":");
                console.log(data);
                break;
        }
    };

    function resizeLayout() {
        const lyricsContainer =
            lyricsContainerRefs[config.lyricsContainerIndex].current;
        if (
            config.autoResize &&
            lyricsContainer &&
            lyricsContainerRef.current
        ) {
            const lyricsParent = lyricsContainerRef.current;
            while (
                lyricsContainer.offsetHeight > lyricsParent.clientHeight &&
                lyricsParent.clientHeight > 0
            ) {
                const currentSize =
                    window.getComputedStyle(lyricsContainer).fontSize;
                const nextSize = parseInt(currentSize, 10) - 1 + "px";
                lyricsContainer.style.fontSize = nextSize;
            }
        }
    }

    useEffect(() => {
        setInterval(pollServer, 250);
        pollServer();

        obsChannel.onmessage = channelReceive;
        obsChannel.postMessage(JSON.stringify({ type: "init" }));
    }, []);

    const centerClasses = [
        config.horizontalAnchor === "CENTER" ? "justify-center" : "justify-end",
        config.verticalAnchor === "MIDDLE" ? "items-center" : "items-end",
        "flex",
    ];

    const hide =
        config.crossfadeDuration === 0 ||
        config.emptyString ||
        config.alwaysHide ||
        config.lyricsHidden;

    return (
        <div id="content">
            <div
                class="title-container"
                ref={titleContainerRef}
                className={clsx(centerClasses)}
            >
                <div class="title" ref={titleRef}></div>
            </div>
            <div
                id="lyrics-container"
                ref={lyricsContainerRef}
                className={clsx(hide && "hidden", centerClasses)}
            >
                <div class="lyrics" ref={lyricsContainerRefs[0]}></div>
            </div>
            {/* <div class="title-container">
				<div class="title"></div>
			</div> */}
        </div>
    );
}

render(<Stage />, document.getElementById("stage")!);
