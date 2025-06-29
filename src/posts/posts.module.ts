import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entity/post.entity';
import { UploadModule } from 'src/upload/upload.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), UploadModule, CommonModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
