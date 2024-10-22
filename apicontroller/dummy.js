if ((req.originalUrl === '/warden/resetPassword')  || req.originalUrl === '/warden/resetPassword' && req.method === 'POST') {
    return next();
}