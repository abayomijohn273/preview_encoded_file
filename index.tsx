"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useEffect, useState } from "react";

interface PreviewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaFile?: any;
  mimeType?: string;
}

const PreviewDocumentModal = ({
  isOpen,
  onClose,
  mediaFile,
  mimeType,
}: PreviewDocumentModalProps) => {
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [fileType, setFileType] = useState<
    "image" | "pdf" | "document" | "unknown"
  >("unknown");

  // Detect file type from MIME type or file extension
  const detectFileType = (
    mimeType?: string
  ): "image" | "pdf" | "document" | "unknown" => {
    // Check MIME type first
    if (mimeType) {
      if (mimeType.startsWith("image/")) return "image";
      if (mimeType === "application/pdf") return "pdf";
      if (
        mimeType.includes("document") ||
        mimeType.includes("word") ||
        mimeType.includes("text") ||
        mimeType.includes("spreadsheet") ||
        mimeType.includes("presentation") ||
        mimeType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimeType ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        mimeType === "application/msword" ||
        mimeType === "application/vnd.ms-excel" ||
        mimeType === "application/vnd.ms-powerpoint"
      )
        return "document";
    }

    return "unknown";
  };

  // Get the appropriate MIME type for blob creation
  const getMimeType = (
    detectedType: string,
    providedMimeType?: string
  ): string => {
    if (providedMimeType) return providedMimeType;

    switch (detectedType) {
      case "pdf":
        return "application/pdf";
      case "image":
        return "image/jpeg"; // Default fallback
      case "document":
        return "application/octet-stream";
      default:
        return "application/octet-stream";
    }
  };

  useEffect(() => {
    if (mediaFile && isOpen) {
      setIsLoading(true);
      setError("");

      // Detect file type
      const detectedType = detectFileType(mimeType);
      setFileType(detectedType);

      try {
        // Check if mediaFile is already a string (base64 or URL)
        if (typeof mediaFile === "string") {
          // If it starts with data: it's already a data URL
          if (mediaFile.startsWith("data:")) {
            setDocumentUrl(mediaFile);
          }
          // If it's base64 without prefix, add the appropriate prefix
          else {
            const detectedMimeType = getMimeType(detectedType, mimeType);
            setDocumentUrl(`data:${detectedMimeType};base64,${mediaFile}`);
          }
        }
        // If mediaFile is a Blob, create blob URL
        else if (mediaFile instanceof Blob) {
          const url = URL.createObjectURL(mediaFile);
          setDocumentUrl(url);
        }
        // If it's an ArrayBuffer, convert to Blob first
        else if (mediaFile instanceof ArrayBuffer) {
          const detectedMimeType = getMimeType(detectedType, mimeType);
          const blob = new Blob([mediaFile], { type: detectedMimeType });
          const url = URL.createObjectURL(blob);
          setDocumentUrl(url);
        }
        // If it's an object with data property
        else if (mediaFile && typeof mediaFile === "object" && mediaFile.data) {
          if (typeof mediaFile.data === "string") {
            const detectedMimeType = getMimeType(detectedType, mimeType);
            setDocumentUrl(`data:${detectedMimeType};base64,${mediaFile.data}`);
          } else {
            const detectedMimeType = getMimeType(detectedType, mimeType);
            const blob = new Blob([mediaFile.data], { type: detectedMimeType });
            const url = URL.createObjectURL(blob);
            setDocumentUrl(url);
          }
        } else {
          setError("Unsupported media file format");
        }
      } catch (err) {
        console.error("Error processing media file:", err);
        setError("Failed to load document");
      } finally {
        setIsLoading(false);
      }
    }

    // Cleanup blob URLs when modal closes
    return () => {
      if (documentUrl && documentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(documentUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaFile, isOpen, mimeType]);

  // Clear URL when modal closes
  useEffect(() => {
    if (!isOpen && documentUrl && documentUrl.startsWith("blob:")) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl("");
    }
  }, [isOpen, documentUrl]);

  // Render content based on file type
  const renderPreviewContent = () => {
    if (!documentUrl) return null;

    switch (fileType) {
      case "image":
        return (
          <div className="flex items-center justify-center h-[70vh] bg-gray-50">
            <Image
              src={documentUrl}
              alt={"Preview"}
              className="max-w-full max-h-full object-contain"
              onError={() => setError("Failed to load image")}
              width={1000}
              height={1000}
            />
          </div>
        );

      case "pdf":
        return (
          <div className="h-[70vh] w-full">
            <iframe
              className="h-full w-full border-0"
              src={documentUrl}
              title="PDF Preview"
              onError={() => setError("Failed to load PDF")}
            />
          </div>
        );

      case "document":
        const encodedUrl = encodeURIComponent(documentUrl);
        return (
          <div className="h-[70vh] w-full">
            <iframe
              className="h-full w-full border-0"
              src={`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`}
              title="Document Preview"
              onError={() => {
                const officeViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
                const iframe = document.querySelector(
                  'iframe[title="Document Preview"]'
                ) as HTMLIFrameElement;
                if (iframe) {
                  iframe.src = officeViewerUrl;
                }
              }}
            />
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Preview not available</p>
              <p className="text-sm text-gray-400">
                This file type cannot be previewed in the browser
              </p>
              {documentUrl && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = documentUrl;
                    link.download = "download";
                    link.click();
                  }}
                >
                  Download File
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-left">Preview Document</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading document...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <p className="text-red-500 mb-2">{error}</p>
              <p className="text-sm text-gray-500">
                Unable to preview this document
              </p>
              {documentUrl && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = documentUrl;
                    link.download = "download";
                    link.click();
                  }}
                >
                  Download File
                </Button>
              )}
            </div>
          </div>
        ) : (
          renderPreviewContent()
        )}

        <DialogFooter>
          {documentUrl && !error && (
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement("a");
                link.href = documentUrl;
                link.download = "download";
                link.click();
              }}
            >
              Download
            </Button>
          )}
          <Button variant="destructive" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewDocumentModal;
