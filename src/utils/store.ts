import { atom } from "jotai";

export const configAtom = atom<{
    lyricsHidden: boolean;
    titleHidden: boolean;
    emptyString: boolean;
    alwaysHide: boolean;
    crossfadeDuration: number;
    lyricsContainerIndex: number;
    fadeDuration: number;
    titleVisible: {
        songs: boolean;
        bibles: boolean;
    };
    autoResize: boolean;
    horizontalAnchor: "LEFT" | "CENTER" | "RIGHT";
    verticalAnchor: "TOP" | "MIDDLE" | "BOTTOM";
}>({
    lyricsHidden: false,
    titleHidden: false,
    emptyString: false,
    alwaysHide: false,
    crossfadeDuration: 500,
    lyricsContainerIndex: 0,
    fadeDuration: 900,
    titleVisible: {
        songs: false,
        bibles: false,
    },
    autoResize: false,
    horizontalAnchor: "CENTER",
    verticalAnchor: "BOTTOM",
});
