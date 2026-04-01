const nodemailer = require('nodemailer');

// Create transporter
// NOTE: For production, use environment variables for email credentials
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services like SendGrid, Mailgun, etc.
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
});

// For development/testing, you can use Ethereal (fake SMTP service)
// Uncomment this for testing without real email:
/*
const createTestTransporter = async () => {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
};
*/

const sendPasswordResetEmail = async (email, resetToken, userName) => {
    // For web: use query parameter at root
    // For mobile: use deep link format
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8082';
    const resetUrl = `${frontendUrl}?resetToken=${resetToken}`;
    
    // Also provide a mobile deep link format
    const mobileDeepLink = `exp://192.168.1.7:8082?resetToken=${resetToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@fuelqueue.com',
        to: email,
        subject: 'Password Reset Request - Fuel Queue App',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background-color: #f9f9f9;
                        border-radius: 10px;
                        padding: 30px;
                        border: 1px solid #ddd;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #4F46E5;
                        margin: 0;
                    }
                    .content {
                        background-color: white;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background-color: #4F46E5;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .button:hover {
                        background-color: #4338CA;
                    }
                    .footer {
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                        margin-top: 20px;
                    }
                    .warning {
                        background-color: #FEF3C7;
                        border-left: 4px solid #F59E0B;
                        padding: 10px;
                        margin: 15px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⛽ Fuel Queue App</h1>
                    </div>
                    
                    <div class="content">
                        <h2>Password Reset Request</h2>
                        <p>Hi ${userName},</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset Password (Web)</a>
                        </div>
                        
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
                        
                        <p style="margin-top: 20px;"><strong>Using the mobile app?</strong> Copy this link and open it in Expo Go:</p>
                        <p style="word-break: break-all; color: #4F46E5; font-size: 12px;">${mobileDeepLink}</p>
                        
                        <div class="warning">
                            <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                        </div>
                        
                        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                        <p>&copy; ${new Date().getFullYear()} Fuel Queue App. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Password Reset Request
            
            Hi ${userName},
            
            We received a request to reset your password. Click the link below to create a new password:
            
            Web: ${resetUrl}
            
            Mobile (Expo Go): ${mobileDeepLink}
            
            This link will expire in 1 hour for security reasons.
            
            If you didn't request a password reset, please ignore this email.
            
            Best regards,
            Fuel Queue App Team
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        
        // For testing with Ethereal, log the preview URL
        if (process.env.NODE_ENV === 'development') {
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

module.exports = {
    sendPasswordResetEmail
};
