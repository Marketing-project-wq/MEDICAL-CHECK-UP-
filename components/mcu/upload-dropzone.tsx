"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileUp, CheckCircle, AlertCircle, File, X } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DropzoneState = "idle" | "dragging" | "uploading" | "success" | "error"

interface UploadDropzoneProps {
  onUploadComplete: (fileUrl: string, fileName: string, fileType: string) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ACCEPTED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
}

export function UploadDropzone({ onUploadComplete }: UploadDropzoneProps) {
  const [state, setState] = useState<DropzoneState>("idle")
  const [progress, setProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState("")

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: unknown[]) => {
    if (rejectedFiles && (rejectedFiles as Array<unknown>).length > 0) {
      const rejection = (rejectedFiles as Array<{ errors: Array<{ code: string }> }>)[0]
      if (rejection.errors[0]?.code === "file-too-large") {
        setErrorMessage("File terlalu besar. Maksimal 10MB.")
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setErrorMessage("Tipe file tidak didukung. Gunakan PDF, JPG, atau PNG.")
      } else {
        setErrorMessage("File tidak valid. Silakan coba lagi.")
      }
      setState("error")
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSelectedFile(file)
      setErrorMessage("")
      setState("idle")

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  })

  const currentState: DropzoneState = isDragActive ? "dragging" : state

  const handleUpload = async () => {
    if (!selectedFile) return

    setState("uploading")
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100)
          setProgress(pct)
        }
      })

      const response = await new Promise<{ token: string; fileUrl: string }>(
        (resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                resolve(JSON.parse(xhr.responseText))
              } catch {
                reject(new Error("Invalid server response"))
              }
            } else {
              reject(new Error(xhr.statusText || "Upload failed"))
            }
          }
          xhr.onerror = () => reject(new Error("Network error"))
          xhr.open("POST", "/api/mcu/upload")
          xhr.send(formData)
        }
      )

      setProgress(100)
      setState("success")

      // Save token to localStorage
      try {
        localStorage.setItem("mcu_upload_token", response.token)
      } catch {
        // localStorage may not be available
      }

      onUploadComplete(response.fileUrl, selectedFile.name, selectedFile.type)
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Upload gagal. Silakan coba lagi."
      )
      setState("error")
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setProgress(0)
    setErrorMessage("")
    setState("idle")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full space-y-4">
      <AnimatePresence mode="wait">
        {/* Dropzone area */}
        <motion.div
          key={currentState === "success" ? "success" : "dropzone"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {currentState === "success" ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-green-400 bg-green-50 p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <CheckCircle className="h-12 w-12 text-green-500" />
              </motion.div>
              <p className="text-lg font-semibold text-green-700">
                Upload Berhasil!
              </p>
              <p className="text-sm text-green-600">
                File Anda telah berhasil diupload.
              </p>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                currentState === "dragging" &&
                  "border-[#FF6B35] bg-orange-50",
                currentState === "error" &&
                  "border-red-400 bg-red-50",
                currentState === "idle" &&
                  "border-muted-foreground/25 hover:border-[#FF6B35]/50 hover:bg-muted/50",
                currentState === "uploading" &&
                  "pointer-events-none border-[#FF6B35]/50 bg-orange-50/50"
              )}
            >
              <input {...getInputProps()} />

              <motion.div
                animate={
                  currentState === "dragging"
                    ? { y: [0, -6, 0], scale: 1.1 }
                    : { y: 0, scale: 1 }
                }
                transition={{ repeat: currentState === "dragging" ? Infinity : 0, duration: 1 }}
              >
                {currentState === "error" ? (
                  <AlertCircle className="h-12 w-12 text-red-400" />
                ) : currentState === "dragging" ? (
                  <FileUp className="h-12 w-12 text-[#FF6B35]" />
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
              </motion.div>

              {currentState === "error" ? (
                <>
                  <p className="text-sm font-medium text-red-600">{errorMessage}</p>
                  <p className="text-xs text-red-500">Klik atau drag file untuk mencoba lagi</p>
                </>
              ) : currentState === "dragging" ? (
                <p className="text-sm font-medium text-[#FF6B35]">
                  Lepaskan file di sini...
                </p>
              ) : currentState === "uploading" ? (
                <p className="text-sm font-medium text-muted-foreground">
                  Mengupload file...
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-medium">
                      Drag & drop file hasil MCU Anda di sini
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      atau klik untuk memilih file
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG, PNG (maks. 10MB)
                  </p>
                </>
              )}

              {currentState === "uploading" && (
                <div className="mt-2 w-full max-w-xs">
                  <Progress value={progress} className="h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">{progress}%</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* File preview */}
      <AnimatePresence>
        {selectedFile && currentState !== "success" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-14 w-14 rounded object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded bg-muted">
                  <File className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {currentState !== "uploading" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReset()
                  }}
                  className="rounded-full p-1 hover:bg-muted"
                  aria-label="Hapus file"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload button */}
      {selectedFile && currentState !== "success" && currentState !== "uploading" && (
        <Button
          onClick={handleUpload}
          className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]/90"
          size="lg"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      )}
    </div>
  )
}
