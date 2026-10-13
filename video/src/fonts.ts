import { continueRender, delayRender, staticFile } from "remotion";

const faces: [string, string, string, string][] = [
  ["Newsreader", "fonts/newsreader-latin-standard-normal.woff2", "normal", "200 800"],
  ["Newsreader", "fonts/newsreader-latin-standard-italic.woff2", "italic", "200 800"],
  ["Geist", "fonts/GeistSans.woff2", "normal", "100 900"],
  ["GeistMono", "fonts/GeistMono.woff2", "normal", "100 900"],
];

const handle = delayRender("fonts");
Promise.all(
  faces.map(([family, file, style, weight]) => {
    const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, { style, weight });
    (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
    return face.load();
  }),
)
  .then(() => continueRender(handle))
  .catch((e) => {
    console.error(e);
    continueRender(handle);
  });
