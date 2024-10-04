import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.resolve(process.env.ROOT_PATH ?? "", "public/uploads");

// Wrap exec in a promise

export const POST = async (req: NextRequest) => {
  const formData = await req.formData();

  const body = Object.fromEntries(formData);

  const file = (body.video as Blob) || null;

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR);
    }
    const videoName =
      `${Date.now()}` +
      `_${Math.floor(Math.random() * 1000)}` +
      (body.video as File).name.replaceAll(" ", "_");

    const videoPath = path.resolve(UPLOAD_DIR, videoName);

    fs.writeFileSync(videoPath, buffer);
    const outputFileName = `${path.basename(videoName)}`;
    return NextResponse.json(
      {
        success: true,
        filePath: outputFileName,
      },
      { status: 200 }
    );
  } else {
    return NextResponse.json(
      {
        success: false,
      },
      { status: 500 }
    );
  }
};

export const DELETE = async (req: NextRequest, res: NextResponse) => {
  const { fileName } = await req.json();
  if (!fileName) {
    return NextResponse.json(
      { error: "File name not provided" },
      { status: 400 }
    );
  }
  const filePath = path.join(process.cwd(), "public/uploads", fileName);
  const audioPath = path.join(
    process.cwd(),
    "public/audio",
    fileName
      .replace(/.mp4$/, ".wav")
      .replace(/.mkv$/, ".wav")
      .replace(/.mov$/, ".wav")
      .replace(/.webm$/, ".wav")
  );
  const subtitlePath = path.join(
    process.cwd(),
    "public/subtitle",
    fileName
      .replace(/.mp4$/, ".json")
      .replace(/.mkv$/, ".json")
      .replace(/.mov$/, ".json")
      .replace(/.webm$/, ".json")
  );
  try {
    // Remove the file
    await fs.promises.unlink(filePath);
    if (fs.existsSync(audioPath)) {
      await fs.promises.unlink(audioPath);
    }

    if (fs.existsSync(subtitlePath)) {
      await fs.promises.unlink(subtitlePath);
    }

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Error deleting file" }, { status: 500 });
  }
};
