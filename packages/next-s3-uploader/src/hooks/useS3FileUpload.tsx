"use client";

import { useState } from "react";

type UploadOptions = {
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
};

type PresignedUrlResponse = {
  key: string;
  presignedPutUrl: string;
  s3ObjectUrl: string;
};

type UploadedFile = {
  key: string;
  status: "uploading" | "success" | "error";
  progress: number;
  url: string;
  timeLeft?: string;
};

export const useS3FileUpload = (options: UploadOptions = {}) => {
  const { maxFiles, maxFileSize, multiple } = options;
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const uploadFiles = async (
    files: FileList | File[],
    customKeys?: string[],
    apiEndpoint: string = "/api/s3upload"
  ) => {
    if (!multiple && files.length > 1) {
      console.error("Only one file can be uploaded.");
      return;
    }

    if (maxFiles && files.length > maxFiles) {
      console.error(`Exceeded maximum allowed files. Limit is ${maxFiles}.`);
      return;
    }

    if (maxFileSize) {
      for (const file of Array.from(files)) {
        if (file.size > maxFileSize) {
          console.error(
            `File ${file.name} exceeds the maximum file size of ${maxFileSize} bytes.`
          );
          return;
        }
      }
    }

    if (files.length === 0) {
      console.error("No files to upload.");
      return;
    }

    if (customKeys && customKeys.length !== files.length) {
      console.error(
        "Number of custom keys must match number of files to upload."
      );
      return;
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        body: JSON.stringify({
          keys: customKeys || Array.from(files).map((file) => file.name),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data: PresignedUrlResponse[] = await response.json();
        const promises = data.map(async (presignedUrl, index) => {
          const file = files[index];
          const uploadedFile: UploadedFile = {
            key: presignedUrl.key,
            status: "uploading",
            progress: 0,
            url: presignedUrl.s3ObjectUrl,
          };

          setUploadedFiles((prevFiles) => [...prevFiles, uploadedFile]);

          const getTimeLeft = (progress: number, elapsedTime: number) => {
            if (progress === 0) {
              return "Calculating...";
            }

            const remainingPercentage = 100 - progress;
            const estimatedTotalTime =
              (elapsedTime / progress) * remainingPercentage;
            const minutes = Math.floor(estimatedTotalTime / 60);
            const seconds = Math.round(estimatedTotalTime % 60);

            return `${minutes}m ${seconds}s`;
          };

          const startTime = new Date().getTime();

          const xhr = new XMLHttpRequest();
          xhr.open("PUT", presignedUrl.presignedPutUrl);

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              uploadedFile.progress = Math.round((e.loaded / e.total) * 100);

              const currentTime = new Date().getTime();
              const elapsedTime = (currentTime - startTime) / 1000; // in seconds

              uploadedFile.timeLeft = getTimeLeft(
                uploadedFile.progress,
                elapsedTime
              );

              setUploadedFiles((prevFiles) => [...prevFiles]);
            }
          });

          xhr.onload = () => {
            if (xhr.status === 200) {
              uploadedFile.status = "success";
            } else {
              uploadedFile.status = "error";
              console.error(`Failed to upload file ${file.name}.`);
            }
            setUploadedFiles((prevFiles) => [...prevFiles]);
          };

          xhr.onerror = () => {
            uploadedFile.status = "error";
            console.error(`Error uploading file ${file.name}.`);
            setUploadedFiles((prevFiles) => [...prevFiles]);
          };

          xhr.send(file);
        });

        await Promise.all(promises);
      } else {
        console.error("Failed to get presigned URLs.");
      }
    } catch (error) {
      console.error("Error getting presigned URLs:", error);
    }
  };

  return { uploadedFiles, uploadFiles };
};
