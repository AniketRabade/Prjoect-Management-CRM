// utils/cookieOptions.js
const expiresInDays = parseInt(process.env.JWT_COOKIE_EXPIRES_IN) || 30; // Fallback to 30 days
const cookieOptions = {
 expires: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

export default cookieOptions;
