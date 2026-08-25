import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

/**
 * 노드뷰(React 컴포넌트)와 떨어져 있는 스키마 정의. 이유는 `image.schema.ts` 참고.
 */

/**
 * `common` 언어 셋(약 35개: js, ts, python, java, sql, bash, json, ...)만 등록한다.
 * 전체 190여 개를 등록하면 번들이 크게 늘어나므로 자주 쓰는 언어로 제한한다.
 */
export const lowlight = createLowlight(common);

export const DEFAULT_CODE_LANGUAGE = 'plaintext';

/**
 * 노드뷰가 붙지 않은 코드 블록. 편집기·뷰어·서버 렌더링이 이 위에 각자의 노드뷰를 얹는다.
 */
export const baseCodeBlock = CodeBlockLowlight.configure({
  lowlight,
  defaultLanguage: DEFAULT_CODE_LANGUAGE,
});
