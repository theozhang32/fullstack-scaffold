import { Migration } from '@mikro-orm/migrations'
import { SqlitePlatform } from '@mikro-orm/sqlite'

export class Migration20260914080201 extends Migration {
  override name = 'Migration20260914080201'

  override up(): void | Promise<void> {
    if (this.driver.getPlatform() instanceof SqlitePlatform) {
      this.addSql(`create table \`user\` (\`id\` integer not null primary key autoincrement, \`username\` text not null, \`password_hash\` text null, \`display_name\` text not null, \`role\` text check (\`role\` in ('ADMIN', 'USER')) not null, \`enabled\` integer not null default true, \`remark\` text null, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`created_by\` text not null);`)
      this.addSql(`create unique index \`user_username_unique\` on \`user\` (\`username\`);`)
      return
    }

    // mysql（及其他兼容方言）
    this.addSql(`create table \`user\` (\`id\` bigint unsigned not null auto_increment primary key, \`username\` varchar(64) not null, \`password_hash\` varchar(255) null, \`display_name\` varchar(64) not null, \`role\` enum('ADMIN', 'USER') not null, \`enabled\` tinyint(1) not null default true, \`remark\` text null, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`created_by\` varchar(64) not null) default character set utf8mb4 engine = InnoDB;`)
    this.addSql(`alter table \`user\` add unique \`user_username_unique\`(\`username\`);`)
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`user\`;`)
  }
}
