"use client";
import { ModeToggle } from "@/components/mode-toggle";
import AnimatedCircularProgressBar from "@/components/ui/animated-progressBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";
import axios, { AxiosRequestConfig } from "axios";
import { Trash } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Default values shown

export default function Home() {
  const [isUploading, setIsUploading] = useState<Boolean>(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [isSubtitleGenerated, setSubtitleGenerated] = useState<boolean>(false);
  const [isSubtitleGenerating, setSubtitleGenerating] =
    useState<boolean>(false);
  const [renderingProgress, setRenderingProgress] = useState<number>(0);
  const [rendering, setRendering] = useState<boolean>(false);
  const [renderVideoUrl, setRenderVideoUrl] = useState<string>("");

  // Allowed video MIME types for validation
  const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

  const uploadConfig: AxiosRequestConfig = {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent: any) => {
      const percentage = (progressEvent.loaded * 100) / progressEvent.total;
      setUploadProgress(+percentage.toFixed(2));
    },
  };
  // const renderConfig: AxiosRequestConfig = {
  //   onUploadProgress: (progressEvent: any) => {
  //     const percentage = (progressEvent.loaded * 100) / progressEvent.total;
  //     setRenderingProgress(+percentage.toFixed(2));
  //   },
  // };

  const renderConfetti = () => {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ["star"],
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ["circle"],
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  };

  const handleUpload = async (selectedFile: File) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("video", selectedFile);

      const response = await axios.post("/api/upload", formData, uploadConfig);
      setVideoPreviewUrl(response.data.filePath);

      if (response.status === 200) {
        setIsUploading(false);
        setUploadProgress(0);
        toast.success("Upload Success");
      } else {
        console.error("Failed to upload video");
      }
    } catch (error) {
      console.error("An error occurred during the upload:", error);
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];

      // Check if the selected file is a valid video format
      if (!allowedVideoTypes.includes(selectedFile.type)) {
        toast.error("Please upload a valid video file");
        return;
      }

      // Set the file and generate the video preview URL

      handleUpload(selectedFile); // Automatically start the upload
    }
  };

  const removeVideo = async (fileName: string) => {
    try {
      const res = await axios.delete("/api/upload", {
        data: { fileName },
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.status === 200) {
        toast.success("Your Video Remove Successfully");
        setVideoPreviewUrl("");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleVideoRender = async (fileName: string) => {
    setRendering(true);
    const refineFileName = fileName
      .replace(/.mp4$/, "")
      .replace(/.mkv$/, "")
      .replace(/.mov$/, "")
      .replace(/.webm$/, "");
    try {
      const res = await axios.post("/api/render", {
        fileName: refineFileName,
        headers: {
          "Content-Type": "application/json",
        },
        // renderConfig,
      });

      if (res.status === 200) {
        renderConfetti();
        setRenderVideoUrl(res.data.url);
        setRenderingProgress(0);
        setRendering(false);
        toast.success("Video Rendered Successfully");
      }
    } catch (error) {
      toast.error("An error occured");
    }
  };
  const handleSubtitle = async (fileName: string) => {
    setSubtitleGenerating(true);
    try {
      const res = await axios.post("/api/generate-subtitle", {
        fileName,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.status === 200) {
        setSubtitleGenerated(true);
        setSubtitleGenerating(false);
        toast.success("Subtitle Generate Successfully");
      }
    } catch (error) {
      toast.error("An error occured");
      setSubtitleGenerating(false);
    }
  };

  return (
    <main className="container py-5">
      <div className="flex justify-end">
        <ModeToggle />
      </div>
      <section className="flex flex-col items-center justify-center gap-10">
        <h1 className="text-4xl font-bold text-center">Subtitle Generator</h1>

        {/* Video Preview Section */}
        <div
          className={`flex justify-between ${
            rendering ? "items-center" : "items-end"
          } gap-10 transition-all duration-150 ease-linear`}
        >
          {videoPreviewUrl ? (
            <div className="mt-4 relative">
              <h2 className="text-xl font-semibold mb-2">Video Preview</h2>
              <video
                controls
                src={`/uploads/${videoPreviewUrl}`}
                className={`w-96 h-96 aspect-video border rounded-md ${
                  isSubtitleGenerating ? "opacity-50" : "opacity-100"
                }`}
              />
              {isSubtitleGenerating && (
                <section className="absolute inset-1/3">
                  <div className="loadingspinner  ">
                    <div id="square1"></div>
                    <div id="square2"></div>
                    <div id="square3"></div>
                    <div id="square4"></div>
                    <div id="square5"></div>
                  </div>
                </section>
              )}
              <Button
                size={"icon"}
                disabled={isSubtitleGenerating}
                variant={"destructive"}
                className={
                  "absolute right-0.5 top-10 h-8 w-8 hover:cursor-pointer "
                }
                onClick={() => removeVideo(videoPreviewUrl)}
              >
                <Trash className="h-6 w-6" />
              </Button>
            </div>
          ) : (
            <div className="relative w-96 h-96 aspect-video border border-dashed rounded-lg">
              <Input
                onChange={handleFileChange}
                id="video"
                type="file"
                className="hidden"
                accept="video/*" // Ensures only video files can be selected
              />
              {!isUploading ? (
                <Label
                  htmlFor="video"
                  className="w-96 h-96 aspect-video flex justify-center items-center cursor-pointer"
                >
                  Upload Video
                </Label>
              ) : (
                <div className="absolute inset-0 top-7 left-28">
                  <AnimatedCircularProgressBar
                    max={100}
                    min={0}
                    value={uploadProgress}
                    gaugePrimaryColor="rgb(79 70 229)"
                    gaugeSecondaryColor="rgb(2, 31, 31)"
                  />
                </div>
              )}
            </div>
          )}
          <div className="">
            {renderVideoUrl && renderingProgress === 0 && (
              <div className="mt-4 relative">
                <h2 className="text-xl font-semibold mb-2">Rendered Video</h2>
                <video
                  controls
                  src={renderVideoUrl}
                  className="w-96 h-96 aspect-video border rounded-md"
                />
              </div>
            )}
            {rendering && (
              <div className="w-96 h-96 flex justify-center items-center">
                <div className="loadingspinner">
                  <div id="square1"></div>
                  <div id="square2"></div>
                  <div id="square3"></div>
                  <div id="square4"></div>
                  <div id="square5"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between gap-10 items-center">
          {videoPreviewUrl && (
            <Button
              className="flex items-center gap-5"
              disabled={isSubtitleGenerating}
              onClick={() => handleSubtitle(videoPreviewUrl)}
            >
              {isSubtitleGenerating
                ? "Generating Subtitle"
                : "Generate Subtitle"}

              {isSubtitleGenerating && (
                <div role="status">
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              )}
            </Button>
          )}
          {isSubtitleGenerated && (
            <Button
              className="flex items-center gap-5"
              onClick={() => handleVideoRender(videoPreviewUrl)}
            >
              {rendering ? "Rendering Video" : "Render Video"}
              {rendering && (
                <div role="status">
                  <svg
                    aria-hidden="true"
                    className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              )}
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
