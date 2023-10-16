const UsersServices = require('./usersServices');

const UsersController = {
  async findAll(req, res) {
    const users = await UsersServices.findAll();
    return res.json(users);
  },

  async findOne({ params }, res) {
    const user = await UsersServices.findOne(Number(params.id));
    return res.json(user);
  },

  async findUserRooms({ query, params }, res) {
    const rooms = await UsersServices.findUserRooms(
      Number(params.id),
      query.filter
    );

    return res.json(rooms);
  },

  async create({ body }, res) {
    const user = await UsersServices.create(body);
    return res.json(user);
  },

  async update({ body, params }, res) {
    const user = await UsersServices.update(Number(params.id), body);
    return res.json(user);
  },

  async delete({ params }, res) {
    const user = await UsersServices.delete(Number(params.id));
    return res.json(user);
  },

  async register({ body }, res) {
    try {
      const { origin, ...userData } = body;
      const { user, code } = await UsersServices.register(userData);
      await UsersServices.sendConfirmEmailRegister({
        email: user.email,
        link: `${origin}/register/confirm?email=${user.email}&code=${code}`,
        name: user.name,
        code,
      });
      return res.json(user);
    } catch (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }
  },

  async confirmRegister({ body }, res) {
    try {
      const { user, token } = await UsersServices.confirmRegister(
        body.email,
        body.code
      );
      return res.json({ user, token });
    } catch (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }
  },

  async login({ body }, res) {
    try {
      const { user, token } = await UsersServices.login(body);
      return res.json({ user, token });
    } catch (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }
  },

  async me({ headers }, res) {
    const authorization = headers.authorization;
    if (!authorization) return res.json(null);

    const token = authorization.replace('Bearer ', '');

    const user = await UsersServices.findByToken(token);

    return res.json({ user });
  },

  async forgetPassword({ body }, res) {
    try {
      const { origin, email } = body;
      const { user, token } = await UsersServices.forgetPassword(email);
      UsersServices.sendResetPasswordEmail({
        name: user.name,
        email,
        token,
        origin,
      });
      return res.json(user);
    } catch (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }
  },

  async resetPassword({ body }, res) {
    try {
      const user = await UsersServices.resetPassword(body);

      return res.json(user);
    } catch (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }
  },

  async updatePassword({ params, body }, res) {
    try {
      const user = await UsersServices.updatePassword(Number(params.id), body);
      return res.json(user);
    } catch (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }
  },

  async joinRoom({ params }, res) {
    try {
      const joinedRoom = await UsersServices.joinRoom(
        Number(params.id),
        params.room
      );
      res.json(joinedRoom);
    } catch (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }
  },

  async updateAvatar({ file, params }, res) {
    try {
      const avatar = await UsersServices.updateAvatar(Number(params.id), file);

      return res.json(avatar);
    } catch (error) {
      return res.status(400).json({ success: false, msg: error.message });
    }
  },
};

module.exports = UsersController;
