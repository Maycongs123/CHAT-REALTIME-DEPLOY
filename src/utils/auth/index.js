const jwt = require('jsonwebtoken');

const AuthService = {
  createToken(payload) {
    const token = jwt.sign(payload, 
         // process.env.SECRET_KEY
         "chat-devplay-node", {
      expiresIn: '30d',
    });
    return token;
  },

  verifyToken(token) {
    try {
      const payload = jwt.verify(token, 
        // process.env.SECRET_KEY
        "chat-devplay-node"
        );
      return payload;
    } catch (error) {
      return null;
    }
  },
};

module.exports = AuthService;
