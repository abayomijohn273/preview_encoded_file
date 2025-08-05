# PreviewDocumentModal Component

A comprehensive document preview modal component that supports multiple file types including images, PDFs, and documents. This component intelligently detects file types and renders them using the most appropriate method.

## Features

- 🖼️ **Multi-format Support**: Images, PDFs, and documents
- 🎯 **Smart Type Detection**: Automatic file type detection based on MIME types
- 📱 **Responsive Design**: Optimized for different screen sizes
- 🔄 **Loading States**: Proper loading and error handling
- 💾 **Download Capability**: Download option for all file types
- 🧹 **Memory Management**: Automatic cleanup of blob URLs

## Supported File Types

### Images

- **MIME Types**: `image/*` (JPEG, PNG, GIF, BMP, WebP, SVG)
- **Rendering**: Next.js `Image` component with optimized loading

### PDFs

- **MIME Type**: `application/pdf`
- **Rendering**: Native browser iframe for seamless viewing

### Documents

- **MIME Types**:
  - Microsoft Office: `application/vnd.openxmlformats-officedocument.*`
  - Legacy Office: `application/msword`, `application/vnd.ms-excel`, `application/vnd.ms-powerpoint`
  - Text files: `text/*`
- **Rendering**: Google Docs Viewer with Office Online fallback

## Usage

```tsx
import PreviewDocumentModal from "@/components/blocks/previewDocumentModal";

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const { mediaFile, mimeType, isLoading } = useGetMediaFileData(fileId);

  return (
    <PreviewDocumentModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      mediaFile={mediaFile}
      mimeType={mimeType}
    />
  );
}
```

## Props

| Prop        | Type                                   | Required | Description                       |
| ----------- | -------------------------------------- | -------- | --------------------------------- |
| `isOpen`    | `boolean`                              | ✅       | Controls modal visibility         |
| `onClose`   | `() => void`                           | ✅       | Callback when modal closes        |
| `mediaFile` | `ArrayBuffer \| string \| Blob \| any` | ❌       | File data to preview              |
| `mimeType`  | `string`                               | ❌       | MIME type for file type detection |

## Integration with Media API

This component works seamlessly with the media API system:

### 1. Media API (`src/services/apis/mediaApi.ts`)

```typescript
export interface MediaFileResponse {
  data: ArrayBuffer;
  mimeType?: string;
}

export const getMediaFileApi = async (
  id: string
): Promise<MediaFileResponse> => {
  const response = await Axios.get(
    `${AUTH_API_PREFIX}/media-file/${id}/download`,
    { responseType: "arraybuffer" }
  );

  return {
    data: response.data,
    mimeType: response.headers["content-type"],
  };
};
```

### 2. Data Hook (`src/hooks/api-hooks/useGetMediaFileData.tsx`)

```typescript
const useGetMediaFileData = (id: string) => {
  const { data: mediaFileResponse, isLoading } = useQuery<MediaFileResponse>({
    queryKey: ["media_file", id],
    queryFn: () => getMediaFileApi(id),
    enabled: !!id,
    retry: 1,
  });

  return {
    mediaFile: mediaFileResponse?.data,
    mimeType: mediaFileResponse?.mimeType,
    isLoading,
  };
};
```

## Technical Implementation

### File Type Detection

The component uses a smart detection algorithm:

1. **Primary**: MIME type from HTTP response headers
2. **Fallback**: File extension analysis (removed in current version)

```typescript
const detectFileType = (
  mimeType?: string
): "image" | "pdf" | "document" | "unknown" => {
  if (mimeType) {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.includes("document") || mimeType.includes("word") /* ... */) {
      return "document";
    }
  }
  return "unknown";
};
```

### Data Processing

The component handles multiple data formats:

```typescript
// String (base64)
if (typeof mediaFile === "string") {
  const detectedMimeType = getMimeType(detectedType, mimeType);
  setDocumentUrl(`data:${detectedMimeType};base64,${mediaFile}`);
}

// ArrayBuffer (binary data)
else if (mediaFile instanceof ArrayBuffer) {
  const detectedMimeType = getMimeType(detectedType, mimeType);
  const blob = new Blob([mediaFile], { type: detectedMimeType });
  const url = URL.createObjectURL(blob);
  setDocumentUrl(url);
}

// Blob (binary data)
else if (mediaFile instanceof Blob) {
  const url = URL.createObjectURL(mediaFile);
  setDocumentUrl(url);
}
```

### Rendering Strategies

#### Images

- Uses Next.js `Image` component for optimization
- Automatic sizing and responsive behavior
- Error handling with fallback

#### PDFs

- Native browser iframe rendering
- Full-screen viewing capability
- Cross-browser compatibility

#### Documents

- Google Docs Viewer for universal compatibility
- Office Online viewer as fallback
- Embedded viewing experience

## Error Handling

The component provides comprehensive error handling:

- **Loading States**: Shows spinner during file processing
- **Error Messages**: Clear error descriptions for users
- **Fallback Options**: Download button when preview fails
- **Graceful Degradation**: Handles unsupported file types

## Performance Considerations

### Memory Management

- Automatic cleanup of blob URLs on component unmount
- URL revocation when modal closes
- Efficient re-rendering with proper dependencies

### Optimization

- Lazy loading of preview content
- Efficient file type detection
- Minimal re-renders with React.memo potential

## Browser Compatibility

| Feature         | Chrome | Firefox | Safari | Edge |
| --------------- | ------ | ------- | ------ | ---- |
| PDF Viewing     | ✅     | ✅      | ✅     | ✅   |
| Image Preview   | ✅     | ✅      | ✅     | ✅   |
| Document Viewer | ✅     | ✅      | ⚠️\*   | ✅   |
| Blob URLs       | ✅     | ✅      | ✅     | ✅   |

\*Safari may have limitations with Google Docs Viewer for some document types

## Examples

### Basic Usage

```tsx
// In a customer details component
const { mediaFile, mimeType, isLoading } = useGetMediaFileData(proofId);

<PreviewDocumentModal
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
  mediaFile={mediaFile}
  mimeType={mimeType}
/>;
```

### With Loading State

```tsx
<Button onClick={() => setShowPreview(true)} disabled={isLoading}>
  {isLoading ? "Loading..." : "Preview Document"}
</Button>
```

## Future Enhancements

- [ ] Support for video files (`video/*`)
- [ ] Support for audio files (`audio/*`)
- [ ] Zoom functionality for images
- [ ] Print capability
- [ ] Full-screen mode
- [ ] Multiple file preview (carousel)
- [ ] File metadata display (size, dimensions)

## Dependencies

- `@/components/ui/dialog` - Modal wrapper
- `@/components/ui/button` - Action buttons
- `next/image` - Optimized image component
- `react` - Core React hooks

## Related Files

- `src/services/apis/mediaApi.ts` - Media file API
- `src/hooks/api-hooks/useGetMediaFileData.tsx` - Data fetching hook
- `src/modules/customersDetails/components/identityVerificationInformation.tsx` - Usage example
- `src/modules/customersDetails/components/addressInformation.tsx` - Usage example

## Troubleshooting

### Common Issues

1. **Preview not showing**: Check if `mimeType` is correctly passed
2. **Download not working**: Ensure blob URL is properly created
3. **PDF not loading**: Verify browser PDF plugin is enabled
4. **Document viewer fails**: Check if document URL is publicly accessible

### Debug Tips

```typescript
// Add console logging for debugging
console.log("Media file type:", typeof mediaFile);
console.log("MIME type:", mimeType);
console.log("Detected file type:", fileType);
console.log("Document URL:", documentUrl);
```
