import { exec } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execPromise = promisify(exec);

export const POST = async (req: NextRequest) => {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 }
    );
  }

  const { fileName } = await req.json();
  console.log("🚀 ~ POST ~ fileName:", fileName);

  // Save props to a temporary JSON file
  const props = {
    src: `public/uploads/${fileName}.mp4`,
    subtitleSrc: `public/subtitle/${fileName}.json`,
  };

  const propsFilePath = path.join(
    process.cwd(),
    `public/temp/${fileName}-props.json`
  );

  // Ensure the directory exists
  fs.mkdirSync(path.join(process.cwd(), "public/temp"), { recursive: true });

  // Write the props JSON to a file
  fs.writeFileSync(propsFilePath, JSON.stringify(props));

  try {
    const rendercommand = `npx remotion render src/remotion/index.ts CaptionedVideo public/out/${fileName}.mp4 --props=${propsFilePath}`;
    await execPromise(rendercommand);

    // Clean up the temporary props file after rendering
    fs.unlinkSync(propsFilePath);

    return NextResponse.json({
      message: "Video generated successfully",
      url: `/out/${fileName}.mp4`,
    });
  } catch (error) {
    console.log("🚀 ~ POST ~ error:", error);

    // Clean up in case of failure as well
    if (fs.existsSync(propsFilePath)) {
      fs.unlinkSync(propsFilePath);
    }

    return NextResponse.json(
      { message: "Failed to generate video" },
      { status: 500 }
    );
  }
};

// npx remotion render src/remotion/index.ts CaptionedVideo public/out/custom-video-name.mp4 --props='{"src":"public/uploads/1727226260168_425sample-video.mp4","subtitleSrc":"public/subtitle/1727226260168_425sample-video.json"}'
