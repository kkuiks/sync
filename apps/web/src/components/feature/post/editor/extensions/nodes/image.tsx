import { ArrowCounterClockwiseIcon, ImageIcon } from '@phosphor-icons/react';
import {
  Node,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from '@tiptap/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useUploadMedia } from '@/api/__generated__/media/media';
import { uploadFileToS3 } from '@/api/s3';
import { Button } from '@/components/ui/button';
import { FileInput } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import SyncError, { ErrorCode } from '@/lib/error';
import { MAX_FILE_SIZE, cn } from '@/lib/tiptap-utils';

import { hasSupportedFileTransfer, takePendingFile } from '../media-drop';
import { type ImageNodeAttributes, imageNodeSchema } from './image.schema';

export type { ImageNodeAttributes };

export const ImageNode = Node.create<ImageNodeAttributes>({
  ...imageNodeSchema,
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeComponent);
  },
});

export const ReadOnlyImageNode = Node.create<ImageNodeAttributes>({
  ...imageNodeSchema,
  addNodeView() {
    return ReactNodeViewRenderer(ReadOnlyImageNodeComponent);
  },
});

function ImageNodeComponent({
  node,
  selected,
  updateAttributes,
}: NodeViewProps) {
  const { src, status, pendingId } = node.attrs as ImageNodeAttributes;

  const t = useTranslations('components.editor.image');
  const { mutateAsync: uploadImage } = useUploadMedia();

  const objectURLRef = useRef<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    return () => {
      if (objectURLRef.current) {
        URL.revokeObjectURL(objectURLRef.current);
      }
    };
  }, []);

  const handleFileUpload = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) {
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t('errors.max-size'));
        updateAttributes({ status: 'error' });
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      objectURLRef.current = objectUrl;

      updateAttributes({
        src: objectUrl,
        status: 'uploading',
      });

      uploadImage({
        data: {
          fileName: file.name,
          fileSize: file.size,
          mediaType: file.type,
        },
      })
        .then(({ data: { mediaId, uploadUrl, contentType } }) => {
          updateAttributes({
            mediaId,
          });

          return uploadFileToS3({
            uploadUrl,
            file,
            contentType,
          });
        })
        .then(({ success }) => {
          if (!success) {
            throw new Error(t('errors.s3-upload-failed'));
          }

          updateAttributes({
            status: 'uploaded',
          });
          toast.success(t('messages.upload-success'));
        })
        .catch((error) => {
          if (error instanceof SyncError) {
            switch (error.code) {
              case ErrorCode.MEDIA_TOO_LARGE:
                toast.error(t('errors.max-size'));
                break;
              case ErrorCode.UNSUPPORTED_MEDIA_TYPE:
                toast.error(t('errors.unsupported-type'));
                break;
              default:
                toast.error(t('errors.upload-failed'));
            }
          } else {
            toast.error(
              error instanceof Error
                ? error.message
                : t('errors.upload-failed'),
            );
          }

          updateAttributes({
            status: 'error',
          });
        });
    },
    [t, updateAttributes, uploadImage],
  );

  useEffect(() => {
    if (!pendingId) {
      return;
    }

    const file = takePendingFile(pendingId);

    // updateAttributes 는 ProseMirror 트랜잭션을 flushSync 로 반영하므로, 커밋 중인
    // 이펙트에서 바로 부르면 React 가 렌더 도중의 flushSync 라며 막는다.
    queueMicrotask(() => {
      updateAttributes({ pendingId: null });

      if (file) {
        handleFileUpload([file]);
      }
    });
  }, [pendingId, updateAttributes, handleFileUpload]);

  return (
    <NodeViewWrapper className="my-6">
      <div
        className={cn(
          'w-full rounded-lg overflow-hidden',
          selected && 'border-l',
        )}
      >
        {status === 'none' ? (
          <FileInput
            accept="image/*"
            onFileChange={handleFileUpload}
            maxFiles={1}
          >
            <div
              onDragEnter={(event) => {
                if (hasSupportedFileTransfer(event.dataTransfer)) {
                  setIsDragOver(true);
                }
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as HTMLElement | null,
                  )
                ) {
                  setIsDragOver(false);
                }
              }}
              onDrop={() => setIsDragOver(false)}
              className={cn(
                'flex w-full flex-col items-center justify-center gap-2 bg-muted py-10 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 hover:text-foreground',
                isDragOver && 'ring-2 ring-inset ring-primary/60',
              )}
            >
              <ImageIcon className="size-8" />
              <span className="text-sm font-medium">
                {t('placeholders.upload')}
              </span>
            </div>
          </FileInput>
        ) : (
          <div className="relative aspect-video w-full">
            {src && (
              <Image
                src={src}
                alt={t('alt')}
                fill
                className={cn(
                  'object-cover',
                  status === 'uploading' && 'blur-sm brightness-75',
                  status === 'error' && 'opacity-25',
                )}
                unoptimized
              />
            )}

            {status === 'uploading' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner className="size-6 border-white border-t-transparent" />
              </div>
            )}

            {status === 'error' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex w-full flex-col items-center justify-center gap-3 rounded-lg py-10">
                  <span className="text-xl text-destructive">
                    {t('errors.upload-failed')}
                  </span>

                  <FileInput
                    accept="image/*"
                    onFileChange={handleFileUpload}
                    maxFiles={1}
                  >
                    <Button variant="outline" size="sm">
                      <ArrowCounterClockwiseIcon className="size-4" />
                      {t('actions.retry')}
                    </Button>
                  </FileInput>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

function ReadOnlyImageNodeComponent({ node }: NodeViewProps) {
  const { src } = node.attrs as ImageNodeAttributes;
  const t = useTranslations('components.editor.image');

  return (
    <NodeViewWrapper className="my-6">
      <div className="w-full overflow-hidden rounded-lg">
        <div className="relative aspect-video w-full">
          {src && (
            <Image
              src={src}
              alt={t('alt')}
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
