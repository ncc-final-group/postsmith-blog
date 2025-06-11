SELECT `blog_plugins`.`blog_id`,
    `blog_plugins`.`plugin_id`,
    `blog_plugins`.`plugins_setting`
FROM `postsmith`.`blog_plugins`;
SELECT `blog_themes`.`id`,
    `blog_themes`.`blog_id`,
    `blog_themes`.`theme_id`,
    `blog_themes`.`theme_setting`,
    `blog_themes`.`is_active`
FROM `postsmith`.`blog_themes`;
SELECT `blogs`.`id`,
    `blogs`.`user_id`,
    `blogs`.`name`,
    `blogs`.`address`,
    `blogs`.`description`,
    `blogs`.`logo_image`,
    `blogs`.`created_at`,
    `blogs`.`updated_at`
FROM `postsmith`.`blogs`;
SELECT `categories`.`id`,
    `categories`.`blog_id`,
    `categories`.`category_id`,
    `categories`.`name`,
    `categories`.`sequence`,
    `categories`.`description`
FROM `postsmith`.`categories`;
SELECT `content_tags`.`content_id`,
    `content_tags`.`tag_id`
FROM `postsmith`.`content_tags`;
SELECT `content_views`.`id`,
    `content_views`.`content_id`,
    `content_views`.`views_count`,
    `content_views`.`created_on`
FROM `postsmith`.`content_views`;
SELECT `content_visits`.`id`,
    `content_visits`.`content_id`,
    `content_visits`.`user_id`,
    `content_visits`.`ip`,
    `content_visits`.`created_at`
FROM `postsmith`.`content_visits`;
SELECT `contents`.`id`,
    `contents`.`category_id`,
    `contents`.`blog_id`,
    `contents`.`sequence`,
    `contents`.`type`,
    `contents`.`title`,
    `contents`.`content_html`,
    `contents`.`content_plain`,
    `contents`.`is_temp`,
    `contents`.`is_public`,
    `contents`.`likes`,
    `contents`.`created_at`,
    `contents`.`updated_at`
FROM `postsmith`.`contents`;

SELECT `notifications`.`id`,
    `notifications`.`user_id`,
    `notifications`.`type`,
    `notifications`.`is_read`,
    `notifications`.`created_at`
FROM `postsmith`.`notifications`;
SELECT `plugins`.`id`,
    `plugins`.`name`,
    `plugins`.`cover_image`,
    `plugins`.`image`,
    `plugins`.`description`,
    `plugins`.`author`,
    `plugins`.`author_link`,
    `plugins`.`plugins`,
    `plugins`.`options`
FROM `postsmith`.`plugins`;
SELECT `replies`.`id`,
    `replies`.`user_id`,
    `replies`.`content_id`,
    `replies`.`reply_id`,
    `replies`.`content`,
    `replies`.`created_at`,
    `replies`.`deleted_at`
FROM `postsmith`.`replies`;
SELECT `subscription`.`subscriber_id`,
    `subscription`.`blogger_id`,
    `subscription`.`created_at`
FROM `postsmith`.`subscription`;
SELECT `tags`.`id`,
    `tags`.`type`,
    `tags`.`name`
FROM `postsmith`.`tags`;
SELECT `theme_tags`.`theme_id`,
    `theme_tags`.`tag_id`
FROM `postsmith`.`theme_tags`;
SELECT `themes`.`id`,
    `themes`.`name`,
    `themes`.`cover_image`,
    `themes`.`image`,
    `themes`.`description`,
    `themes`.`author`,
    `themes`.`author_link`,
    `themes`.`theme`
FROM `postsmith`.`themes`;
SELECT `uploads`.`id`,
    `uploads`.`blog_id`,
    `uploads`.`uri`,
    `uploads`.`filename`,
    `uploads`.`created_at`
FROM `postsmith`.`uploads`;
SELECT `users`.`id`,
    `users`.`uuid`,
    `users`.`email`,
    `users`.`password`,
    `users`.`provider`,
    `users`.`role`,
    `users`.`nickname`,
    `users`.`profile_image`,
    `users`.`description`,
    `users`.`created_at`,
    `users`.`updated_at`
FROM `postsmith`.`users`;
