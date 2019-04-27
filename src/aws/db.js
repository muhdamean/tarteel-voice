import AWS from 'aws-sdk';
import humps from "humps";

const dynamo = new AWS.DynamoDB.DocumentClient({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: 'us-east-1'
});

const TABLE_NAME = 'recognition-records';

export const saveItem = (item) => {
  const params = {
    TableName: TABLE_NAME,
    Item: humps.decamelizeKeys(item)
  };

  return dynamo.put(params).promise().then(() => {
    return item;
  });
};
