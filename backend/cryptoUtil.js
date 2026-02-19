const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

/**
 * Encrypts QR image (Base64) using AES-256
 */
exports.encrypt = (data) => {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  return {
    cipherText: iv.toString("base64") + ":" + encrypted,
    key: key.toString("base64"),
  };
};

/**
 * Decrypts encrypted QR image
 */
exports.decrypt = (cipherText, key) => {
  const [ivBase64, encryptedData] = cipherText.split(":");

  const iv = Buffer.from(ivBase64, "base64");
  const secretKey = Buffer.from(key, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, secretKey, iv);
  let decrypted = decipher.update(encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
