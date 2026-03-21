export class CommentAuthorDto {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
  avatarColor?: string;
}

export class CommentResponseDto {
  id: number;
  content: string;
  createdAt: Date;
  author: CommentAuthorDto;
}