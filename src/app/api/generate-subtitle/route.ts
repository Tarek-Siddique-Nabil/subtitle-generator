import { exec, execSync } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promisify } from "util";

const execPromise = promisify(exec);
export const POST = async (req: NextRequest, res: NextResponse) => {
  if (req.method !== "POST") {
    return NextResponse.json(
      { message: "Method Not Allowed" },
      { status: 405 }
    );
  }

  const { fileName } = await req.json();
  if (!fileName) {
    return NextResponse.json(
      { error: "File name not provided" },
      { status: 400 }
    );
  }

  // Create absolute path to the uploaded video file in the public/upload folder
  // const uploadPath = path.join(process.cwd(), "public", "upload", fileName);

  // // Normalize the path to ensure it works on Windows
  // const normalizedPath = uploadPath.replace(/\\/g, "/");

  try {
    // Log the upload path for debugging
    console.log("Executing sub.mjs with path:", `public/uploads${fileName}`);

    // Execute the sub.mjs script with the video file path as argument
    await execPromise(`node sub.mjs public/uploads/${fileName}`);

    // Return success response
    return NextResponse.json({ message: "Subtitles generated successfully" });
  } catch (error) {
    console.error("Error during subtitle generation:", error);
    return NextResponse.json(
      { message: "Failed to generate subtitles", error: error },
      { status: 500 }
    );
  }
};
