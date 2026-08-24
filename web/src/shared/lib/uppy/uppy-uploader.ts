export interface PresignedTarget {
  readonly objectKey: string;
  readonly url: string;
}

export interface PickedFile {
  readonly name: string;
  readonly type: string;
  readonly size: number;
}

export interface UppyDialogOptions {
  readonly maxNumberOfFiles: number;
  readonly maxFileSize: number;
  readonly allowedFileTypes?: readonly string[];
  readonly note?: string;
  readonly presign: (file: PickedFile) => Promise<PresignedTarget>;
  readonly attach: (objectKey: string, file: PickedFile) => Promise<void>;
  readonly onCompleted: () => void;
  readonly onAttachError: (message: string) => void;
}

export async function openUppyDialog(options: UppyDialogOptions): Promise<void> {
  const [{ default: Uppy }, { default: AwsS3 }, { default: Dashboard }, { default: koKr }] =
    await Promise.all([
      import('@uppy/core'),
      import('@uppy/aws-s3'),
      import('@uppy/dashboard'),
      import('@uppy/locales/lib/ko_KR'),
    ]);

  const uppy = new Uppy({
    locale: koKr,
    restrictions: {
      maxNumberOfFiles: options.maxNumberOfFiles,
      maxFileSize: options.maxFileSize,
      allowedFileTypes: options.allowedFileTypes ? [...options.allowedFileTypes] : null,
    },
  });

  uppy.use(AwsS3, {
    shouldUseMultipart: false,
    async getUploadParameters(file) {
      const target = await options.presign(toPicked(file));
      uppy.setFileMeta(file.id, { objectKey: target.objectKey });
      return {
        method: 'PUT',
        url: target.url,
        fields: {},
        headers: { 'content-type': toPicked(file).type },
      };
    },
  });

  uppy.use(Dashboard, {
    inline: false,
    theme: 'auto',
    closeAfterFinish: true,
    closeModalOnClickOutside: true,
    proudlyDisplayPoweredByUppy: false,
    note: options.note,
  });

  uppy.on('complete', (result) => {
    void (async () => {
      for (const file of result.successful ?? []) {
        try {
          await options.attach(String(file.meta['objectKey']), toPicked(file));
        } catch (error) {
          options.onAttachError(
            error instanceof Error ? error.message : '파일을 붙이지 못했습니다.',
          );
        }
      }
      options.onCompleted();
    })();
  });

  uppy.on('dashboard:modal-closed', () => {
    setTimeout(() => uppy.destroy(), 0);
  });

  (uppy.getPlugin('Dashboard') as unknown as { openModal(): void }).openModal();
}

function toPicked(file: {
  name?: string | null;
  type?: string | null;
  size?: number | null;
}): PickedFile {
  return {
    name: file.name ?? 'file',
    type: file.type || 'application/octet-stream',
    size: file.size ?? 0,
  };
}
