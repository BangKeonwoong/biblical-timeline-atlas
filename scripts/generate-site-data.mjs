import fs from "node:fs/promises";
import path from "node:path";
import {
  rawAnchorEvents,
  bookPlacements,
  controversies,
  eras,
  sourcePaths,
} from "./source/anchor-events.mjs";

const outputPath = path.resolve("src/data/generated/site-data.json");
const chapterCache = new Map();

async function listDirectories(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function buildBookMaps() {
  const [nkrvEntries, bhsEntries] = await Promise.all([
    listDirectories(sourcePaths.nkrv),
    listDirectories(sourcePaths.bhs),
  ]);

  const nkrvMap = new Map(
    nkrvEntries.map((entry) => {
      const book = entry.replace(/^\d+-/, "");
      return [book, entry];
    }),
  );

  const bhsMap = new Map(
    bhsEntries.map((entry) => {
      const match = entry.match(/^\d+\s+(.+)$/);
      return [match ? match[1] : entry, entry];
    }),
  );

  return { nkrvMap, bhsMap };
}

function padChapter(chapter, width) {
  return String(chapter).padStart(width, "0");
}

function buildReferenceLabel(ref) {
  const start = `${ref.book} ${ref.chapterStart}:${ref.verseStart}`;
  if (ref.chapterStart === ref.chapterEnd && ref.verseStart === ref.verseEnd) {
    return start;
  }

  if (ref.chapterStart === ref.chapterEnd) {
    return `${ref.book} ${ref.chapterStart}:${ref.verseStart}-${ref.verseEnd}`;
  }

  return `${start}-${ref.chapterEnd}:${ref.verseEnd}`;
}

async function readChapter(ref, maps) {
  const cacheKey = `${ref.translation}:${ref.sourceKey}:${ref.chapter}`;
  if (chapterCache.has(cacheKey)) {
    return chapterCache.get(cacheKey);
  }

  let filePath;
  if (ref.translation === "NKRV") {
    const dir = maps.nkrvMap.get(ref.sourceKey);
    if (!dir) throw new Error(`NKRV directory not found for ${ref.sourceKey}`);
    filePath = path.join(sourcePaths.nkrv, dir, `${padChapter(ref.chapter, 3)}.md`);
  } else if (ref.translation === "BHS") {
    const dir = maps.bhsMap.get(ref.sourceKey);
    if (!dir) throw new Error(`BHS directory not found for ${ref.sourceKey}`);
    filePath = path.join(sourcePaths.bhs, dir, `${padChapter(ref.chapter, 2)}.md`);
  } else if (ref.translation === "SBLGNT") {
    filePath = path.join(
      sourcePaths.sblgnt,
      "markdown",
      ref.sourceKey,
      `${ref.sourceKey}_${padChapter(ref.chapter, 2)}.md`,
    );
  } else {
    throw new Error(`Unsupported translation: ${ref.translation}`);
  }

  const raw = await fs.readFile(filePath, "utf8");
  let parsed;
  if (ref.translation === "NKRV") {
    parsed = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .map((line) => line.match(/^(\d+)\.\s+(.*)$/))
      .filter(Boolean)
      .map((match) => ({ verse: match[1], text: match[2] }));
  } else if (ref.translation === "BHS") {
    parsed = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .map((line) => line.match(/^(\d+)\s+(.*)$/))
      .filter(Boolean)
      .map((match) => ({ verse: match[1], text: match[2] }));
  } else {
    const lines = raw.split(/\r?\n/);
    const verses = [];
    for (let index = 0; index < lines.length; index += 1) {
      const heading = lines[index].trim().match(/^###\s+(\d+):(\d+)$/);
      if (!heading) continue;

      const verseNumber = heading[2];
      const chunks = [];
      for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
        const nextLine = lines[cursor].trim();
        if (!nextLine) continue;
        if (nextLine.startsWith("### ")) break;
        if (nextLine.startsWith("> ")) continue;
        chunks.push(nextLine);
      }

      verses.push({
        verse: verseNumber,
        text: chunks.join(" ").trim(),
      });
    }
    parsed = verses;
  }

  chapterCache.set(cacheKey, { filePath, verses: parsed });
  return { filePath, verses: parsed };
}

async function extractPassage(ref, maps) {
  const verses = [];
  let sourcePath;

  for (let chapter = ref.chapterStart; chapter <= ref.chapterEnd; chapter += 1) {
    const { filePath, verses: chapterVerses } = await readChapter(
      { ...ref, chapter },
      maps,
    );
    sourcePath ||= filePath;
    const startVerse = chapter === ref.chapterStart ? ref.verseStart : 1;
    const endVerse =
      chapter === ref.chapterEnd ? ref.verseEnd : Number(chapterVerses.at(-1)?.verse ?? 999);

    verses.push(
      ...chapterVerses.filter((line) => {
        const verse = Number(line.verse);
        return verse >= startVerse && verse <= endVerse;
      }),
    );
  }

  if (!verses.length) {
    throw new Error(`No verses extracted for ${buildReferenceLabel(ref)}`);
  }

  return {
    reference: buildReferenceLabel(ref),
    translation: ref.translation,
    verses,
    sourcePath,
  };
}

async function buildAnchorEvents(maps) {
  const results = [];

  for (const [index, event] of rawAnchorEvents.entries()) {
    const focusPassages = [];
    for (const ref of event.focusRefs) {
      focusPassages.push(await extractPassage(ref, maps));
    }

    results.push({
      ...event,
      order: index + 1,
      focusPassages,
    });
  }

  return results;
}

async function main() {
  const maps = await buildBookMaps();
  const anchorEvents = await buildAnchorEvents(maps);

  const payload = {
    generatedAt: new Date().toISOString(),
    thesis:
      "정경 순서가 아니라 역사 순서로 배치하고, 언약의 축과 본문 3층 구조로 성경신학적 흐름을 드러낸다.",
    method: [
      "16개 대시대와 40개 앵커 사건으로 먼저 전체 골격을 고정한다.",
      "각 사건은 주본문, 핵심 근거 말씀, 성취·해석 본문을 분리한다.",
      "예언서, 시가서, 서신은 역사 지점에 재배치하고 논쟁 지점은 별도 레지스터로 뺀다.",
    ],
    eras,
    anchorEvents,
    bookPlacements,
    controversies,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
