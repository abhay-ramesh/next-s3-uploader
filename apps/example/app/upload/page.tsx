"use client";

import React from "react";
import { useS3FileUpload } from "next-s3-uploader";

function UploadPage() {
  const { uploadedFiles, uploadFiles } = useS3FileUpload({
    multiple: true,
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB limit
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFiles(files, undefined);
    }
  };

  return (
    <div>
      <h1>File Upload to Amazon S3</h1>
      <input
        title="Upload File"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
      <div>
        {uploadedFiles.map((file, index) => (
          <div key={index}>
            <p>File Key: {file.key}</p>
            <p>Status: {file.status}</p>
            <p>Progress: {file.progress}%</p>
            <p>Time Left: {file.timeLeft || "Calculating..."}</p>
            {file.status === "success" && (
              <img src={file.url} alt={`Uploaded File ${index}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default UploadPage;
