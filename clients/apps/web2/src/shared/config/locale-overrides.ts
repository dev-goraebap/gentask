/**
 * Astryx 의 ko-KR 카탈로그에서 빠진 문구를 채운다.
 *
 * 353개 중 106개가 비어 있고 그 자리는 영어로 나온다. 우리가 실제로 쓰는 컴포넌트의 것만
 * 채운다. 라이브러리가 채우면 여기서 지운다.
 */
export const LOCALE_OVERRIDES = {
  'ko-KR': {
    '@astryx.fileInput.placeholder': '파일 고르기',
    '@astryx.fileInput.dropHint': '여기에 파일을 놓습니다',
    '@astryx.fileInput.fileSelected': '파일 하나 고름: {fileName}',
    '@astryx.fileInput.filesSelected': '파일 {count}개 고름',
    '@astryx.fileInput.errorInvalidType': '"{fileName}" 은 받지 않는 형식입니다',
    '@astryx.fileInput.errorMaxFiles': '파일은 {maxFiles}개까지 받습니다',
    '@astryx.fileInput.errorMaxSize': '"{fileName}" 이 {maxSize} 를 넘습니다',
  },
} as const;
