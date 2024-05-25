const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const crypto = require("crypto");

const bucketName = process.env.AWS_BUCKET_NAME;
const bucketRegion = process.env.AWS_BUCKET_REGION;
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

const s3Client = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});

const uploadFile = async (file, folder) => {
  const fileName = `${folder}/${crypto.randomBytes(20).toString("hex")}-${
    file.originalname
  }`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });
  const response = await s3Client.send(command);
  return {
    fileName,
    response,
  };
};

const deleteFile = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const response = await s3Client.send(command);
  return response;
};

const getSignedUrlFromKey = async (key) => {
  if (!key) return null;
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  const signedUrl = await getSignedUrl(s3Client, command);
  return signedUrl;
};

module.exports = { s3Client, getSignedUrlFromKey, uploadFile, deleteFile };
