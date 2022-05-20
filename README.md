## 创建文件

```js
nest g resouce user
```

## 分析 package.json

### bcryptjs

作用：加密（加密 password）
用法：

```js
// xxx.entity.ts
import * as bcrypt from 'bcryptjs';
@BeforeInsert()
  async encryptPwd() {
    if (!this.password) return;
    this.password = await bcrypt.hashSync(this.password, 10);
  }
```

### class-transformer&class-validator

作用：对请求接口的入参进行验证和转换的前置操作，验证好了我才会将内容给到路由对应的方法中去，失败了就进入异常过滤器中。
用法：在 dto 添加，main.ts 中全局注册一下管道 ValidationPipe

```js
// main.ts
app.useGlobalPipes(new ValidationPipe());

// xxx.dto.ts
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
export class CreatePostDto {
  @ApiProperty({ description: '文章标题' })
  @IsNotEmpty({ message: '文章标题必填' })
  readonly title: string;

  @IsNumber()
  @ApiProperty({ description: '文章类型' })
  readonly type: number;
}
```

service 和 controller 中引入方法中的参数

### passport.js

身份认证的 Nodejs 中间件：Passport.js,它功能单一，只能做登录验证，但非常强大，支持本地账号验证和第三方账号登录验证（OAuth 和 OpenID 等)

#### local 本地认证

```js
npm install @nestjs/passport passport passport-local
npm install @types/passport @types/passport-local
```

用法：创建 auth 模块，创建一个 local.strategy.ts 文件来写本地验证策略代码

```js
import { compareSync } from 'bcryptjs';
import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { IStrategyOptions, Strategy } from 'passport-local';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

export class LocalStorage extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    // 如果不是username、password， 在constructor中配置
    super({
      usernameField: 'username',
      passwordField: 'password',
    } as IStrategyOptions);
  }

  async validate(username: string, password: string) {
    // 因为密码是加密后的，没办法直接对比用户名密码，只能先根据用户名查出用户，再比对密码
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username=:username', { username })
      .getOne();

    if (!user) {
      throw new BadRequestException('用户名不正确！');
    }

    if (!compareSync(password, user.password)) {
      throw new BadRequestException('密码错误！');
    }

    return user;
  }
}
```

代码分析：定义一个 LocalStorage 继承到@nestjs/passport 提供的 PassportStrategy 类，接受参数，Strategy（策略）和别名（默认 local）。接着调用 super 传递策略参数， 这里如果传入的就是 username 和 password，可以不用写，使用默认的参数就是，比如我们是用邮箱进行验证，传入的参数是 email, 那 usernameField 对应的 value 就是 email。validate 是 LocalStrategy 的内置方法， 主要就是现实了用户查询以及密码对比，因为存的密码是加密后的，没办法直接对比用户名密码，只能先根据用户名查出用户，再比对密码。

ps:这里还有一个注意点， 通过 addSelect 添加 password 查询， 否则无法做密码对比。

#### jwt 生成 token

用法：注册一下 JwtModule, 在 auth.module.ts 中

```js
import { JwtModule } from '@nestjs/jwt';
const jwtModule = JwtModule.register({
    secret:"test123456", // 写死
    signOptions: { expiresIn: '4h' },
})

@Module({
  imports: [
    ...
    jwtModule,
  ],
  exports: [jwtModule],
})
```

取出 token

```js
//jwt.strategy.ts
```

三种方案：
fromHeader： 在 Http 请求头中查找 JWT
fromBodyField: 在请求的 Body 字段中查找 JWT
fromAuthHeaderAsBearerToken：在授权标头带有 Bearer 方案中查找 JWT

auth.module.ts 中注入 JwtStorage。在 Controller 中使用绑定 jwt 授权守卫

```js
// user.controller.ts
@ApiOperation({ summary: '获取用户信息' })
@ApiBearerAuth() // swagger文档设置token
@UseGuards(AuthGuard('jwt'))
@Get()
getUserInfo(@Req() req) {
    return req.user;
}
```

## 文件目录

src
├── app.controller.spec.ts 针对控制器的单元测试
├── app.controller.ts 单个路由的基本控制器(Controller)
├── app.module.ts 应用程序的根模块(Module)
├── app.service.ts 具有单一方法的基本服务(Service)
├── main.ts 应用程序的入口文件，它使用核心函数 NestFactory 来创建 Nest 应用程序的实例。

## 接口

文档：
/user/getUserInfo get 根据 token 获取用户信息
/auth/login post 登录，用户名和密码，重新生成 token
/auth/register post 注册，用户名和密码，生成 token
/user/delete get 参数 id 删除用户
/user/update post 参数 id 用户密码 更新用户
