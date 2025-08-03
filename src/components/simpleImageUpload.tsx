"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2, Plus } from "lucide-react";
import { toast } from "sonner"; // لاستخدام التنبيهات

// Props interface for the component
interface SimpleImageUploadProps {
  value?: string; // Current image URL
  onChange: (url: string | undefined) => void; // Callback to update the parent form with the new URL
}

// Authentication parameters from the backend
interface AuthParams {
  signature: string;
  expire: number;
  token: string;
  publicKey: string;
}

export function SimpleImageUpload({ value, onChange }: SimpleImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value); // State to control the image preview

  // Update preview when the 'value' prop changes (e.g., when category data is loaded)
  useEffect(() => {
    setPreviewUrl(value);
  }, [value]);

  // Function to fetch authentication parameters from your backend API
  const authenticator = async (): Promise<AuthParams> => {
    try {
      const response = await fetch("/api/upload-auth"); // Call your backend API route
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API response not OK:", response.status, errorText);
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`
        );
      }

      const data: AuthParams = await response.json();
      console.log("Received authentication data from API:", data); // For debugging: check what data is received

      const { signature, expire, token, publicKey } = data;

      // Validate if all required parameters are present
      if (!signature || !expire || !token || !publicKey) {
        console.error("Missing authentication parameters:", { signature, expire, token, publicKey });
        throw new Error("One or more authentication parameters are missing from API response.");
      }

      return { signature, expire, token, publicKey };
    } catch (error) {
      console.error("Authentication error in frontend authenticator:", error);
      toast.error("فشل المصادقة لرفع الصورة."); // Show a user-friendly error
      throw new Error("Authentication request failed");
    }
  };

  // Handler for when a file is selected via input or drag-drop
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // Get the first selected file
    if (!file) return;

    // Validate file type to ensure it's an image
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء رفع ملف صورة فقط.");
      e.target.value = ""; // Clear the input so same file can be selected again
      return;
    }

    setIsUploading(true); // Set uploading state to true
    setPreviewUrl(undefined); // Clear previous preview during upload
    toast.info("جاري رفع الصورة..."); // Inform user about upload progress

    try {
      const authParams = await authenticator(); // Get auth parameters
      const { signature, expire, token, publicKey } = authParams;

      // Call ImageKit's upload function
      const uploadResponse = await upload({
        expire,
        token,
        signature,
        publicKey,
        file,
        fileName: file.name,
        // onProgress: (event) => { /* You can add a progress bar here if needed */ },
        // abortSignal: abortController.signal, // If you implement cancel functionality
      });

      if (uploadResponse.url) {
        setPreviewUrl(uploadResponse.url); // Update preview with the new URL
        onChange(uploadResponse.url); // Notify parent component with the new URL
        toast.success("تم رفع الصورة بنجاح!"); // Success message
      } else {
        toast.error("فشل الرفع: لم يتم الحصول على رابط الصورة."); // Error if URL is missing
        onChange(undefined); // Clear URL in parent
      }
    } catch (error) {
      // Detailed error handling for different ImageKit errors
      let errorMessage = "فشل رفع الصورة: خطأ غير معروف";
      if (error instanceof ImageKitAbortError) {
        errorMessage = "تم إلغاء الرفع.";
      } else if (error instanceof ImageKitInvalidRequestError) {
        errorMessage = "طلب غير صالح: " + error.message;
      } else if (error instanceof ImageKitUploadNetworkError) {
        errorMessage = "خطأ في الشبكة أثناء الرفع: " + error.message;
      } else if (error instanceof ImageKitServerError) {
        errorMessage = "خطأ في الخادم: " + error.message;
      } else {
        errorMessage = "فشل الرفع: " + ((error as Error)?.message || "خطأ غير معروف");
      }
      toast.error(errorMessage); // Show specific error to user
      onChange(undefined); // Clear URL in parent on error
    } finally {
      setIsUploading(false); // Reset uploading state
      e.target.value = ""; // Clear file input value
    }
  };

  // Handler to remove the currently displayed image
  const handleRemoveImage = () => {
    setPreviewUrl(undefined); // Clear local preview
    onChange(undefined); // Notify parent that image is removed (set to undefined/empty)
    toast.info("تمت إزالة الصورة."); // Inform user
  };

  return (
    <div className="border rounded-md p-4">
      {/* Hidden file input element */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*" // Only accept image files
      />

      {isUploading ? (
        // Display loading spinner while uploading
        <div className="flex flex-col items-center justify-center p-6 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p>جاري الرفع...</p>
        </div>
      ) : (
        // Display either image preview or upload prompt
        <div className="flex flex-col items-center">
          {previewUrl ? (
            // Image preview area
            <div className="relative w-32 h-32 rounded-md overflow-hidden border mb-4">
              <img
                src={previewUrl}
                alt="معاينة الصورة"
                className="w-full h-full object-cover"
              />
              {/* Button to remove the displayed image */}
              <button
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition-opacity"
                title="إزالة الصورة"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            // Drag-and-drop / click to upload area
            <div
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md w-full cursor-pointer hover:border-gray-400"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mb-3" />
              <p className="text-gray-600 mb-1">اسحب وأفلت صورة، أو</p>
              <div className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors">
                <Plus className="w-4 h-4 mr-1" />
                اختر صورة
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SimpleImageUpload; 