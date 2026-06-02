ALTER TABLE `user`
  MODIFY `password_hash` VARCHAR(255) NULL,
  ADD COLUMN `signup_method` VARCHAR(20) NOT NULL DEFAULT 'EMAIL' AFTER `password_hash`,
  MODIFY `gender` VARCHAR(10) NULL,
  MODIFY `phone_number` VARCHAR(30) NULL;
