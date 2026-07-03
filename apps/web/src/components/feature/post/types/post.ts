export enum PostType {
  SHORT = 'SHORT',
  LONG = 'LONG',
  QUESTION = 'QUESTION',
}

export enum PostScope {
  PUBLIC = 'PUBLIC',
  WORKSPACE = 'WORKSPACE',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export function isPublicPublishedPost(scope?: PostScope, status?: PostStatus) {
  return (
    (scope ?? PostScope.PUBLIC) === PostScope.PUBLIC &&
    (status ?? PostStatus.PUBLISHED) === PostStatus.PUBLISHED
  );
}
