import { shopApi } from "./api";
import { compressImage } from "./compressImage";

interface ImageKitAuthParams {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint?: string;
}

function pickAuthParams(payload: any): ImageKitAuthParams | null {
  const candidates: any[] = [];

  if (payload && typeof payload === "object") candidates.push(payload);
  if (payload?.data && typeof payload.data === "object") candidates.push(payload.data);
  if (payload?.auth && typeof payload.auth === "object") candidates.push(payload.auth);

  for (const c of candidates) {
    if (
      typeof c?.token === "string" &&
      typeof c?.signature === "string" &&
      typeof c?.publicKey === "string"
    ) {
      return {
        token: c.token,
        signature: c.signature,
        publicKey: c.publicKey,
        expire: c.expire,
        urlEndpoint: c.urlEndpoint,
      };
    }
  }
  return null;
}

export const uploadImageToImageKit = async (file: File): Promise<string> => {
  // 1. Compress image before upload (converts to WebP, resizes if >1920px)
  const compressionResult = await compressImage(file);
  const compressedFile = compressionResult.file;

  if (compressionResult.wasCompressed) {
    console.log(
      `ImageKit: Image compressed - ` +
      `${(compressionResult.originalSize / 1024).toFixed(1)}KB → ` +
      `${(compressionResult.newSize / 1024).toFixed(1)}KB ` +
      `(${(compressionResult.compressionRatio * 100).toFixed(0)}%)`
    );
  }

  // 2. Get Auth
  const authResponse = await shopApi.getImageKitAuth();
  const authParams = pickAuthParams(authResponse);

  if (!authParams) {
    throw new Error("Failed to get ImageKit upload parameters");
  }

  // 3. Prepare Form Data with compressed file
  const formData = new FormData();
  formData.append("file", compressedFile);
  formData.append("fileName", compressedFile.name);
  formData.append("publicKey", authParams.publicKey);
  formData.append("signature", authParams.signature);
  formData.append("expire", String(authParams.expire));
  formData.append("token", authParams.token);
  formData.append("folder", "/payment-proofs/");
  formData.append("useUniqueFileName", "true");

  // 4. Upload
  const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(err.message || "Upload failed");
  }

  const json = await uploadRes.json();
  return json.url || json.filePath;
};

