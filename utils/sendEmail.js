const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For development, use ethereal email (fake SMTP)
  // For production, use real SMTP (Gmail, SendGrid, etc.)
  
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    // Production: Real email service
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Development: Console log only (no actual email)
    return {
      sendMail: async (mailOptions) => {
        console.log('\n📧 EMAIL WOULD BE SENT:');
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Text:', mailOptions.text);
        console.log('HTML:', mailOptions.html);
        console.log('\n');
        return { messageId: 'dev-mode-no-email' };
      }
    };
  }
};

// Send OTP email
const sendOTPEmail = async (email, otp, username) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Social Space <noreply@socialspace.com>',
      to: email,
      subject: 'Password Reset OTP - Social Space',
      text: `Hi ${username},\n\nYour OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nThanks,\nSocial Space Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #0095f6; margin-bottom: 20px;">🔐 Password Reset OTP</h2>
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi <strong>${username}</strong>,</p>
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Your OTP for password reset is:</p>
            <div style="background: #0095f6; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 30px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">⏰ This OTP is valid for <strong>10 minutes</strong>.</p>
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999; text-align: center;">
              Thanks,<br>
              <strong>Social Space Team</strong>
            </p>
          </div>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    return false;
  }
};

module.exports = { sendOTPEmail };
