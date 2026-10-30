const jwt = require('jsonwebtoken');

function socketAuth({ secret, findUser }) {
  return async (socket, next) => {
    try {
      const claims = jwt.verify(socket.handshake.auth?.token, secret);
      if (!claims.userId || claims.purpose || !claims.exp) throw new Error('Invalid session');
      const user = await findUser(claims.userId);
      if (!user || user.isBanned) throw new Error('Account unavailable');
      socket.data.userId = String(user._id);
      socket.data.expiresAt = claims.exp * 1000;
      next();
    } catch {
      next(new Error('Authentication required'));
    }
  };
}
module.exports = { socketAuth };
