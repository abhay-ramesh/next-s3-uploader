/**
 * S3 Upload API Route
 *
 * This route uses the s3 instance and createS3Handler from upload.ts
 * which automatically includes the configured provider and settings.
 */

import { createS3Handler, s3 } from "@/lib/upload";
import { z } from "zod";

// Define upload routes with input validation
const s3Router = s3.createRouter({
  // Image uploads with typed input validation
  imageUpload: s3
    .image()
    .max("5MB")
    .formats(["jpeg", "jpg", "png", "webp"])
    .input(
      z.object({
        albumId: z.string().min(1, "Album ID is required"),
        tags: z
          .array(z.string())
          .max(10, "Maximum 10 tags allowed")
          .default([]),
        isPublic: z.boolean().default(false),
        caption: z.string().max(500, "Caption too long").optional(),
      })
    )
    .middleware(async ({ file, metadata, input }) => {
      console.log("Processing image upload:", file.name);
      console.log("Validated input:", input); // Fully typed and validated

      // Add user context (in real app, get from auth)
      return {
        ...metadata,
        ...input, // Spread validated input
        userId: "demo-user",
        uploadedAt: new Date().toISOString(),
        category: "images",
      };
    })
    .paths({
      // Simple: just add "images" folder under global prefix
      // Result: uploads/images/{userId}/{timestamp}/{randomId}/filename.jpg
      prefix: "images",
    })
    .onUploadComplete(async ({ file, url, metadata }) => {
      console.log(`✅ Image upload complete: ${file.name} -> ${url}`, metadata);
    })
    .onUploadError(async ({ file, error }) => {
      console.error(`❌ Image upload failed: ${file.name}`, error);
    }),

  // Document uploads with validation
  documentUpload: s3
    .file()
    .max("10MB")
    .types([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ])
    .input(
      z.object({
        folderId: z.string().uuid("Invalid folder ID"),
        title: z
          .string()
          .min(1, "Title is required")
          .max(100, "Title too long"),
        description: z.string().max(1000, "Description too long").optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .middleware(async ({ file, metadata, input }) => {
      console.log("Processing document upload:", file.name);
      console.log("Document metadata:", input);

      return {
        ...metadata,
        ...input,
        userId: "demo-user",
        category: "documents",
        uploadedAt: new Date().toISOString(),
      };
    })
    .paths({
      prefix: "documents",
    })
    .onUploadComplete(async ({ file, url, metadata }) => {
      console.log(
        `✅ Document upload complete: ${file.name} -> ${url}`,
        metadata
      );
    }),

  // General uploads: uploads/{userId}/{timestamp}/{randomId}/filename.ext
  // Uses pure global configuration - no route-level paths or input validation
  generalUpload: s3
    .file()
    .max("20MB")
    .middleware(async ({ file, metadata }) => {
      return {
        ...metadata,
        userId: "demo-user",
        category: "general",
      };
    })
    // No .input() or .paths() - uses global configuration only
    .onUploadComplete(async ({ file, url, metadata }) => {
      console.log(`✅ General file uploaded: ${file.name} -> ${url}`);
    }),
});

// Export router type for client-side usage
export type AppS3Router = typeof s3Router;

// Export the HTTP handlers
const handlers = createS3Handler(s3Router);
export const { GET, POST } = handlers;

/*
// Example of how .input() would work when implemented:

const s3Router = s3.createRouter({
  imageUpload: s3
    .image()
    .max("5MB")
    .formats(["jpeg", "jpg", "png", "webp"])
    .input(z.object({
      albumId: z.string().min(1, "Album ID is required"),
      tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").default([]),
      isPublic: z.boolean().default(false),
      caption: z.string().max(500, "Caption too long").optional(),
    }))
    .middleware(async ({ file, metadata, input }) => {
      // input is now fully typed and validated
      console.log("Album ID:", input.albumId); // ✅ Type-safe
      console.log("Tags:", input.tags);         // ✅ Type-safe
      
      return {
        ...metadata,
        ...input,
        userId: "demo-user",
      };
    }),
});

// Client usage would be:
await uploadFiles({
  route: 'imageUpload',
  files: selectedFiles,
  input: {
    albumId: "vacation-2024",
    tags: ["beach", "sunset"],
    isPublic: true,
    caption: "Beautiful sunset at the beach"
  }
});
*/
