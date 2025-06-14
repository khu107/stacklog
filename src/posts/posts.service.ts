import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './entity/post.entity';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly uploadService: UploadService,
  ) {}

  async create(createPostDto: CreatePostDto, userId: string): Promise<Post> {
    // 슬러그 생성 (제목을 기반으로)
    const slug = await this.generateUniqueSlug(createPostDto.title);

    // 발행일 설정 (PUBLISHED 상태인 경우에만)
    const publishedAt =
      createPostDto.status === PostStatus.PUBLISHED ? new Date() : undefined;

    // content에서 temp 이미지들을 post 폴더로 이동
    let processedContent = createPostDto.content;
    if (processedContent) {
      processedContent = this.moveContentImages(processedContent);
    }

    // thumbnail이 temp 파일이면 이동
    let processedThumbnail = createPostDto.thumbnail;
    if (processedThumbnail && processedThumbnail.includes('/temp/')) {
      const tempFilename = processedThumbnail.split('/temp/')[1];
      const postFilename = this.uploadService.moveToPosts(tempFilename);
      processedThumbnail = this.uploadService.getPostUrl(postFilename);
    }

    const post = this.postRepository.create({
      ...createPostDto,
      content: processedContent,
      thumbnail: processedThumbnail,
      slug,
      userId: Number(userId),
      ...(publishedAt && { publishedAt }),
    });
    const savedPost = await this.postRepository.save(post);

    return this.findOne(savedPost.slug, userId);
  }

  async findAll(): Promise<Post[]> {
    return this.postRepository.find({
      where: {
        status: PostStatus.PUBLISHED,
        isPrivate: false,
      },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        summary: true,
        slug: true,
        thumbnail: true,
        publishedAt: true,
        createdAt: true,
        author: {
          id: true,
          displayName: true,
          idname: true,
          avatarUrl: true,
        },
      },
      order: {
        publishedAt: 'DESC',
      },
    });
  }

  async findOne(slug: string, userId?: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { slug },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        slug: true,
        thumbnail: true,
        publishedAt: true,
        createdAt: true,
        status: true,
        isPrivate: true,
        userId: true,
        author: {
          id: true,
          displayName: true,
          idname: true,
          avatarUrl: true,
        },
      },
    });

    if (!post) {
      throw new NotFoundException('포스트를 찾을 수 없습니다.');
    }

    // 발행되지 않은 글은 작성자만
    if (post.status !== PostStatus.PUBLISHED) {
      if (!userId || post.userId !== Number(userId)) {
        throw new NotFoundException('포스트를 찾을 수 없습니다.');
      }
    }

    // 비공개 글은 작성자만
    if (post.isPrivate) {
      if (!userId || post.userId !== Number(userId)) {
        throw new NotFoundException('포스트를 찾을 수 없습니다.');
      }
    }

    return post;
  }

  async findMyPosts(userId: number): Promise<Post[]> {
    return this.postRepository.find({
      where: {
        userId,
        status: PostStatus.PUBLISHED, // 발행된 글만
      },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        summary: true,
        slug: true,
        thumbnail: true,
        publishedAt: true,
        createdAt: true,
        isPrivate: true, // 공개/비공개 구분 위해
        author: {
          id: true,
          displayName: true,
          idname: true,
          avatarUrl: true,
        },
      },
      order: {
        publishedAt: 'DESC',
      },
    });
  }

  async findMyDrafts(userId: number): Promise<Post[]> {
    return this.postRepository.find({
      where: {
        userId,
        status: PostStatus.DRAFT, // 임시저장 글만
      },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        summary: true,
        slug: true,
        thumbnail: true,
        createdAt: true,
        updatedAt: true,
        author: {
          id: true,
          displayName: true,
          idname: true,
          avatarUrl: true,
        },
      },
      order: {
        updatedAt: 'DESC', // 최근 수정순
      },
    });
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  async remove(id: number, userId: string): Promise<void> {
    // 포스트 조회 (작성자 확인용)
    const post = await this.postRepository.findOne({
      where: { id },
      select: ['id', 'userId', 'content', 'thumbnail'],
    });

    if (!post) {
      throw new NotFoundException('포스트를 찾을 수 없습니다.');
    }

    // 작성자 본인만 삭제 가능
    if (post.userId !== Number(userId)) {
      throw new BadRequestException(
        '본인이 작성한 포스트만 삭제할 수 있습니다.',
      );
    }

    try {
      // 포스트와 관련된 이미지 파일들 삭제
      await this.cleanupPostImages(post);

      // 포스트 삭제
      await this.postRepository.delete(id);
    } catch (error) {
      console.error('포스트 삭제 중 오류:', error);
      throw new BadRequestException('포스트 삭제 중 오류가 발생했습니다.');
    }
  }

  // 포스트 관련 이미지 파일들 정리 (private 메서드로 추가)
  private async cleanupPostImages(post: {
    content?: string;
    thumbnail?: string;
  }): Promise<void> {
    const imagesToDelete: string[] = [];

    // 썸네일 이미지 수집
    if (post.thumbnail && post.thumbnail.includes('/post/')) {
      const filename = post.thumbnail.split('/post/')[1];
      if (filename) {
        imagesToDelete.push(filename);
      }
    }

    // 콘텐츠 내 이미지들 수집
    if (post.content) {
      // 마크다운 이미지 패턴: ![alt](url)
      const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      let match;

      while ((match = imageRegex.exec(post.content)) !== null) {
        const imageUrl = match[2];
        if (imageUrl.includes('/post/')) {
          const filename = imageUrl.split('/post/')[1];
          if (filename) {
            imagesToDelete.push(filename);
          }
        }
      }
    }

    // 수집된 이미지 파일들 삭제
    for (const filename of imagesToDelete) {
      try {
        this.uploadService.deleteFile(filename, 'post');
      } catch (error) {
        console.error('이미지 삭제 실패:', filename, error);
        // 이미지 삭제 실패해도 포스트 삭제는 진행
      }
    }
  }
  // content에서 temp 이미지들을 post 폴더로 이동
  private moveContentImages(content: string): string {
    // 마크다운 이미지 패턴: ![alt](/temp/filename)
    const tempImageRegex = /!\[([^\]]*)\]\(\/temp\/([^)]+)\)/g;

    return content.replace(tempImageRegex, (match, alt, filename) => {
      try {
        const postFilename = this.uploadService.moveToPosts(filename);
        const postUrl = this.uploadService.getPostUrl(postFilename);
        return `![${alt}](${postUrl})`;
      } catch (error) {
        console.error('이미지 이동 실패:', filename, error);
        return match;
      }
    });
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    // 중복 체크
    while (await this.postRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
