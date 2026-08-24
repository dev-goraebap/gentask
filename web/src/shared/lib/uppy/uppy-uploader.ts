/** presign 이 돌려주는 올리기 자리입니다. 서버 응답(PresignedUpload)과 같은 모양입니다. */
export interface PresignedTarget {
  readonly objectKey: string;
  readonly url: string;
}

/** 고른 파일에서 서버가 물어보는 것만 추립니다. */
export interface PickedFile {
  readonly name: string;
  readonly type: string;
  readonly size: number;
}

export interface UppyDialogOptions {
  /** 이번에 더 고를 수 있는 개수입니다. 상한에서 이미 붙인 수를 뺀 값을 넘깁니다. */
  readonly maxNumberOfFiles: number;
  readonly maxFileSize: number;
  readonly allowedFileTypes?: readonly string[];
  /** 대화 하단의 안내문입니다. 제한을 여기 적어 고르기 전에 보이게 합니다. */
  readonly note?: string;
  readonly presign: (file: PickedFile) => Promise<PresignedTarget>;
  /** 올리기가 끝난 파일의 확정입니다. 서버가 보관소의 실측으로 다시 검증합니다. */
  readonly attach: (objectKey: string, file: PickedFile) => Promise<void>;
  /** 고른 파일 전부가 확정까지 끝난 뒤 한 번 불립니다. 실패가 섞여도 불립니다. */
  readonly onCompleted: () => void;
  /** 확정 실패의 알림입니다. 대화가 이미 닫혔을 수 있어 화면의 알림 수단을 받습니다. */
  readonly onAttachError: (message: string) => void;
}

/**
 * presigned PUT 정석 경로의 업로드 대화를 엽니다. presign → 보관소로 직접 PUT → 확정.
 *
 * uppy 는 여는 순간에 동적 임포트합니다. 정적으로 두면 셸이 shared/lib 배럴을 즉시
 * 임포트하는 경로를 타고 초기 번들에 들어갑니다(01-dev-environment.md 7절의 함정과
 * 같은 자리). 업로드는 클릭 뒤의 일이라 그때 받아도 늦지 않습니다.
 *
 * 인스턴스는 열 때마다 만들고 닫힐 때 버립니다. 남겨 두면 이전에 고른 파일과 제한이
 * 다음 열기에 남고, 개수 제한(남은 자리)은 열 때마다 다릅니다.
 *
 * 서버 렌더에서 부르지 않습니다. 여는 조작이 클릭이라 브라우저에서만 불립니다.
 */
export async function openUppyDialog(options: UppyDialogOptions): Promise<void> {
  const [{ default: Uppy }, { default: AwsS3 }, { default: Dashboard }, { default: koKr }] = await Promise.all([
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
        // presign 서명에 Content-Type 이 들어 있어 같은 값을 보내야 한다.
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
          options.onAttachError(error instanceof Error ? error.message : '파일을 붙이지 못했습니다.');
        }
      }
      options.onCompleted();
    })();
  });

  uppy.on('dashboard:modal-closed', () => {
    // 닫히는 프레임 안에서 부수면 대시보드의 정리 코드가 자기 인스턴스를 잃는다.
    setTimeout(() => uppy.destroy(), 0);
  });

  (uppy.getPlugin('Dashboard') as unknown as { openModal(): void }).openModal();
}

function toPicked(file: { name?: string | null; type?: string | null; size?: number | null }): PickedFile {
  return {
    name: file.name ?? 'file',
    type: file.type || 'application/octet-stream',
    size: file.size ?? 0,
  };
}
