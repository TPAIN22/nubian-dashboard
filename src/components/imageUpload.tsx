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
  initialUrls?: string[];
}

// Represents a file selected by the user
interface SelectedFile {
  id: string | number;
  file?: File;
  name: string;
  size?: number;
  type?: string;
  isExisting?: boolean;
  url?: string;
}

// Status of an individual file upload
type UploadStatus = "idle" | "uploading" | "success" | "error" | "existing";

// Authentication parameters from the backend
interface AuthParams {
  signature: string;
  expire: number;
  token: string;
  publicKey: string;
  urlEndpoint?: string;
}

// --- ImageUpload Component ---

export function ImageUpload({ onUploadComplete, initialUrls = [] }: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string | number, number>>(
    {}
  );
  const [uploadStatus, setUploadStatus] = useState<
    Record<string | number, UploadStatus>
  >({});
  const [errorMessages, setErrorMessages] = useState<Record<string | number, string>>(
    {}
  );
  const [uploadedUrls, setUploadedUrls] = useState<Record<string | number, string>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const lastNotifiedUrlsRef = useRef<string>("");
  const lastInitialUrlsRef = useRef<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with initial URLs
 // Initialize with initial URLs
useEffect(() => {
  const initialUrlsString = JSON.stringify(initialUrls || []);
  if (initialUrlsString === lastInitialUrlsRef.current) return;

  lastInitialUrlsRef.current = initialUrlsString;

  // لو عندك initialUrls: اعرضها كـ existing
  if (initialUrls && initialUrls.length > 0) {
    const existingFiles: SelectedFile[] = initialUrls.map((url, index) => ({
      id: `existing-${index}`,
      name: url.split("/").pop() || `Image ${index + 1}`,
      isExisting: true,
      url,
    }));

    setSelectedFiles(existingFiles);

    const newStatus: Record<string | number, UploadStatus> = {};
    const newUrls: Record<string | number, string> = {};

    existingFiles.forEach((f) => {
      newStatus[f.id] = "success";
      if (f.url) newUrls[f.id] = f.url;
    });

    setUploadStatus(newStatus);
    setUploadedUrls(newUrls);
    return;
  }

  // لو initialUrls بقت فاضية: شيل existing فقط (بدون ما تعتمد على selectedFiles.length)
  if (initialUrls && initialUrls.length === 0) {
    setSelectedFiles((prev) => prev.filter((f) => !f.isExisting));

    setUploadStatus((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (String(k).startsWith("existing-")) delete next[k];
      });
      return next;
    });

    setUploadedUrls((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (String(k).startsWith("existing-")) delete next[k];
      });
      return next;
    });
  }
}, [initialUrls]);

  const authenticator = async (): Promise<AuthParams> => {
    try {
      const response = await fetch("/api/upload-auth");
      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        let errorData: any = null;
        
        // Try to parse error response as JSON
        try {
          const responseClone = response.clone(); // Clone to avoid consuming the body
          errorData = await responseClone.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, try to get text
          try {
            const responseClone = response.clone();
            const errorText = await responseClone.text();
            if (errorText) errorMessage = errorText;
          } catch {
            // Ignore parse errors
          }
        }
        
        if (response.status === 401) {
          throw new Error("Unauthorized: Please sign in to upload files");
        } else if (response.status === 500) {
          // Build detailed error message from error data
          let detailedMessage = errorMessage;
          if (errorData) {
            if (errorData.message) {
              detailedMessage = errorData.message;
            }
            if (errorData.help) {
              detailedMessage += `\n\n${errorData.help}`;
            }
          }
          throw new Error(detailedMessage);
        }
        throw new Error(`Authentication failed: ${errorMessage}`);
      }

      const data: AuthParams = await response.json();
      const { signature, expire, token, publicKey, urlEndpoint } = data;
      
      // Validate response data
      if (!signature || !expire || !token || !publicKey) {
        throw new Error("Invalid authentication response: Missing required parameters");
      }
      
      return { signature, expire, token, publicKey, urlEndpoint };
    } catch (error) {
      // Re-throw with original message if it's already an Error with a message
      if (error instanceof Error && error.message) {
        throw error;
      }
      throw new Error("Authentication request failed: Unable to connect to upload service");
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
    const newStatus: Record<string | number, UploadStatus> = {};
    const newProgress: Record<string | number, number> = {};
    newFiles.forEach((f) => {
      newStatus[f.id] = "idle";
      newProgress[f.id] = 0;
    });

    setUploadStatus((prev) => ({ ...prev, ...newStatus }));
    setUploadProgress((prev) => ({ ...prev, ...newProgress }));

    // Start uploading automatically
    newFiles.forEach((fileObj) => {
      uploadSingleFile(fileObj);
    });
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
    const { id, file, isExisting } = fileObj;

    if (isExisting || !file) return;

    setUploadStatus((prev) => ({ ...prev, [id]: "uploading" } as Record<string | number, UploadStatus>));
    setUploadProgress((prev) => ({ ...prev, [id]: 0 }));
    setErrorMessages((prev) => ({ ...prev, [id]: "" }));

    try {
      const authParams = await authenticator();
      const { signature, expire, token, publicKey, urlEndpoint } = authParams;

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

      setUploadStatus((prev) => ({ ...prev, [id]: "success" } as Record<string | number, UploadStatus>));
      
      // Extract URL from ImageKit response - check multiple possible fields
      const imageUrl = uploadResponse.url || uploadResponse.filePath;
      
      if (!imageUrl) {
        throw new Error("Upload succeeded but no URL returned from ImageKit");
      }
      
      // Ensure URL is absolute (starts with http:// or https://)
      // ImageKit usually returns full URLs, but handle both cases
      let absoluteUrl: string;
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        absoluteUrl = imageUrl;
      } else {
        // If relative URL, prepend with ImageKit URL endpoint
        const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
        if (urlEndpoint) {
          const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
          absoluteUrl = `${urlEndpoint}/${cleanPath}`;
        } else {
          absoluteUrl = imageUrl; // Fallback - should not happen
        }
      }
      
      // Ensure URL is a clean string
      absoluteUrl = String(absoluteUrl).trim();
      
      console.log('Image uploaded successfully:', {
        fileId: id,
        fileName: file.name,
        url: absoluteUrl,
        uploadResponse: uploadResponse
      });
      
      setUploadedUrls((prev) =>
        Object.assign({}, prev, { [id]: absoluteUrl })
      );
    } catch (error: any) {
      // Explicitly type error as 'any' or a more specific type if known
      setUploadStatus((prev) => ({ ...prev, [id]: "error" } as Record<string | number, UploadStatus>));

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

  const removeFile = (fileId: string | number) => {
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

  const formatFileSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isImage = (file?: File, isExisting?: boolean): boolean => {
    if (isExisting) return true; // Assume existing URLs are images for simplicity in this component
    return !!(file && file.type.startsWith("image/"));
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
    // Convert uploaded URLs object to array of URL strings
    const urlsArray: string[] = Object.values(uploadedUrls).filter(
      (url): url is string => typeof url === 'string' && url.trim().length > 0 && (url.startsWith('http://') || url.startsWith('https://'))
    );
    
    const urlsString = JSON.stringify(urlsArray.sort());
    
    if (urlsString !== lastNotifiedUrlsRef.current) {
      setImageUrls(urlsArray);
      lastNotifiedUrlsRef.current = urlsString;
      onUploadComplete?.(urlsArray);
      
      console.log('ImageUpload: Parent notified of URL changes', {
        count: urlsArray.length,
        urls: urlsArray,
      });
    }
  }, [uploadedUrls, onUploadComplete]);

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
                    {fileObj.isExisting && fileObj.url ? (
                      <div className="relative w-10 h-10 rounded border overflow-hidden flex-shrink-0">
                        <img 
                          src={fileObj.url} 
                          alt={fileObj.name} 
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : isImage(fileObj.file, fileObj.isExisting) ? (
                      <Image className="h-6 w-6 text-blue-600 flex-shrink-0" />
                    ) : (
                      <File className="h-6 w-6 text-gray-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {fileObj.name}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {fileObj.size && <span>{formatFileSize(fileObj.size)}</span>}
                        {uploadStatus[fileObj.id] === "success" && (
                          <span className="text-green-600 flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            {fileObj.isExisting ? "Existing" : "Uploaded"}
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

          {/* Success Summary */}
          {stats.completed === stats.total &&
            stats.total > 0 && (
              <div className="text-center p-4 border border-[#fff] rounded-lg">
                <Check className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <p className="text-green-800 font-medium">
                  All files uploaded successfully!
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
