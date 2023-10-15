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

    const [slides, setSlides] = useState<Slide[]>([]);
    const [activeSlide, setActiveSlide] = useState<Slide>();
    const [activeItem, setActiveItem] = useState<string>();

    const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
    const lyricsRef = useRef<HTMLDivElement | null>(null);

    const pollServer = async () => {
        const pollResponse = await fetch("http://localhost:4316/api/poll");
        const { results: pollResults } = await pollResponse.json();

        // if (activeItem !== pollResults.item) {
        //     const response = await fetch(
        //         "http://localhost:4316/api/controller/live/text",
        //     );
        //     const results = await response.json();
        //     setSlides(results.slides as Slide[]);
        //     setActiveItem(results.item);
        // }

        const slide = slides[pollResults.slide];
        if (activeSlide !== slide) setActiveSlide(slide);

        setConfig({
            ...config,
            lyricsHidden:
                pollResults.display ||
                pollResults.theme ||
                pollResults.blank ||
                config.alwaysHide,
        });
    };

    const channelReceive = async (event: MessageEvent<any>) => {
        if (!event.data) return;
        let lyricsContainer = lyricsContainerRef.current;
        const data = JSON.parse(event.data);
        switch (data.type) {
            case "titleLayout":
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
            case "nextSlide":
                fetch("http://localhost:4316/api/controller/live/next");
                pollServer();
                break;
            case "previousSlide":
                fetch("http://localhost:4316/api/controller/live/previous");
                pollServer();
                break;
            case "lyrics":
                if (!lyricsContainer) return;
                if (data.value.length <= 4) {
                    lyricsContainer.style.display = "none";
                    setConfig({ ...config, emptyString: true });
                } else {
                    if (hide) {
                        lyricsContainer.innerHTML = data.value;
                        if (config.emptyString) {
                            setConfig({ ...config, emptyString: false });
                            if (!config.lyricsHidden && !config.alwaysHide) {
                                lyricsContainer.style.display = "block";
                            }
                        }
                    }
                }
                break;
            default:
                console.log("Unsupported message: " + data.type + ":");
                console.log(data);
                break;
        }
    };

    // const resizeLayout = () => {
    //     const lyricsContainer = lyricsContainerRef.current;
    //     const lyrics = lyricsRef.current;
    //     if (config.autoResize && lyricsContainer && lyrics) {
    //         while (
    //             lyrics.offsetHeight > lyricsContainer.clientHeight &&
    //             lyricsContainer.clientHeight > 0
    //         ) {
    //             const currentSize =
    //                 window.getComputedStyle(lyricsContainer).fontSize;
    //             const nextSize = parseInt(currentSize, 10) - 1 + "px";
    //             lyricsContainer.style.fontSize = nextSize;
    //         }
    //     }
    // };

    useEffect(() => {
        let pollInterval = 0;

        (async () => {
            const response = await fetch(
                "http://localhost:4316/api/controller/live/text",
            );
            const { results } = await response.json();
            const slides = results.slides as Slide[];
            console.log(results.item);
            setActiveItem(results.item);
            setSlides(slides);

            const slide = slides.find((slide) => slide.selected);
            if (activeSlide !== slide) setActiveSlide(slide);

            pollInterval = setInterval(pollServer, 250);
            pollServer();

            obsChannel.addEventListener("message", channelReceive);
        })();

        return () => clearInterval(pollInterval);
    }, []);

    const centerClasses = [
        config.horizontalAnchor === "CENTER"
            ? "text-center justify-center"
            : config.horizontalAnchor === "RIGHT"
            ? "justify-end"
            : "justify-start",
        config.verticalAnchor === "MIDDLE"
            ? "align-middle items-center"
            : config.verticalAnchor === "BOTTOM"
            ? "items-end"
            : "items-start",
        "flex",
    ];

    const hide =
        config.crossfadeDuration === 0 ||
        config.emptyString ||
        config.alwaysHide ||
        config.lyricsHidden;

    return (
        <div
            id="lyrics-container"
            ref={lyricsContainerRef}
            className={clsx(
                hide && "hidden",
                centerClasses,
                "absolute bottom-0 left-0 flex w-full",
            )}
        >
            <div
                ref={lyricsRef}
                class="w-full whitespace-pre p-4 text-7xl font-semibold text-white backdrop-blur-lg"
            >
                {activeSlide?.text}
            </div>
        </div>
    );
}

render(<Stage />, document.getElementsByTagName("body")[0]!);
