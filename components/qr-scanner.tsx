"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Maximize, Minimize } from "lucide-react"

interface QrScannerProps {
  onResult: (result: string) => void
}

export function QrScanner({ onResult }: QrScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerContainerRef = useRef<HTMLDivElement | null>(null)

  const initializeScanner = async () => {
    if (!containerRef.current) return

    const qrScannerId = "qr-scanner"
    setError(null)
    setIsLoading(true)

    try {
      if (scannerContainerRef.current && containerRef.current?.contains(scannerContainerRef.current)) {
        containerRef.current.removeChild(scannerContainerRef.current)
        scannerContainerRef.current = null
      }

      const scannerContainer = document.createElement("div")
      scannerContainer.id = qrScannerId
      scannerContainerRef.current = scannerContainer
      containerRef.current.appendChild(scannerContainer)

      scannerRef.current = new Html5Qrcode(qrScannerId)

      const config = {
        fps: 30,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdgePercentage = isFullscreen ? 0.5 : 0.7
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight)
          const calculatedSize = Math.floor(minEdgeSize * minEdgePercentage)
          const qrboxSize = Math.max(calculatedSize, 50)
          return {
            width: qrboxSize,
            height: qrboxSize,
          }
        },
        aspectRatio: 1.0,
        disableFlip: false,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5Qrcode.SCAN_TYPE_CAMERA],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
        videoConstraints: {
          facingMode: "environment",
          width: isFullscreen ? { ideal: 1920 } : { ideal: 1280 },
          height: isFullscreen ? { ideal: 1080 } : { ideal: 720 },
          advanced: [{ focusMode: "continuous" }, { exposureMode: "continuous" }, { whiteBalanceMode: "continuous" }],
        },
      }

      const cameraConfigs = [
        {
          facingMode: "environment",
          width: { ideal: isFullscreen ? 1920 : 1280 },
          height: { ideal: isFullscreen ? 1080 : 720 },
          advanced: [{ focusMode: "continuous" }, { exposureMode: "continuous" }],
        },
        { facingMode: "environment" },
        { facingMode: "user" },
        { facingMode: { ideal: "environment" } },
        {},
      ]

      let scannerStarted = false

      for (const cameraConfig of cameraConfigs) {
        if (scannerStarted) break

        try {
          await scannerRef.current.start(
            cameraConfig,
            config,
            (decodedText) => {
              console.log("[v0] QR Scanner SUCCESS - Decoded:", decodedText)
              onResult(decodedText)
            },
            (errorMessage) => {
              // Only log non-routine errors
              if (
                !errorMessage.includes("No QR code found") &&
                !errorMessage.includes("QR code parse error") &&
                !errorMessage.includes("Unable to detect QR code") &&
                !errorMessage.includes("NotFoundException")
              ) {
                console.log("[v0] QR Scanner error:", errorMessage)
              }
            },
          )
          scannerStarted = true
          setIsLoading(false)
        } catch (cameraError) {
          console.log("[v0] Camera config failed:", cameraConfig, cameraError)
        }
      }

      if (!scannerStarted) {
        throw new Error("Unable to access camera with any configuration")
      }
    } catch (err) {
      console.error("[v0] Scanner initialization failed:", err)
      let errorMessage = "Camera access failed. "
      if (err instanceof Error) {
        if (err.message.includes("NotReadableError")) {
          errorMessage += "Camera may be in use by another app. Please close other camera apps and try again."
        } else if (err.message.includes("NotAllowedError")) {
          errorMessage += "Camera permission denied. Please allow camera access and refresh the page."
        } else if (err.message.includes("NotFoundError")) {
          errorMessage += "No camera found. Please ensure your device has a working camera."
        } else {
          errorMessage += err.message
        }
      }
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  useEffect(() => {
    if (scannerRef.current) {
      initializeScanner()
    }
  }, [isFullscreen])

  useEffect(() => {
    initializeScanner()

    return () => {
      const cleanup = async () => {
        try {
          if (scannerRef.current && scannerRef.current.isScanning) {
            await scannerRef.current.stop()
          }
        } catch (err) {
          console.log("[v0] Error stopping scanner:", err)
        } finally {
          if (scannerContainerRef.current && containerRef.current?.contains(scannerContainerRef.current)) {
            try {
              containerRef.current.removeChild(scannerContainerRef.current)
            } catch (removeErr) {
              console.log("[v0] Element already removed or not found:", removeErr)
            }
          }
          scannerContainerRef.current = null
          scannerRef.current = null
        }
      }

      cleanup()
    }
  }, [onResult])

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex justify-between items-center p-4 bg-black/80 text-white">
          <h3 className="text-lg font-semibold">QR Code Scanner</h3>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
            <Minimize className="h-4 w-4" />
          </Button>
        </div>
        <div ref={containerRef} className="flex-1 relative bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p>Initializing camera...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center z-10">
              <p className="mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={initializeScanner}>
                Retry Camera Access
              </Button>
            </div>
          )}
        </div>
        <div className="p-4 bg-black/80 text-center text-white">
          <p className="text-sm mb-1">Hold QR code steady within the scanning area</p>
          <p className="text-xs text-gray-300">Ensure good lighting and keep the code flat for faster detection</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex justify-between items-center p-3 border-b">
        <h3 className="text-sm font-medium">QR Scanner</h3>
        <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
      <div ref={containerRef} className="relative w-full h-[500px] bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Initializing camera...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white p-4 text-center">
            <p className="mb-4">{error}</p>
            <Button variant="outline" size="sm" onClick={initializeScanner}>
              Retry Camera Access
            </Button>
          </div>
        )}
      </div>
      <div className="p-3 text-center">
        <p className="text-sm text-muted-foreground mb-1">Hold QR code steady within the scanning area</p>
        <p className="text-xs text-muted-foreground">
          Ensure good lighting and keep the code flat for faster detection
        </p>
      </div>
    </Card>
  )
}
