import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly publicPath = join(process.cwd(), 'public');
  private readonly tempPath = join(this.publicPath, 'temp');
  private readonly avatarPath = join(this.publicPath, 'avatar');
  private readonly postPath = join(this.publicPath, 'post');

  constructor() {
    // 폴더가 없으면 생성
    if (!existsSync(this.publicPath)) {
      mkdirSync(this.publicPath, { recursive: true });
    }
    if (!existsSync(this.tempPath)) {
      mkdirSync(this.tempPath, { recursive: true });
    }
    if (!existsSync(this.avatarPath)) {
      mkdirSync(this.avatarPath, { recursive: true });
    }
    if (!existsSync(this.postPath)) {
      mkdirSync(this.postPath, { recursive: true });
    }
  }

  // temp에서 avatar로 파일 이동
  moveToAvatar(tempFilename: string): string {
    const tempFilePath = join(this.tempPath, tempFilename);
    const avatarFilename = tempFilename.replace('temp-', 'avatar-');
    const avatarFilePath = join(this.avatarPath, avatarFilename);

    renameSync(tempFilePath, avatarFilePath);
    return avatarFilename;
  }

  moveToPosts(tempFilename: string): string {
    const tempFilePath = join(this.tempPath, tempFilename);
    const postFilename = tempFilename.replace('temp-', 'post-');
    const postFilePath = join(this.postPath, postFilename);

    renameSync(tempFilePath, postFilePath);
    return postFilename;
  }

  deleteFile(filename: string, folder: 'temp' | 'avatar' | 'post'): void {
    try {
      let filePath: string;

      switch (folder) {
        case 'temp':
          filePath = join(this.tempPath, filename);
          break;
        case 'avatar':
          filePath = join(this.avatarPath, filename);
          break;
        case 'post':
          filePath = join(this.postPath, filename);
          break;
      }

      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      console.error('파일 삭제 실패:', error);
    }
  }

  // 아바타 URL 생성
  getAvatarUrl(filename: string): string {
    return `/avatar/${filename}`;
  }

  getPostUrl(filename: string): string {
    return `/post/${filename}`;
  }
}
