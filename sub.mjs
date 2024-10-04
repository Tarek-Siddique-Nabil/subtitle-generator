import { execSync } from "node:child_process";
import {
  existsSync,
  rmSync,
  writeFileSync,
  lstatSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import path from "path";
import {
  WHISPER_LANG,
  WHISPER_MODEL,
  WHISPER_PATH,
  WHISPER_VERSION,
} from "./whisper-config.mjs";
import {
  convertToCaptions,
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
} from "@remotion/install-whisper-cpp";

const extractToTempAudioFile = (fileToTranscribe, tempOutFile) => {
  // Extracting audio from mp4 and save it as 16khz wav file
  execSync(
    `npx remotion ffmpeg -i ${fileToTranscribe} -ar 16000 ${tempOutFile} -y`,
    { stdio: ["ignore", "inherit"] }
  );
};

const subFile = async (filePath, fileName) => {
  const outPath = path.join(
    process.cwd(),
    "public",
    "subtitle",
    fileName.replace(".wav", ".json")
  );

  const result = await transcribe({
    inputPath: filePath,
    model: WHISPER_MODEL,
    tokenLevelTimestamps: true,
    whisperPath: WHISPER_PATH,
    printOutput: false,
    translateToEnglish: false,
    language: "Bengali",

    onProgress: (progress) => {
      console.log(`Transcribing ${fileName}... ${Math.round(progress * 100)}%`);
    },
  });
  console.log("🚀 ~ subFile ~ result:", result);
  const { captions } = convertToCaptions({
    transcription: result.transcription,
    combineTokensWithinMilliseconds: 200,
  });
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        ...result,
        transcription: captions,
      },
      null,
      2
    )
  );
};

const processVideo = async (fullPath, entry, directory) => {
  if (
    !fullPath.endsWith(".mp4") &&
    !fullPath.endsWith(".webm") &&
    !fullPath.endsWith(".mkv") &&
    !fullPath.endsWith(".mov")
  ) {
    return;
  }

  const isTranscribed = existsSync(
    fullPath
      .replace(/.mp4$/, ".json")
      .replace(/.mkv$/, ".json")
      .replace(/.mov$/, ".json")
      .replace(/.webm$/, ".json")
      .replace("webcam", "subs")
  );
  if (isTranscribed) {
    return;
  }
  const audioDir = path.join(process.cwd(), "public", "audio");
  if (!existsSync(audioDir)) {
    mkdirSync(audioDir);
  }

  const tempWavFileName = entry.split(".")[0] + ".wav";
  const tempOutFilePath = path.join(audioDir, tempWavFileName);

  // Extract audio to the audio folder
  extractToTempAudioFile(fullPath, tempOutFilePath);

  await subFile(tempOutFilePath, tempWavFileName);
};

const processDirectory = async (directory) => {
  const entries = readdirSync(directory).filter((f) => f !== ".DS_Store");

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stat = lstatSync(fullPath);

    if (stat.isDirectory()) {
      await processDirectory(fullPath); // Recurse into subdirectories
    } else {
      await processVideo(fullPath, entry);
    }
  }
};

await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });
await downloadWhisperModel({ folder: WHISPER_PATH, model: WHISPER_MODEL });

// Read arguments for filename if given else process all files in the directory
const hasArgs = process.argv.length > 2;

if (!hasArgs) {
  // If run without arguments, show error message
  console.error("Error: No video file path provided.");
  process.exit(1); // Exit with error status code
}

for (const arg of process.argv.slice(2)) {
  const fullPath = path.join(process.cwd(), arg);
  const stat = lstatSync(fullPath);

  if (stat.isDirectory()) {
    await processDirectory(fullPath);
    continue;
  }

  console.log(`Processing file ${fullPath}`);
  const directory = path.dirname(fullPath);
  const fileName = path.basename(fullPath);
  await processVideo(fullPath, fileName);
}
