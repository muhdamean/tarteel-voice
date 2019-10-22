import aws from 'aws-sdk';
import TARTEEL_API from '../../config/apiConstants';

const BUCKETNAME = 'tarteel-data';
const REGION = 'us-west-2';
const MIN_HASH_NUMBER = 1000000000; // Enforce non-zero start for hash
const MAX_HASH_DIGITS = 9000000000; // Number of zeros = number of digits

const getRandomHash = () => {
  return String(Math.floor(MIN_HASH_NUMBER + Math.random() * MAX_HASH_DIGITS));
};

export const initAWS = () => {
  aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID_S3,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_S3,
    region: REGION
  });
};

const s3 = new aws.S3({
  params: { Bucket: BUCKETNAME}
});

const sendRecording = (stream, surah, ayah) => {
  console.log('Sending new recording:');
  console.log(`Surah: ${surah}, Ayah: ${ayah}`);
  const body = new FormData();
  const hash = getRandomHash();
  body.append('file', stream, surah + '_' + ayah + '_' + hash + '.wav');
  body.append('surah_num', String(surah));
  body.append('ayah_num', String(ayah));
  body.append('hash_string', hash);
  body.append('session_id', 'transcribe-server');
  body.append('recitation_mode', 'continuous');

  return fetch(`${TARTEEL_API}/v1/recordings/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.TARTEEL_API_KEY}`
    },
    mode: 'cors',
    body,
    credentials: 'include'
  }).then((resp) => {
    console.log(`sendRecording response ${resp.json()}`);
  });
};

const upload = (stream, filename) => {
  var params = {
    Bucket: BUCKETNAME,
    Key: `${filename}_${getRandomHash()}.wav`,
    Body: stream,
  };
  return s3.upload(params).promise().then((data) => {
    console.log('Uploaded');
    return data.Location
  });
};

export default sendRecording;