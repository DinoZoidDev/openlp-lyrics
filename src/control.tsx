/**
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
**/

import "./control.css";
import "./base.css";

import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

// const LEFT = 0,
//     RIGHT = 1,
//     CENTER = 2,
//     TOP = 0,
//     BOTTOM = 1;

const CENTER = 2;

const openlpChannel = new BroadcastChannel("obs_openlp_channel");
let currentLines: string[];
let lastDisplayedIndex: number;

// let autoResize = true;

const max_saved_lines = 5;
const pastLines: string[] = [];
const pastPreviews: string[] = [];
// let historyIndex = 0;

// let hiding = false;
// const crossfadeDuration = 500;
// const fadeDuration = 900;

// let autoSplitLongLines = true;
// let maxCharacters = 60;
// let minWords = 3;

// const textFormatting = {
//     all: false,
//     bold: true,
//     italics: true,
//     underline: true,
//     colors: false,
//     superscript: true,
//     subscript: false,
//     paragraph: false,
// };

export function Control() {
    const slideTextRef = useRef<HTMLDivElement | null>(null);
    const previewTextRef = useRef<HTMLDivElement | null>(null);
    const incrementSpinnerRef = useRef<HTMLInputElement | null>(null);
    const autoUpdateCheckboxRef = useRef<HTMLInputElement | null>(null);
    const autoHideCheckboxRef = useRef<HTMLInputElement | null>(null);
    const lyricsFontSizeSpinnerRef = useRef<HTMLInputElement | null>(null);
    const titleFontSizeSpinnerRef = useRef<HTMLInputElement | null>(null);
    const lyricsMaxWidthSpinnerRef = useRef<HTMLInputElement | null>(null);
    const lyricsHeightSpinnerRef = useRef<HTMLInputElement | null>(null);
    const displayAllCheckboxRef = useRef<HTMLInputElement | null>(null);
    const splitLinesCheckboxRef = useRef<HTMLInputElement | null>(null);
    const maxCharactersSpinnerRef = useRef<HTMLInputElement | null>(null);
    const minWordsSpinnerRef = useRef<HTMLInputElement | null>(null);
    const boldCheckboxRef = useRef<HTMLInputElement | null>(null);
    const italicsCheckboxRef = useRef<HTMLInputElement | null>(null);
    const underlineCheckboxRef = useRef<HTMLInputElement | null>(null);
    const colorsCheckboxRef = useRef<HTMLInputElement | null>(null);
    const superscriptCheckboxRef = useRef<HTMLInputElement | null>(null);
    const subscriptCheckboxRef = useRef<HTMLInputElement | null>(null);
    // const paragraphCheckboxRef = useRef<HTMLInputElement | null>(null);
    // const titleBoldCheckboxRef = useRef<HTMLInputElement | null>(null);
    // const titleItalicsCheckboxRef = useRef<HTMLInputElement | null>(null);
    // const titleUnderlineCheckboxRef = useRef<HTMLInputElement | null>(null);
    // const titleSuperscriptCheckboxRef = useRef<HTMLInputElement | null>(null);
    // const titleSubscriptCheckboxRef = useRef<HTMLInputElement | null>(null);
    const [_, setNextText] = useState("");
    const [previewText, setPreviewText] = useState("");

    useEffect(() => {
        if (slideTextRef.current && previewTextRef.current) {
            autoUpdateCheckboxRef.current?.addEventListener("change", () => {
                if (autoUpdateCheckboxRef.current?.checked) {
                    displayNext(Number(incrementSpinnerRef.current?.value));
                }
            });

            autoHideCheckboxRef.current?.addEventListener("change", () => {
                openlpChannel.postMessage(
                    JSON.stringify({
                        type: "hideOnBlank",
                        value: autoHideCheckboxRef.current?.checked,
                    }),
                );
            });

            transmitLyricsLayout();
            transmitTitleLayout();
            openlpChannel.postMessage(JSON.stringify({ type: "ready" }));
        }
    }, []);

    function saveLineForHistory() {
        const lineToSave = currentLines[lastDisplayedIndex];
        if (!lineToSave) return;
        if (pastLines.length >= max_saved_lines) {
            pastLines.shift();
            pastPreviews.shift();
        }
        pastLines.push(lineToSave);
        // pastPreviews.push(previewText);
        // historyIndex = pastLines.length;
    }

    function displayNext(amount: number) {
        if (amount <= 0) {
            return;
        }

        let linesToDisplay = "";
        for (
            let i = lastDisplayedIndex + 1;
            i <= lastDisplayedIndex + amount && i < currentLines.length;
            i++
        ) {
            linesToDisplay += currentLines[i] + "<br>";
            lastDisplayedIndex = i;
        }
        setNextText(linesToDisplay);

        updatePreview();
    }

    function updatePreview() {
        let linesToPreview = "";
        const previewIndex = Math.max(0, lastDisplayedIndex - 3);
        for (let i = previewIndex; i <= lastDisplayedIndex; i++) {
            linesToPreview += currentLines[i] + "<br>";
        }
        setPreviewText(linesToPreview);
        saveLineForHistory();
    }

    function transmitLyricsLayout() {
        const layout = {
            align: CENTER,
            valign: CENTER,
            bold: true,
            italics: false,
            underline: false,
            superscript: false,
            subscript: false,
            font: "Arial",
            size: parseInt(lyricsFontSizeSpinnerRef.current?.value || "0"),
            width: parseInt(lyricsMaxWidthSpinnerRef.current?.value || "0"),
            height: parseInt(lyricsHeightSpinnerRef.current?.value || "0"),
            color: "white",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
        };
        openlpChannel.postMessage(
            JSON.stringify({ type: "lyricsLayout", value: layout }),
        );
    }

    function transmitTitleLayout() {
        const layout = {
            align: CENTER,
            valign: CENTER,
            bold: true,
            italics: false,
            underline: false,
            superscript: false,
            subscript: false,
            font: "Arial",
            size: parseInt(titleFontSizeSpinnerRef.current?.value || "0"),
            color: "white",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
        };
        openlpChannel.postMessage(
            JSON.stringify({ type: "titleLayout", value: layout }),
        );
    }

    return (
        <div class="controls-container">
            <h1 data-i18n="display-control">Display control:</h1>
            <div class="floating">
                <div class="control-group custom-width">
                    <button
                        id="increment-button-1"
                        type="button"
                        data-i18n="display-next"
                    >
                        Display next
                    </button>
                    <input
                        id="increment-spinner-1"
                        type="number"
                        min="1"
                        step="1"
                        value="1"
                        size={2}
                    />
                    <button id="increment-button-2" data-i18n="display-next">
                        Display next
                    </button>
                    <input
                        id="increment-spinner-2"
                        type="number"
                        min="1"
                        step="1"
                        value="1"
                        size={2}
                    />
                </div>
            </div>
            <div class="floating">
                <div class="control-group">
                    <button
                        id="remaining-button"
                        type="button"
                        data-i18n="display-remaining"
                    >
                        Display remaining
                    </button>
                </div>
            </div>
            <div class="floating">
                <div class="control-group">
                    <button
                        id="undo-button"
                        type="button"
                        data-i18n="undo-display"
                    >
                        Undo display
                    </button>
                    <button
                        id="redo-button"
                        type="button"
                        data-i18n="redo-display"
                    >
                        Redo display
                    </button>
                </div>
            </div>
            <div class="floating">
                <div class="control-group">
                    <button
                        id="hide-button"
                        type="button"
                        data-i18n="hide-display"
                    >
                        Hide display
                    </button>
                </div>
            </div>
            <hr />
            <h1 data-i18n="slide-control">Slide control:</h1>
            <div class="floating">
                <div class="control-group">
                    <button
                        id="previous-button"
                        type="button"
                        data-i18n="previous-slide"
                    >
                        Previous slide
                    </button>
                    <button
                        id="next-button"
                        type="button"
                        data-i18n="next-slide"
                    >
                        Next slide
                    </button>
                </div>
            </div>
            <div class="floating">
                <h1 data-i18n="current-slide">Current slide:</h1>
                <div id="slide-text">{previewText}</div>
            </div>
            <div class="floating">
                <h1 data-i18n="settings">Settings</h1>
                <div class="floating">
                    <fieldset class="control-group">
                        <legend
                            data-i18n="title-layout"
                            data-collapse="title-layout"
                        >
                            Title layout
                        </legend>
                        <div id="title-layout">
                            <div class="control-group">
                                <label
                                    for="title-layout-h-anchor"
                                    data-i18n="horizontal-anchor"
                                >
                                    Horizontal anchor:
                                </label>
                                <br />
                                <select id="title-layout-h-anchor">
                                    <option value="Left" data-i18n="left">
                                        Left
                                    </option>
                                    <option value="Right" data-i18n="right">
                                        Right
                                    </option>
                                    <option value="Center" data-i18n="center">
                                        Center
                                    </option>
                                </select>
                            </div>
                            <div class="control-group">
                                <label
                                    for="title-layout-h-offset"
                                    data-i18n="horizontal-offset"
                                >
                                    Horizontal offset:
                                </label>
                                <br />
                                <input
                                    id="title-layout-h-offset"
                                    type="number"
                                    min="-1080"
                                    max="1080"
                                    step="8"
                                    value="0"
                                    size={6}
                                />
                            </div>
                            <br />
                            <div class="control-group">
                                <label
                                    for="title-layout-v-anchor"
                                    data-i18n="vertical-anchor"
                                >
                                    Vertical anchor:
                                </label>
                                <br />
                                <select id="title-layout-v-anchor">
                                    <option value="Top" data-i18n="top">
                                        Top
                                    </option>
                                    <option value="Bottom" data-i18n="bottom">
                                        Bottom
                                    </option>
                                </select>
                            </div>
                            <div class="control-group">
                                <label
                                    for="title-font-size-spinner"
                                    data-i18n="font-size"
                                >
                                    Font size
                                </label>
                                <br />
                                <input
                                    id="title-font-size-spinner"
                                    type="number"
                                    min="0"
                                    max="128"
                                    step="1"
                                    value="36"
                                    size={4}
                                />
                            </div>
                            <span data-i18n="title-visibility">
                                Display title during:
                            </span>
                            <div class="control-group">
                                <input
                                    id="title-visibility-song"
                                    type="checkbox"
                                />
                                <label
                                    for="title-visibility-song"
                                    data-i18n="title-visibility-song"
                                >
                                    Song
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="title-visibility-scripture"
                                    type="checkbox"
                                />
                                <label
                                    for="title-visibility-scripture"
                                    data-i18n="title-visibility-scripture"
                                >
                                    Scripture
                                </label>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset class="control-group">
                        <legend
                            data-i18n="lyrics-layout"
                            data-collapse="lyrics-layout"
                        >
                            Lyrics layout
                        </legend>
                        <div id="lyrics-layout">
                            <div class="control-group">
                                <label
                                    for="lyrics-layout-v-anchor"
                                    data-i18n="vertical-anchor"
                                >
                                    Vertical anchor:
                                </label>
                                <br />
                                <select id="lyrics-layout-v-anchor">
                                    <option value="Top" data-i18n="top">
                                        Top
                                    </option>
                                    <option value="Bottom" data-i18n="bottom">
                                        Bottom
                                    </option>
                                    <option value="Center" data-i18n="center">
                                        Center
                                    </option>
                                </select>
                            </div>
                            <div class="control-group">
                                <label
                                    for="lyrics-layout-v-offset"
                                    data-i18n="vertical-offset"
                                >
                                    Vertical offset:
                                </label>
                                <br />
                                <input
                                    id="lyrics-layout-v-offset"
                                    type="number"
                                    min="-1920"
                                    max="1920"
                                    step="8"
                                    value="0"
                                    size={5}
                                />
                            </div>
                            <div class="control-group">
                                <label
                                    for="lyrics-layout-h-anchor"
                                    data-i18n="horizontal-anchor"
                                >
                                    Horizontal anchor:
                                </label>
                                <br />
                                <select id="lyrics-layout-h-anchor">
                                    <option value="Left" data-i18n="left">
                                        Left
                                    </option>
                                    <option value="Right" data-i18n="right">
                                        Right
                                    </option>
                                    <option value="Center" data-i18n="center">
                                        Center
                                    </option>
                                </select>
                            </div>
                            <div class="control-group">
                                <label
                                    for="lyrics-layout-h-offset"
                                    data-i18n="horizontal-offset"
                                >
                                    Horizontal offset:
                                </label>
                                <br />
                                <input
                                    id="lyrics-layout-h-offset"
                                    type="number"
                                    min="-1080"
                                    max="1080"
                                    step="8"
                                    value="0"
                                    size={5}
                                />
                            </div>
                            <div class="control-group">
                                <label
                                    for="lyrics-font-size-spinner"
                                    data-i18n="font-size"
                                >
                                    Font size
                                </label>
                                <br />
                                <input
                                    id="lyrics-font-size-spinner"
                                    type="number"
                                    min="0"
                                    max="128"
                                    step="1"
                                    value="36"
                                    size={4}
                                    ref={lyricsFontSizeSpinnerRef}
                                />
                            </div>
                            <div class="control-group">
                                <label
                                    for="lyrics-max-width-spinner"
                                    data-i18n="max-width"
                                >
                                    Max width
                                </label>
                                <br />
                                <input
                                    id="lyrics-max-width-spinner"
                                    type="number"
                                    min="96"
                                    max="1920"
                                    step="8"
                                    value="1080"
                                    size={5}
                                    ref={lyricsMaxWidthSpinnerRef}
                                />
                            </div>
                            <div class="control-group">
                                <label
                                    for="lyrics-height-spinner"
                                    data-i18n="height"
                                >
                                    Height
                                </label>
                                <br />
                                <input
                                    id="lyrics-height-spinner"
                                    type="number"
                                    min="96"
                                    max="1080"
                                    step="8"
                                    value="800"
                                    size={5}
                                    ref={lyricsHeightSpinnerRef}
                                />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset class="control-group">
                        <legend
                            data-i18n="lyrics-settings"
                            data-collapse="lyrics-settings"
                        >
                            Lyrics settings
                        </legend>
                        <div id="lyrics-settings">
                            <div class="control-group">
                                <input
                                    id="auto-update-checkbox"
                                    type="checkbox"
                                    ref={autoUpdateCheckboxRef}
                                />
                                <label
                                    for="auto-update-checkbox"
                                    data-i18n="auto-update-text"
                                >
                                    Auto-update text on slide change
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="display-all-checkbox"
                                    type="checkbox"
                                    ref={displayAllCheckboxRef}
                                />
                                <label
                                    for="display-all-checkbox"
                                    data-i18n="display-all-text"
                                >
                                    Display all text
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="auto-hide-checkbox"
                                    type="checkbox"
                                    ref={autoHideCheckboxRef}
                                />
                                <label
                                    for="auto-hide-checkbox"
                                    data-i18n="auto-hide-on-blank"
                                >
                                    Auto-hide when blank screen displayed
                                </label>
                            </div>
                            <div class="control-group">
                                <input id="resize-checkbox" type="checkbox" />
                                <label
                                    for="resize-checkbox"
                                    data-i18n="auto-resize-text"
                                >
                                    Resize text that doesn't fit in window
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="auto-split-long-lines-checkbox"
                                    type="checkbox"
                                    defaultChecked
                                    ref={splitLinesCheckboxRef}
                                />
                                <label
                                    for="auto-split-long-lines-checkbox"
                                    data-i18n="auto-split-long-lines"
                                >
                                    Automatically split long lines
                                </label>
                            </div>
                            <div
                                class="control-group"
                                id="split-max-characters"
                            >
                                <label
                                    for="split-max-characters-spinner"
                                    data-i18n="max-characters-per-line"
                                >
                                    Maximum characters per line
                                </label>
                                <br />
                                <input
                                    id="split-max-characters-spinner"
                                    type="number"
                                    min="10"
                                    max="200"
                                    step="5"
                                    value="60"
                                    size={3}
                                    ref={maxCharactersSpinnerRef}
                                />
                            </div>
                            <div class="control-group" id="split-min-words">
                                <label
                                    for="split-min-words-spinner"
                                    data-i18n="min-words-per-line"
                                >
                                    Minimum words per line
                                </label>
                                <br />
                                <input
                                    id="split-min-words-spinner"
                                    type="number"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value="3"
                                    size={2}
                                    ref={minWordsSpinnerRef}
                                />
                            </div>
                            <div class="control-group">
                                <label
                                    for="crossfade-duration-spinner"
                                    data-i18n="crossfade-duration"
                                >
                                    Crossfade duration
                                </label>
                                <br />
                                <input
                                    id="crossfade-duration-spinner"
                                    type="number"
                                    min="0"
                                    max="3000"
                                    step="100"
                                    value="500"
                                    size={5}
                                />
                            </div>
                            <div class="control-group">
                                <label
                                    for="fade-duration-spinner"
                                    data-i18n="fade-duration"
                                >
                                    Fade in/out duration
                                </label>
                                <br />
                                <input
                                    id="fade-duration-spinner"
                                    type="number"
                                    min="0"
                                    max="3000"
                                    step="100"
                                    value="900"
                                    size={5}
                                />
                            </div>
                        </div>
                    </fieldset>
                    <fieldset class="control-group">
                        <legend
                            data-i18n="control-settings"
                            data-collapse="control-settings"
                        >
                            Control settings
                        </legend>
                        <div id="control-settings">
                            <div class="control-group">
                                <label
                                    for="control-font-size-spinner"
                                    data-i18n="font-size"
                                >
                                    Font size
                                </label>
                                <br />
                                <input
                                    id="control-font-size-spinner"
                                    type="number"
                                    min="9"
                                    max="36"
                                    step="1"
                                    value="9"
                                    size={3}
                                />
                            </div>
                            <div class="control-group">
                                <label
                                    for="button-height-select"
                                    data-i18n="button-size"
                                >
                                    Button size
                                </label>
                                <br />
                                <select id="button-height-select">
                                    <option value="Normal" data-i18n="normal">
                                        Normal
                                    </option>
                                    <option value="Large" data-i18n="large">
                                        Large
                                    </option>
                                    <option value="Larger" data-i18n="larger">
                                        Larger
                                    </option>
                                </select>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset class="control-group">
                        <legend
                            data-i18n="text-formatting"
                            data-collapse="text-formatting-settings"
                        >
                            Text formatting
                        </legend>
                        <div id="text-formatting-settings">
                            <div class="control-group">
                                <input
                                    id="text-formatting-all-checkbox"
                                    type="checkbox"
                                />
                                <label
                                    for="text-formatting-all-checkbox"
                                    data-i18n="text-formatting-all"
                                >
                                    All
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="text-formatting-bold-checkbox"
                                    class="text-formatting-checkbox"
                                    type="checkbox"
                                    ref={boldCheckboxRef}
                                />
                                <label
                                    for="text-formatting-bold-checkbox"
                                    data-i18n="text-formatting-bold"
                                >
                                    Bold
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="text-formatting-italics-checkbox"
                                    class="text-formatting-checkbox"
                                    type="checkbox"
                                    ref={italicsCheckboxRef}
                                />
                                <label
                                    for="text-formatting-italics-checkbox"
                                    data-i18n="text-formatting-italics"
                                >
                                    Italics
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="text-formatting-underline-checkbox"
                                    class="text-formatting-checkbox"
                                    type="checkbox"
                                    ref={underlineCheckboxRef}
                                />
                                <label
                                    for="text-formatting-underline-checkbox"
                                    data-i18n="text-formatting-underline"
                                >
                                    Underline
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="text-formatting-colors-checkbox"
                                    class="text-formatting-checkbox"
                                    type="checkbox"
                                    ref={colorsCheckboxRef}
                                />
                                <label
                                    for="text-formatting-colors-checkbox"
                                    data-i18n="text-formatting-colors"
                                >
                                    Colors
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="text-formatting-superscript-checkbox"
                                    class="text-formatting-checkbox"
                                    type="checkbox"
                                    ref={superscriptCheckboxRef}
                                />
                                <label
                                    for="text-formatting-superscript-checkbox"
                                    data-i18n="text-formatting-superscript"
                                >
                                    Superscript (small verse numbers)
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="text-formatting-subscript-checkbox"
                                    class="text-formatting-checkbox"
                                    type="checkbox"
                                    ref={subscriptCheckboxRef}
                                />
                                <label
                                    for="text-formatting-subscript-checkbox"
                                    data-i18n="text-formatting-subscript"
                                >
                                    Subscript
                                </label>
                            </div>
                            <div class="control-group">
                                <input
                                    id="text-formatting-paragraph-checkbox"
                                    class="text-formatting-checkbox"
                                    type="checkbox"
                                />
                                <label
                                    for="text-formatting-paragraph-checkbox"
                                    data-i18n="text-formatting-paragraph"
                                >
                                    Paragraphs
                                </label>
                            </div>
                        </div>
                    </fieldset>
                </div>
            </div>
        </div>
    );
}

render(<Control />, document.getElementById("control")!);
