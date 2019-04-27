import aws from 'aws-sdk';

export const initAWS = () => {
  aws.config.update({
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: 'us-east-1'
  });
}

const s3 = new aws.S3();

const upload = (stream, filename) => {
  var params = {
    Bucket: 'recognition-recordings',
    Key: `${filename}.wav`,
    Body: stream,
  };
  return s3.upload(params).promise().then((data) => {
    return data.Location
  });
}

export default upload;