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
  urlEndpoint?: string;
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
          toast.error("غير مصرح: يرجى تسجيل الدخول لرفع الصور");
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
          toast.error(`خطأ في الخادم: ${errorMessage}. يرجى التحقق من إعدادات ImageKit.`);
          throw new Error(detailedMessage);
        }
        toast.error(`فشل المصادقة: ${errorMessage}`);
        throw new Error(`Authentication failed: ${errorMessage}`);
      }

      const data: AuthParams = await response.json();

      const { signature, expire, token, publicKey, urlEndpoint } = data;

      // Validate if all required parameters are present
      if (!signature || !expire || !token || !publicKey) {
        toast.error("فشل المصادقة: معاملات المصادقة غير مكتملة.");
        throw new Error("One or more authentication parameters are missing from API response.");
      }

      return { signature, expire, token, publicKey, urlEndpoint };
    } catch (error) {
      // Only show toast if not already shown above
      if (error instanceof Error && !error.message.includes("Unauthorized") && !error.message.includes("Server error") && !error.message.includes("Authentication failed") && !error.message.includes("missing")) {
        toast.error("فشل المصادقة لرفع الصورة."); // Show a user-friendly error
      }
      // Re-throw with original message if it's already an Error with a message
      if (error instanceof Error && error.message) {
        throw error;
      }
      throw new Error("Authentication request failed: Unable to connect to upload service");
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
      const { signature, expire, token, publicKey, urlEndpoint } = authParams;

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

      // Extract URL from ImageKit response - check multiple possible fields
      const imageUrl = uploadResponse.url || uploadResponse.filePath;
      
      if (imageUrl) {
        // Ensure URL is absolute (starts with http:// or https://)
        const absoluteUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://') 
          ? imageUrl 
          : (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ? 
              `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${imageUrl.replace(/^\//, '')}` 
              : imageUrl);
        
        setPreviewUrl(absoluteUrl); // Update preview with the new URL
        onChange(absoluteUrl); // Notify parent component with the new URL
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
