var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jeeva37710@gmail.com',
    pass: 'yios kuac qbqn igcd'
  }
});

var mailOptions = {
  from: 'jeeva37710@gmail.com',
  to: 'createjeeva37710@gmail.com',
  subject: 'Sending Email using Node.js',
//   text: 'That was easy!',
//   html: '<h1>Welcome</h1><p>That was easy!</p>'
attachments: [
    {
      filename: 'nodejs.email',
      path: 'https://www.w3schools.com/nodejs/nodejs_email.asp'
    }
  ]
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});