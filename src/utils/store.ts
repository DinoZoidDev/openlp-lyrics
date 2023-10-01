import { atom } from "jotai";

export const configAtom = atom<{
    lyricsHidden: boolean;
    emptyString: boolean;
    alwaysHide: boolean;
    crossfadeDuration: number;
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
    emptyString: false,
    alwaysHide: false,
    crossfadeDuration: 500,
    fadeDuration: 900,
    titleVisible: {
        songs: false,
        bibles: false,
    },
    autoResize: false,
    horizontalAnchor: "CENTER",
    verticalAnchor: "BOTTOM",
});
