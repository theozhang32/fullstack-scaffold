import { Migration } from '@mikro-orm/migrations'

export class Migration20260914080201 extends Migration {
  override name = 'Migration20260914080201'

  override up(): void | Promise<void> {
    this.addSql(`create table \`user\` (\`id\` integer not null primary key autoincrement, \`username\` text not null, \`password_hash\` text null, \`display_name\` text not null, \`role\` text check (\`role\` in ('ADMIN', 'USER')) not null, \`enabled\` integer not null default true, \`remark\` text null, \`created_at\` datetime not null, \`updated_at\` datetime not null, \`created_by\` text not null);`)
    this.addSql(`create unique index \`user_username_unique\` on \`user\` (\`username\`);`)
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists \`user\`;`)
  }
}
