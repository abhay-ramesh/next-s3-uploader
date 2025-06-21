# Input Validation with .input() Method - FULLY TYPED! ✅

This example shows how the new `.input()` method works with Zod validation for **fully type-safe** metadata input.

## ✅ What's Working Now

1. **Server-side**: Routes accept `.input(zodSchema)` for validation
2. **Client-side**: `uploadFiles(files, input)` is fully typed based on route schema
3. **Type Safety**: TypeScript will error if you pass wrong input shape
4. **Runtime Validation**: Zod validates input on server before upload

## Basic Usage with Full Type Safety

```typescript
import { z } from "zod";
import { useUploadRoute } from "pushduck";

// Define router with input validation
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
      // input is now fully typed and validated ✅
      console.log("Album ID:", input.albumId);  // string
      console.log("Tags:", input.tags);         // string[]
      console.log("Public:", input.isPublic);   // boolean
      
      return {
        ...metadata,
        ...input, // Spread validated input
        userId: "demo-user",
      };
    }),
});

// Client usage with full type safety
function MyComponent() {
  const { uploadFiles } = useUploadRoute<typeof s3Router, 'imageUpload'>('imageUpload');
  
  const handleUpload = async (files: File[]) => {
    // TypeScript will enforce the correct input shape! ✅
    await uploadFiles(files, {
      albumId: "vacation-2024",     // ✅ Required string
      tags: ["beach", "sunset"],    // ✅ String array
      isPublic: true,              // ✅ Boolean
      caption: "Beautiful sunset", // ✅ Optional string
      // location: "invalid"       // ❌ TypeScript error - wrong type!
    });
  };
}
```

## Type Inference Examples

```typescript
// ✅ Fully typed based on route schema
const { uploadFiles } = useUploadRoute<typeof s3Router, 'imageUpload'>('imageUpload');

// uploadFiles signature is now:
// (files: File[], input?: {
//   albumId: string;
//   tags: string[];
//   isPublic: boolean;
//   caption?: string;
// }) => Promise<void>

// ✅ This works - correct types
await uploadFiles(selectedFiles, {
  albumId: "my-album",
  tags: ["vacation"],
  isPublic: false,
});

// ❌ TypeScript errors - wrong types
await uploadFiles(selectedFiles, {
  albumId: 123,           // Error: number not assignable to string
  tags: "not-array",      // Error: string not assignable to string[]
  isPublic: "yes",        // Error: string not assignable to boolean
  invalidField: "test",   // Error: object literal may only specify known properties
});
```

## Complex Nested Validation with Types

```typescript
const galleryUpload = s3
  .image()
  .max("5MB")
  .input(z.object({
    gallery: z.object({
      id: z.string().uuid("Invalid gallery ID"),
      name: z.string().min(1, "Gallery name required"),
      theme: z.enum(["light", "dark", "auto"]).default("auto"),
    }),
    image: z.object({
      title: z.string().min(1).max(200),
      description: z.string().max(1000).optional(),
      tags: z.array(z.string()).max(20),
      featured: z.boolean().default(false),
    }),
  }))
  .middleware(async ({ file, metadata, input }) => {
    // All nested properties are typed and validated
    console.log("Gallery:", input.gallery.name);     // string
    console.log("Image title:", input.image.title);  // string
    console.log("Theme:", input.gallery.theme);      // "light" | "dark" | "auto"
    
    return { ...metadata, ...input, userId: "demo-user" };
  });

// Client usage with full nested typing
const { uploadFiles } = useUploadRoute<typeof s3Router, 'galleryUpload'>('galleryUpload');

await uploadFiles(files, {
  gallery: {
    id: "550e8400-e29b-41d4-a716-446655440000", // ✅ Valid UUID
    name: "Summer Vacation",                     // ✅ Required string
    theme: "light"                              // ✅ Enum value
  },
  image: {
    title: "Beach Sunset",                      // ✅ Required string
    description: "A beautiful sunset",         // ✅ Optional string
    tags: ["sunset", "beach", "vacation"],     // ✅ String array
    featured: true                             // ✅ Boolean with default
  }
});
```

## Runtime Validation Errors

```typescript
// This will throw a validation error at runtime:
try {
  await uploadFiles(files, {
    albumId: "",                    // ❌ Empty string fails min(1) validation
    tags: Array(20).fill("tag"),    // ❌ Too many tags (max 10)
    isPublic: "yes" as any,         // ❌ String instead of boolean
  });
} catch (error) {
  console.error(error.message);
  // "Input validation failed: albumId must be at least 1 character long"
}
```

## Benefits

1. **✅ Full Type Safety**: TypeScript enforces correct input shape
2. **✅ Runtime Validation**: Zod validates data at runtime  
3. **✅ Auto-completion**: IDE provides full auto-completion
4. **✅ Error Prevention**: Catch type errors at compile time
5. **✅ Documentation**: Types serve as living documentation
6. **✅ Refactoring Safety**: Changes to schema update all usage sites

## Implementation Status

- ✅ `.input()` method on schema classes
- ✅ Router input validation with Zod
- ✅ Typed `uploadFiles` function with input inference
- ✅ Full TypeScript support with proper type inference
- ✅ Runtime validation with clear error messages
- ✅ Client-server type safety end-to-end

**The feature is complete and ready to use!** 🎉
