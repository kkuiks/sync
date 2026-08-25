import { describe, expect, it } from 'vitest';

import { renderPostBodyHtml } from './renderPostBodyHtml';

function content(doc: unknown, media: never[] = []) {
  return { json: JSON.stringify(doc), media };
}

describe('renderPostBodyHtml', () => {
  it('본문 텍스트를 서버에서 마크업으로 그린다', () => {
    const html = renderPostBodyHtml(
      content({
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: '캐시 전략' }],
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Cache Aside 는 읽기 중심 부하에 맞는다.' },
            ],
          },
          {
            type: 'codeBlock',
            attrs: { language: 'java' },
            content: [{ type: 'text', text: 'var cache = new Cache();' }],
          },
        ],
      }),
    );

    expect(html).toContain('캐시 전략');
    expect(html).toContain('Cache Aside 는 읽기 중심 부하에 맞는다.');
    expect(html).toContain('var cache = new Cache();');
    expect(html).toContain('<h2>');
  });

  it('표와 할 일 목록 같은 커스텀 노드도 텍스트를 남긴다', () => {
    const html = renderPostBodyHtml(
      content({
        type: 'doc',
        content: [
          {
            type: 'taskList',
            content: [
              {
                type: 'taskItem',
                attrs: { checked: false },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '벤치마크 다시 돌리기' }],
                  },
                ],
              },
            ],
          },
        ],
      }),
    );

    expect(html).toContain('벤치마크 다시 돌리기');
  });

  it('이미지·수식·표를 함께 담은 본문도 끝까지 그린다', () => {
    const html = renderPostBodyHtml({
      json: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'image', attrs: { mediaId: '7' } },
          { type: 'blockMath', attrs: { latex: 'E = mc^2' } },
          {
            type: 'table',
            content: [
              {
                type: 'tableRow',
                content: [
                  {
                    type: 'tableHeader',
                    attrs: { colspan: 1, rowspan: 1 },
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: '지연시간' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
      media: [
        {
          id: 7,
          url: 'https://cdn.example.com/7.png',
          fileName: '7.png',
          fileSize: 100,
          mediaType: 'image/png',
        },
      ],
    });

    expect(html).toContain('https://cdn.example.com/7.png');
    expect(html).toContain('지연시간');
    expect(html).toContain('E = mc^2');
  });

  it('실행 가능한 스킴의 링크는 주소를 지운다', () => {
    const html = renderPostBodyHtml(
      content({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '누르지 마시오',
                marks: [
                  { type: 'link', attrs: { href: 'javascript:alert(1)' } },
                ],
              },
            ],
          },
        ],
      }),
    );

    expect(html).toContain('누르지 마시오');
    expect(html).not.toContain('javascript:');
  });

  it('일반 링크는 그대로 둔다', () => {
    const html = renderPostBodyHtml(
      content({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '문서',
                marks: [
                  { type: 'link', attrs: { href: 'https://example.com/docs' } },
                ],
              },
            ],
          },
        ],
      }),
    );

    expect(html).toContain('https://example.com/docs');
  });

  it('본문이 없으면 null 을 돌려준다', () => {
    expect(renderPostBodyHtml(undefined)).toBeNull();
    expect(renderPostBodyHtml({ json: null, media: [] })).toBeNull();
  });
});
