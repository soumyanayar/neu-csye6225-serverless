var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "us-west-2" });

exports.handler = async (event, context, callback) => {
  console.log("Received event:", JSON.stringify(event, null, 4));

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

  // Send email using AWS SES
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
            <p>To verify your email address with demo.soumyanayar.me, Please click the following link: <a href="http://demo.soumyanayar.me/v1/verifyUserEmail?email=${userEmail}&token=${userToken}">Verify Email</a> or paste the following link in the browser: http://demo.soumyanayar.me/v1/verifyUserEmail?email=${userEmail}&token=${userToken}</p>`,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Verify you user account for demo.soumyanayar.me",
      },
    },
    Source: "userverification@demo.soumyanayar.me",
  };

  const data = await ses.sendEmail(params).promise();
  console.log(data);
  console.log("Email sent successfully");
  callback(null, "success");
};
