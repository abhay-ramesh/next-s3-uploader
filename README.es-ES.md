

# Next.js S3 Uploader

![Next.js S3 File Uploader](Next.js-S3-Uploader.png)

![npm](https://img.shields.io/npm/dm/next-s3-uploader)
![npm](https://img.shields.io/npm/v/next-s3-uploader)
![GitHub](https://img.shields.io/github/license/abhay-ramesh/next-s3-uploader)
![example workflow](https://github.com/abhay-ramesh/next-s3-uploader/actions/workflows/release.yml/badge.svg)
<!-- ![GitHub last commit](https://img.shields.io/github/last-commit/abhay-ramesh/next-s3-uploader) -->
<!-- ![GitHub stars](https://img.shields.io/github/stars/abhay-ramesh/next-s3-uploader) -->

**Next S3 Uploader** es un paquete de utilidades para manejar cargas de archivos a Amazon S3 o servicios compatibles como MinIO en una aplicación Next.js. Simplifica el proceso de integrar almacenamiento en la nube seguro y escalable para tus proyectos de Next.js.

## Características

- **Integración sencilla**: Integra sin problemas la funcionalidad de carga de archivos en tus aplicaciones Next.js.
- **Hook personalizado**: Proporciona un hook personalizado, `useS3FileUpload`, para gestionar las cargas de archivos y seguir el progreso.
- **URLs con firma previa**: Genera URLs con firma previa para cargas de archivos seguras directamente en Amazon S3 o servicios compatibles.
- **Tiempo restante estimado**: Calcula y muestra el tiempo estimado restante para las cargas de archivos en curso.
- **Configurable**: Soporta una configuración flexible para los servicios S3 y MinIO.

> **Advertencia**: Este paquete se encuentra actualmente en versión beta y no se recomienda para entornos de producción; además, por el momento solo soporta la carga de archivos a buckets públicos.

## Instalación

Instala el paquete utilizando tu gestor de paquetes preferido:

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

## Uso

### Requisitos previos

Servicio AWS S3 o compatible (MinIO, etc.) con un bucket `public`. Debe configurarse con la siguiente política:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::your-bucket-name/*"]
    }
  ]
}
```

--- O ---

Servicio AWS S3 o compatible (MinIO, etc.) con un bucket `private`. Debe configurarse con la siguiente política:

En la función `generatePresignedUrls`, establece `privateBucket` en `true`.

### Frontend (Directorio de Aplicación Next.js)

Importa el hook `useS3FileUpload` y úsalo en tu componente de Next.js:

```jsx
"use client";

import { useS3FileUpload } from "next-s3-uploader";

function UploadPage() {
  const { uploadedFiles, uploadFiles } = useS3FileUpload({
    multiple: true, // Allow multiple flie uploads (optional)
    maxFiles: 10, // 10 files limit (optional)
    maxFileSize: 10 * 1024 * 1024, // 10MB limit (optional)
  });

  const handleFileChange = async (e) => {
    // Get selected files from input and check if length > 0 then upload files to S3
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
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
      {/* Display uploaded files and progress */}
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
```

### Rutas de API

Utiliza las funciones `createS3Client` y `generatePresignedUrls` para crear una ruta de API que maneje las URLs con firma previa:

```javascript
import { createS3Client, generatePresignedUrls } from "next-s3-uploader";

export async function POST(req) {
  try {
    const { keys } = await req.json();

    // Configure S3 client
    const s3Client = createS3Client({
      provider: "minio", // Store in .env
      endpoint: "http://localhost:9000/", // Store in .env
      region: "ap-south-1", // Store in .env
      forcePathStyle: true, // Store in .env
      credentials: {
        accessKeyId: "ROOTNAME", // Store in .env
        secretAccessKey: "CHANGEME123", // Store in .env
      },
    });

    // Generate pre-signed URLs
    const bucket = "your-bucket-name";
    const prefix = `userId/images/`;
    const urls = await generatePresignedUrls(s3Client, keys, bucket, prefix);

    return new Response(JSON.stringify(urls), { status: 200 });
  } catch (error) {
    console.error("Error processing the request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

## API

El paquete proporciona las siguientes funciones:

### Opciones del Hook `useS3FileUpload`

El hook `useS3FileUpload` acepta un objeto de opciones que permite personalizar el comportamiento de la carga de archivos. Las opciones disponibles incluyen:

- `multiple` (booleano, opcional): Permite cargar varios archivos a la vez. El valor predeterminado es `false`.

- `maxFiles` (número, opcional): Establece el número máximo de archivos que se pueden cargar.

- `maxFileSize` (número, opcional): Especifica el tamaño máximo permitido de los archivos para la carga.

#### Opciones de la Función `uploadFiles`

La función `uploadFiles` inicia la carga de archivos a Amazon S3 y admite personalización:

- `files` (requerido): Matriz de objetos `File` que se cargarán.

- `customKeys` (opcional): Matriz de claves personalizadas correspondientes a los archivos cargados.

- `endpoint` (opcional): Endpoint de la API para generar URLs con firma previa. El valor predeterminado es `/api/s3upload`.

- `requestOptions` (opcional): Opciones adicionales para pasar a la función `fetch`.

#### Propiedades de la Matriz `uploadedFiles`

La matriz `uploadedFiles` contiene información sobre cada archivo cargado:

- `key` (cadena): Clave única o nombre de archivo para el archivo cargado.

- `status` (cadena): Estado de la carga (`'uploading'`, `'success'`, `'error'`).

- `progress` (número): Porcentaje de progreso de la carga (0 a 100).

- `url` (cadena): URL para acceder al archivo cargado en Amazon S3.

- `timeLeft` (cadena): Estimación del tiempo restante para completar la carga.

#### Función `reset`

La función `reset` restablece la matriz `uploadedFiles` a su estado inicial. (Establece `uploadedFiles` en una matriz vacía.)

---

### `createS3Client(config)`

Esta función crea una instancia de un cliente S3.

- `config`: Un objeto que contiene opciones de configuración de S3. Las propiedades disponibles son:
  - `provider` (cadena): El proveedor de almacenamiento en la nube a utilizar (`"s3"` para Amazon S3, `"minio"` para MinIO o `"other"` para otros servicios compatibles con S3).
  - `endpoint` (cadena, opcional): La URL del endpoint del servicio de almacenamiento en la nube. Requerido\* para MinIO u otros servicios compatibles con S3.
  - `region` (cadena): La región de AWS o MinIO a utilizar.
  - `forcePathStyle` (booleano, opcional): Indica si se debe utilizar direccionamiento por ruta para el acceso a buckets de S3. Solo es requerido para MinIO u otros servicios compatibles con S3.
  - `credentials` (objeto): Un objeto que contiene las credenciales de acceso de AWS.
    - `accessKeyId` (cadena): El ID de la clave de acceso.
    - `secretAccessKey` (cadena): La clave de acceso secreta.

### `generatePresignedUrls(s3Client, keys, bucket, prefix?, privateBucket?)`

Genera URLs con firma previa para cargar objetos en S3.

- `s3Client`: Una instancia del cliente S3.
- `keys`: Una matriz de claves de objetos a cargar.
- `bucket`: El nombre del bucket de S3.
- `prefix`: (Opcional) Prefijo para las claves de los objetos.
- `privateBucket`: (Opcional) Indica si el bucket es privado. El valor predeterminado es `false`.

## Ejemplos de Uso

### Permitir Carga Múltiple de Archivos

```jsx
const { uploadedFiles, uploadFiles } = useS3FileUpload({
  multiple: true,
});
```

### Limitar el Número de Archivos Cargados

```jsx
const { uploadedFiles, uploadFiles } = useS3FileUpload({
  multiple: true,
  maxFiles: 3,
});
```

### Establecer Tamaño Máximo de Archivo

```jsx
const { uploadedFiles, uploadFiles } = useS3FileUpload({
  maxFileSize: 5242880, // 5MB limit
});
```

### Claves Personalizadas

```jsx
const { uploadedFiles, uploadFiles } = useS3FileUpload();

const handleFileChange = async (e) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    const customKeys = ["file1.jpg", "images/file2.jpg", "docs/file3.pdf"];
    await uploadFiles(files, customKeys);
  }
};
```

### Endpoint de API Personalizado

```jsx
const { uploadedFiles, uploadFiles } = useS3FileUpload();

const handleFileChange = async (e) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    await uploadFiles(files, null, "/api/custom-upload-route");
  }
};
```

### Cliente AWS S3

```javascript
const s3Client = createS3Client({
  provider: "s3", // Amazon S3 provider
  region: "us-east-1", // Specify the appropriate AWS region
  credentials: {
    accessKeyId: "YOUR_ACCESS_KEY_ID", // Your AWS access key ID
    secretAccessKey: "YOUR_SECRET_ACCESS_KEY", // Your AWS secret access key
  },
});
```

### Cliente Compatible con S3 No-AWS (MinIO/No-AWS)

```javascript
const s3Client = createS3Client({
  provider: "minio", // Non-AWS S3 provider (minio/other)
  endpoint: "http://localhost:9000", // Specify the appropriate endpoint
  region: "us-east-1", // Specify the appropriate region
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: "ROOTNAME", // Your access key
    secretAccessKey: "CHANGEME123", // Your secret key
  },
});
```

¡Claro! Aquí tienes algunos escenarios de uso diferentes para el paquete `next-s3-uploader`:

### Carga Básica de Archivos

Este es el caso de uso más sencillo donde deseas permitir que los usuarios carguen archivos a tu aplicación.

```javascript
// Your API Route
import { createS3Client, generatePresignedUrls } from "next-s3-uploader";

export async function POST(req: Request) {
    const { keys } = await req.json();
    const bucket = "linkjs";

    const s3Client = createS3Client({
      provider: "aws",
      region: "ap-south-1",
      credentials: {
        accessKeyId: "YOUR_ACCESS_KEY_ID",
        secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
      },
    });

    const urls = await generatePresignedUrls(s3Client, keys, bucket);

    return new Response(JSON.stringify(urls), { status: 200 });
}
```

### Carga Autenticada

En este escenario, es posible que requieras que los usuarios estén autenticados antes de poder cargar archivos.

```javascript
// Your API Route (with authentication check)
import { createS3Client, generatePresignedUrls } from "next-s3-uploader";

export async function POST(req: Request) {
    // Check user authentication here
    if (!authenticatedUser) {
    return new Response("Unauthorized", { status: 401 });
    }

    const { keys } = await req.json();
    const bucket = "linkjs";
    const userId = req.user.id;
    const prefix = `${userId}/images/`;

    const s3Client = createS3Client({
      provider: "aws",
      region: "ap-south-1",
      credentials: {
        accessKeyId: "YOUR_ACCESS_KEY_ID",
        secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
      },
    });

    const urls = await generatePresignedUrls(s3Client, keys, bucket, prefix);

    return new Response(JSON.stringify(urls), { status: 200 });
}
```

### Carga Específica por Proyecto

En este caso, es posible que desees organizar los archivos cargados en diferentes proyectos o carpetas.

```javascript
// Your API Route (with project-specific prefix)
import { createS3Client, generatePresignedUrls } from "next-s3-uploader";

export async function POST(req: Request) {
    const { keys, projectId } = await req.json();
    const bucket = "linkjs";
    const prefix = `projects/${projectId}/images/`;

    const s3Client = createS3Client({
      provider: "aws",
      region: "ap-south-1",
      credentials: {
        accessKeyId: "YOUR_ACCESS_KEY_ID",
        secretAccessKey: "YOUR_SECRET_ACCESS_KEY",
      },
    });

    const urls = await generatePresignedUrls(s3Client, keys, bucket, prefix);

    return new Response(JSON.stringify(urls), { status: 200 });
}
```

### Almacenamiento de Archivos por Organización/Empresa

Si estás desarrollando una aplicación para una organización o empresa, es posible que desees organizar los archivos por departamentos.

```javascript
// Your API Route (with organization-specific prefix)
import { createS3Client, generatePresignedUrls } from "next-s3-uploader";

export async function POST(req: Request) {
    const { keys, organizationId, departmentId } = await req.json();
    const bucket = "linkjs";
    const prefix = `orgs/${organizationId}/depts/${departmentId}/files/`;

    const s3Client = createS3Client({
    provider: "minio",
    endpoint: "http://localhost:9000/",
    region: "ap-south-1",
    forcePathStyle: true,
    credentials: {
        accessKeyId: "ROOTNAME",
        secretAccessKey: "CHANGEME123",
    },
    });

    const urls = await generatePresignedUrls(s3Client, keys, bucket, prefix);

    return new Response(JSON.stringify(urls), { status: 200 });
}
```

## Contribuir

¡Las contribuciones son bienvenidas! Por favor, envía issues y pull requests.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles.

---
