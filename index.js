const AWS = require("aws-sdk");

const checkIfEmailSentAlready = async (
  dynamoDbClient,
  emailTrackingDynamoDBTable,
  userEmail
) => {
  const params = {
    TableName: emailTrackingDynamoDBTable,
    Key: {
      email: userEmail,
    },
  };
  const data = await dynamoDbClient.get(params).promise();
  console.log("Data:", data);
  if (data.Item) {
    return true;
  } else {
    return false;
  }
};

const logEmailSentToDynamoDB = async (
  dynamoDbClient,
  emailTrackingDynamoDBTable,
  userEmail
) => {
  const params = {
    TableName: emailTrackingDynamoDBTable,
    Item: {
      email: userEmail,
    },
  };
  const data = await dynamoDbClient.put(params).promise();
  console.log("Data:", data);
};

exports.handler = async (event, context, callback) => {
  console.log("Received event:", JSON.stringify(event, null, 4));
  const emailTrackingDynamoDBTable = process.env.EmailTrackingDynamoDBTable;
  const emailTrackingDynamoDBRegion =
    process.env.EmailTrackingDynamoDBRegion || "us-west-2";
  const domainEnvironment = process.env.DomainEnvironment || "demo";

  console.log("Setting AWS region to:", emailTrackingDynamoDBRegion);
  // Set the region
  AWS.config.update({ region: emailTrackingDynamoDBRegion });

  const dynamoDbClient = new AWS.DynamoDB.DocumentClient({
    region: emailTrackingDynamoDBRegion,
  });

  const message = event.Records[0].Sns.Message;
  console.log("Message received from SNS:", message);

  const parsedMessage = JSON.parse(message);
  console.log("Parsed message:", parsedMessage);
  const messageType = parsedMessage.message_type;
  console.log("Message type:", messageType);
  const userToken = parsedMessage.userToken;
  console.log("User token:", userToken);
  const userEmail = parsedMessage.username;
  console.log("Username:", userEmail);
  const first_name = parsedMessage.first_name;
  console.log("First name:", first_name);
  const last_name = parsedMessage.last_name;
  console.log("Last name:", last_name);

  const emailAlreadySent = await checkIfEmailSentAlready(
    dynamoDbClient,
    emailTrackingDynamoDBTable,
    userEmail
  );

  if (!emailAlreadySent) {
    // Send email using AWS SES
    console.log(
      "Email is not already sent to the user: " + userEmail + ". Trying to send"
    );
    const ses = new AWS.SES();
    const params = {
      Destination: {
        ToAddresses: [userEmail],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `<p>Hello ${first_name} ${last_name},</p>
            <p>To verify your email address with ${domainEnvironment}.soumyanayar.me, Please click the following link: <a href="http://${domainEnvironment}.soumyanayar.me/v1/verifyUserEmail?email=${userEmail}&token=${userToken}">Verify Email</a> or paste the following link in the browser: http://${domainEnvironment}.soumyanayar.me/v1/verifyUserEmail?email=${userEmail}&token=${userToken}</p>`,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `Verify you user account for ${domainEnvironment}.soumyanayar.me`,
        },
      },
      Source: `userverification@${domainEnvironment}.soumyanayar.me`,
    };

    const data = await ses.sendEmail(params).promise();
    console.log(data);
    console.log("Email sent successfully");

    await logEmailSentToDynamoDB(
      dynamoDbClient,
      emailTrackingDynamoDBTable,
      userEmail
    );
    console.log("Email logged to DynamoDB");
  } else {
    console.log(
      "Email already sent to user: " + userEmail + " No need to send again"
    );
  }
  callback(null, "success");
};
