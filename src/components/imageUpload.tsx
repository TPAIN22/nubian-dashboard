"use client";
import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { useEffect, useRef, useState } from "react";
import {
  Upload,
  X,
  Check,
  AlertCircle,
  File,
  Image,
  Trash2,
  Plus,
} from "lucide-react";
// set from react-hook-form is not used, so it can be removed.
// import { set } from "react-hook-form";

// --- Interfaces for type safety ---

// Props for the ImageUpload component
interface ImageUploadProps {
  onUploadComplete?: (urls: string[]) => void;
}

// Represents a file selected by the user
interface SelectedFile {
  id: number;
  file: File;
  name: string;
  size: number;
  type: string;
}

// Status of an individual file upload
type UploadStatus = "idle" | "uploading" | "success" | "error";

// Authentication parameters from the backend
interface AuthParams {
  signature: string;
  expire: number;
  token: string;
  publicKey: string;
}

// --- ImageUpload Component ---

export function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>(
    {}
  );
  const [uploadStatus, setUploadStatus] = useState<
    Record<number, UploadStatus>
  >({});
  const [errorMessages, setErrorMessages] = useState<Record<number, string>>(
    {}
  );
  const [uploadedUrls, setUploadedUrls] = useState<Record<number, string>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const authenticator = async (): Promise<AuthParams> => {
    try {
      const response = await fetch("/api/upload-auth");
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`
        );
      }

      const data: AuthParams = await response.json();
      const { signature, expire, token, publicKey } = data;
      return { signature, expire, token, publicKey };
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Authentication request failed");
    }
  };

  const generateFileId = (): number => Date.now() + Math.random();

  const handleFilesSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    const newFiles: SelectedFile[] = fileArray.map((file) => ({
      id: generateFileId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);

    // Initialize status for new files
    const newStatus: Record<number, UploadStatus> = {};
    const newProgress: Record<number, number> = {};
    newFiles.forEach((f) => {
      newStatus[f.id] = "idle";
      newProgress[f.id] = 0;
    });

    setUploadStatus((prev) => ({ ...prev, ...newStatus }));
    setUploadProgress((prev) => ({ ...prev, ...newProgress }));
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelect(files);
    }
    // Reset input value to allow selecting same files again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const uploadSingleFile = async (fileObj: SelectedFile) => {
    const { id, file } = fileObj;

    setUploadStatus((prev) => ({ ...prev, [id]: "uploading" }));
    setUploadProgress((prev) => ({ ...prev, [id]: 0 }));
    setErrorMessages((prev) => ({ ...prev, [id]: "" }));

    try {
      const authParams = await authenticator();
      const { signature, expire, token, publicKey } = authParams;

      const abortController = new AbortController();

      const uploadResponse = await upload({
        expire,
        token,
        signature,
        publicKey,
        file,
        fileName: file.name,
        onProgress: (event) => {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress((prev) => ({ ...prev, [id]: progress }));
        },
        abortSignal: abortController.signal,
      });

      setUploadStatus((prev) => ({ ...prev, [id]: "success" }));
      setUploadedUrls((prev) =>
        Object.assign({}, prev, { [id]: uploadResponse.url })
      );
    } catch (error: any) {
      // Explicitly type error as 'any' or a more specific type if known
      setUploadStatus((prev) => ({ ...prev, [id]: "error" }));

      let errorMessage = "";
      if (error instanceof ImageKitAbortError) {
        errorMessage = "Upload was cancelled";
      } else if (error instanceof ImageKitInvalidRequestError) {
        errorMessage = "Invalid request: " + error.message;
      } else if (error instanceof ImageKitUploadNetworkError) {
        errorMessage = "Network error: " + error.message;
      } else if (error instanceof ImageKitServerError) {
        errorMessage = "Server error: " + error.message;
      } else {
        errorMessage = "Upload failed: " + (error.message || "Unknown error");
      }

      setErrorMessages((prev) => ({ ...prev, [id]: errorMessage }));
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = selectedFiles.filter(
      (f) => uploadStatus[f.id] === "idle" || uploadStatus[f.id] === "error"
    );

    // Upload files in parallel
    const uploadPromises = pendingFiles.map((fileObj) =>
      uploadSingleFile(fileObj)
    );
    await Promise.all(uploadPromises);
  };

  const removeFile = (fileId: number) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setUploadStatus((prev) => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setErrorMessages((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fileId];
      return newErrors;
    });
    setUploadedUrls((prev) => {
      const newUrls = { ...prev };
      delete newUrls[fileId];
      return newUrls;
    });
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setUploadStatus({});
    setUploadProgress({});
    setErrorMessages({});
    setUploadedUrls({});
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImage = (file: File): boolean => {
    return file && file.type.startsWith("image/");
  };

  const getOverallStats = () => {
    const total = selectedFiles.length;
    const completed = Object.values(uploadStatus).filter(
      (status) => status === "success"
    ).length;
    const failed = Object.values(uploadStatus).filter(
      (status) => status === "error"
    ).length;
    const uploading = Object.values(uploadStatus).filter(
      (status) => status === "uploading"
    ).length;
    const pending = total - completed - failed - uploading;

    return { total, completed, failed, uploading, pending };
  };

  useEffect(() => {
    const urlsArray: string[] = Object.values(uploadedUrls);
    setImageUrls(urlsArray);
    onUploadComplete?.(urlsArray); // نمررها للي استدعى الكمبوننت
  }, [uploadedUrls, onUploadComplete]); // Add onUploadComplete to dependency array

  const stats = getOverallStats();

  return (
    <div className="max-w-2xl mx-auto p-4  rounded-xl shadow-lg">
      {/* Drag and Drop Area */}
      <div
        className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                    ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : selectedFiles.length > 0
                        ? "border-[#838282] "
                        : "border-gray-300  hover:border-gray-400"
                    }
                `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />

        <div className="cursor-pointer">
          <Upload className="mx-auto size-8 text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 mb-2">
            {isDragging ? "افلت الملفات هنا" : "اسحب وافلت الملفات هنا"}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            او اضغط لرفع ملف (يدعم اختيار عدة ملفات)
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-[#fff] text-[#1c1b1b] rounded-lg hover:bg-[#838282] transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            Add Files
          </div>
        </div>
      </div>

      {/* Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-4">
          {/* Stats Bar */}
          <div className=" p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#fff]">
                {stats.total} files selected
              </span>
              <button
                onClick={clearAllFiles}
                className="text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>
            <div className="flex space-x-4 text-xs text-gray-600">
              {stats.completed > 0 && (
                <span className="text-green-600">
                  ✓ {stats.completed} completed
                </span>
              )}
              {stats.uploading > 0 && (
                <span className="text-[#fff]">
                  ↑ {stats.uploading} uploading
                </span>
              )}
              {stats.failed > 0 && (
                <span className="text-red-600">✗ {stats.failed} فشل</span>
              )}
              {stats.pending > 0 && (
                <span className="text-gray-500">○ {stats.pending} جاري التحميل</span>
              )}
            </div>
          </div>

          {/* Files */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {selectedFiles.map((fileObj) => (
              <div
                key={fileObj.id}
                className=" border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {isImage(fileObj.file) ? (
                      <Image className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    ) : (
                      <File className="h-6 w-6 text-gray-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {fileObj.name}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{formatFileSize(fileObj.size)}</span>
                        {uploadStatus[fileObj.id] === "success" && (
                          <span className="text-green-600 flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            Uploaded
                          </span>
                        )}
                        {uploadStatus[fileObj.id] === "uploading" && (
                          <span className="text-blue-600">
                            {Math.round(uploadProgress[fileObj.id] || 0)}%
                          </span>
                        )}
                        {uploadStatus[fileObj.id] === "error" && (
                          <span className="text-red-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-2"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>

                {/* Progress Bar */}
                {uploadStatus[fileObj.id] === "uploading" && (
                  <div className="w-full  rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[fileObj.id] || 0}%` }}
                    />
                  </div>
                )}

                {/* Error Message */}
                {uploadStatus[fileObj.id] === "error" &&
                  errorMessages[fileObj.id] && (
                    <p className="text-sm text-red-600 mt-2">
                      {errorMessages[fileObj.id]}
                    </p>
                  )}

                {/* Success Link */}
                {uploadStatus[fileObj.id] === "success" &&
                  uploadedUrls[fileObj.id] && (
                    <a
                      href={uploadedUrls[fileObj.id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 hover:text-green-800 underline mt-2 block"
                    >
                      View uploaded file
                    </a>
                  )}
              </div>
            ))}
          </div>

          {/* Upload All Button */}
          {stats.pending > 0 || stats.failed > 0 ? (
            <div className="flex space-x-3">
              <button
                onClick={handleUploadAll}
                disabled={stats.uploading > 0}
                className="flex-1 bg-[#fff] text-black py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {stats.uploading > 0
                  ? `Uploading ${stats.uploading} files...`
                  : stats.failed > 0
                  ? `Retry Failed & Upload Pending (${
                      stats.pending + stats.failed
                    })`
                  : `Upload All Files (${stats.pending})`}
              </button>
            </div>
          ) : (
            stats.completed === stats.total &&
            stats.total > 0 && (
              <div className="text-center p-4  border border-[#fff] rounded-lg">
                <Check className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-green-800 font-medium">
                  All files uploaded successfully!
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
