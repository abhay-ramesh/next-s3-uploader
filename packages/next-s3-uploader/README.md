# Next.js S3 Uploader

![npm](https://img.shields.io/npm/dm/next-s3-uploader)
![npm](https://img.shields.io/npm/v/next-s3-uploader)
![GitHub](https://img.shields.io/github/license/abhay-ramesh/next-s3-uploader)
![example workflow](https://github.com/abhay-ramesh/next-s3-uploader/actions/workflows/release.yml/badge.svg)
<!-- ![GitHub last commit](https://img.shields.io/github/last-commit/abhay-ramesh/next-s3-uploader) -->
<!-- ![GitHub stars](https://img.shields.io/github/stars/abhay-ramesh/next-s3-uploader) -->

**Next S3 Uploader** is a utility package for handling file uploads to Amazon S3 or compatible services like MinIO in a Next.js application. It simplifies the process of integrating secure and scalable cloud storage for your Next.js projects.

## Features

- **Easy Integration**: Seamlessly integrate file upload functionality into your Next.js applications.
- **Custom Hook**: Provides a custom hook, `useS3FileUpload`, to manage file uploads and track progress.
- **Pre-Signed URLs**: Generates pre-signed URLs for secure file uploads directly to Amazon S3 or compatible services.
- **Estimate Time Left**: Calculates and displays estimated time left for ongoing file uploads.
- **Configurable**: Supports flexible configuration for both S3 and MinIO services.

> **Warning**: This package is currently in beta and is not recommended for production use and currently only supports uploading files to public buckets.

## Installation

Install the package using your preferred package manager:

```bash
# Using npm
npm install next-s3-uploader
```

```bash
# Using yarn
yarn add next-s3-uploader
```

```bash
# Using pnpm
pnpm add next-s3-uploader
```

## Full Documentation

For full documentation, please visit [next-s3-uploader.abhayramesh.com](https://next-s3-uploader.abhayramesh.com/).
