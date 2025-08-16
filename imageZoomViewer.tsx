"use client";
import { Button } from "@/components/ui/button";
import { Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface ImageZoomViewerProps {
  src: string;
  alt: string;
  onError?: () => void;
}

const ImageZoomViewer = ({ src, alt, onError }: ImageZoomViewerProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const minScale = 0.5;
  const maxScale = 5;
  const scaleStep = 0.25;

  // Reset position when scale changes to 1
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  const handleZoomIn = useCallback(() => {
    setScale((prevScale) => Math.min(prevScale + scaleStep, maxScale));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prevScale) => Math.max(prevScale - scaleStep, minScale));
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setLastPosition(position);
        e.preventDefault();
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;

        setPosition({
          x: lastPosition.x + deltaX,
          y: lastPosition.y + deltaY,
        });
      }
    },
    [isDragging, dragStart, lastPosition, scale]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -scaleStep : scaleStep;
    setScale((prevScale) =>
      Math.max(minScale, Math.min(maxScale, prevScale + delta))
    );
  }, []);

  // Handle touch events for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1 && scale > 1) {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX, y: touch.clientY });
        setLastPosition(position);
        e.preventDefault();
      }
    },
    [scale, position]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging && e.touches.length === 1 && scale > 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStart.x;
        const deltaY = touch.clientY - dragStart.y;

        setPosition({
          x: lastPosition.x + deltaX,
          y: lastPosition.y + deltaY,
        });
        e.preventDefault();
      }
    },
    [isDragging, dragStart, lastPosition, scale]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          disabled={scale >= maxScale}
          className="h-8 w-8 p-0"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          disabled={scale <= minScale}
          className="h-8 w-8 p-0"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          disabled={scale === 1 && position.x === 0 && position.y === 0}
          className="h-8 w-8 p-0"
          title="Reset Zoom"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg">
        <span className="text-sm font-medium">{Math.round(scale * 100)}%</span>
      </div>

      {scale > 1 && (
        <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg flex items-center gap-2">
          <Move className="h-4 w-4" />
          <span className="text-sm">Drag to pan</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex items-center justify-center h-full bg-gray-50 overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <div
          ref={imageRef}
          className="transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: "center center",
          }}
        >
          <Image
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain select-none"
            onError={onError}
            width={1000}
            height={1000}
            draggable={false}
            style={{
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageZoomViewer;
