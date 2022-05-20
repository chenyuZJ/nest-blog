import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ApiProperty } from '@nestjs/swagger';
import { PostsEntity } from 'src/posts/posts.entity';
@Entity('user') // 将为此类模型创建数据库表
export class User {
  @ApiProperty({ description: '用户id' })
  @PrimaryGeneratedColumn() //  uuid 列自动生成
  id: string;

  @Column({ length: 100, nullable: true }) // 添加数据库列
  username: string;

  @Column({ length: 100, nullable: true })
  nickname: string;

  @Exclude() // 不返回password字段
  @Column({ select: false, nullable: true })
  password: string;

  @Column({ default: null })
  avatar: string;

  @Column({ default: null })
  email: string;

  @Column({ default: null })
  openid: string;

  @Column('enum', { enum: ['root', 'author', 'visitor'], default: 'visitor' })
  role: string;

  @OneToMany(() => PostsEntity, (post) => post.author) // 创建一个多对一or一对多的关系
  posts: PostsEntity[];

  @Column({ default: null })
  token: string;

  @Column({
    name: 'create_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createTime: Date;

  @Exclude()
  @Column({
    name: 'update_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updateTime: Date;

  @BeforeInsert()
  async encryptPwd() {
    if (!this.password) return;
    this.password = await bcrypt.hashSync(this.password, 10);
  }
}
