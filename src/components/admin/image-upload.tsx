'use client'

import * as React from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { uploadImageToImageKit } from '@/lib/upload'
import { Button } from './button'
import { useFieldContext } from './form'

/* ============================================================================
   ImageUploadField
   ----------------------------------------------------------------------------
   A single-image control for the console forms, in the same visual language as
   `Input`/`Textarea` rather than the shadcn `SimpleImageUpload` used by the
   admin dialogs — that one previews every image in a 128px square, which is the
   wrong shape for a 16:9 storefront cover and hides exactly the cropping
   problem the merchant needs to see before saving.

   The value is the uploaded URL, so the parent form stores a string and needs
   no multipart handling. Uploads go straight to ImageKit from the browser with
   a short-lived signature from `/api/upload-auth`; the image is compressed to
   WebP on the way (see `lib/upload`).
   ========================================================================== */

const MAX_BYTES = 15 * 1024 * 1024

export interface ImageUploadFieldProps {
  /** Current image URL, or empty/undefined for the empty state. */
  value?: string | null
  /** Receives the new URL, or `''` when the image is removed. */
  onChange: (url: string) => void
  /** Preview shape. `wide` is 16:9 (covers), `square` is 1:1 (logos, avatars). */
  aspect?: 'wide' | 'square'
  /** ImageKit destination folder. */
  folder?: string
  disabled?: boolean
  /** Replaces the default empty-state copy. */
  placeholder?: string
  className?: string
}

export function ImageUploadField({
  value,
  onChange,
  aspect = 'wide',
  folder = '/stores/',
  disabled = false,
  placeholder = 'اسحب صورة هنا أو اضغط للاختيار',
  className,
}: ImageUploadFieldProps) {
  const ctx = useFieldContext()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)

  const busy = uploading || disabled

  const handleFile = React.useCallback(
    async (file: File | undefined) => {
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast.error('يرجى اختيار ملف صورة')
        return
      }
      // Checked before compression: a 40MB original still has to be decoded in
      // the browser first, which is where a huge file actually hurts.
      if (file.size > MAX_BYTES) {
        toast.error('حجم الصورة يتجاوز 15 ميجابايت')
        return
      }

      setUploading(true)
      try {
        const url = await uploadImageToImageKit(file, folder)
        onChange(url)
        toast.success('تم رفع الصورة')
      } catch (error) {
        toast.error((error as Error)?.message || 'تعذر رفع الصورة')
      } finally {
        setUploading(false)
      }
    },
    [folder, onChange],
  )

  const openPicker = () => {
    if (!busy) inputRef.current?.click()
  }

  return (
    <div className={cn('min-w-0', className)}>
      <input
        ref={inputRef}
        id={ctx?.id}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={busy}
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          // Cleared so re-picking the same file after a failed upload still
          // fires `change`.
          e.target.value = ''
        }}
      />

      {value ? (
        <div
          className={cn(
            'group relative overflow-hidden rounded-[5px] border border-border bg-canvas',
            aspect === 'wide' ? 'aspect-video' : 'aspect-square max-w-40',
          )}
        >
          <img src={value} alt="" className="size-full object-cover" />

          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
            <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={openPicker}>
              <Upload className="size-3.5" />
              استبدال
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => onChange('')}
            >
              <Trash2 className="size-3.5" />
              إزالة
            </Button>
          </div>

          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-background/70">
              <Loader2 className="size-5 animate-spin text-text-muted" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault()
            if (!busy) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (!busy) void handleFile(e.dataTransfer.files?.[0])
          }}
          // `aria-invalid` is not a supported attribute on the implicit button
          // role, so the error state is carried by the border colour and by the
          // message `Field` renders underneath.
          aria-describedby={ctx ? (ctx.invalid ? `${ctx.id}-error` : `${ctx.id}-hint`) : undefined}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-1.5 rounded-[5px]',
            'border border-dashed border-border bg-canvas text-text-muted',
            'transition-colors duration-100',
            'hover:border-border-strong hover:text-foreground',
            'focus-visible:border-border-focus focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-60',
            ctx?.invalid && 'border-tone-danger-border',
            dragging && 'border-border-focus text-foreground',
            aspect === 'wide' ? 'aspect-video' : 'aspect-square max-w-40',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              <span className="text-[12px]">جارٍ الرفع…</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-5" />
              <span className="px-4 text-center text-[12px] leading-4">{placeholder}</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
