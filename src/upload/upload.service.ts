import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly publicPath = join(process.cwd(), 'public');
  private readonly tempPath = join(this.publicPath, 'temp');
  private readonly avatarPath = join(this.publicPath, 'avatar');

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
  }

  // temp에서 avatar로 파일 이동
  moveToAvatar(tempFilename: string): string {
    const tempFilePath = join(this.tempPath, tempFilename);
    const avatarFilename = tempFilename.replace('temp-', 'avatar-');
    const avatarFilePath = join(this.avatarPath, avatarFilename);

    renameSync(tempFilePath, avatarFilePath);
    return avatarFilename;
  }

  // 파일 삭제
  deleteFile(filename: string, folder: 'temp' | 'avatar'): void {
    try {
      const filePath =
        folder === 'temp'
          ? join(this.tempPath, filename)
          : join(this.avatarPath, filename);

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
}
